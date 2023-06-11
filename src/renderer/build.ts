import util from 'util'
import childProcess from 'child_process'
import fs from 'fs-extra'
import { marked } from 'marked'
import Prism from 'prismjs'
import loadLanguages from 'prismjs/components/'
import * as async from 'async'

import {
  measurePerformance,
  cacheGet,
  cacheSet,
  cacheClose
} from './utils'

loadLanguages(['typescript', 'bash', 'json', 'jsx', 'tsx'])

type GitLine = {
  type: 'commit' | 'file'
  message: string
  commitHash: string
}

const buildDir =
  process.env.NODE_ENV === 'development'
    ? '.local-dev-build'
    : 'build'

const headContent = /* html */ `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Geologica:wght@400;600&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles/reset.css" />
  <link rel="stylesheet" href="styles/base.css" />
  <link rel="stylesheet" href="styles/header.css" />
  <link rel="stylesheet" href="styles/footer.css" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
`

const devJs =
  process.env.NODE_ENV === 'development'
    ? `<script>
      window.addEventListener('visibilitychange', (e) => {
        window.location.reload();
      })
    </script>`
    : ''
const header = /* html */ `
  <header class="header">
    <div class="innerContainer">
      <a href="index.html" class="headerLink">Home</a>
    </div>
  </header>
`
const footer = /* html */ `
  <footer class="footer">
    <div class="innerContainer">
      Deployed via <a href="https://vercel.com/">Vercel</a>
    </div>
  </footer>
`

function highlightCode(code: string, lang: string) {
  const langDef = Prism.languages[lang]

  if (!langDef) {
    throw new Error(
      `[prismjs error] language \`${lang}\` not supported. Please add the language in your .babelrc file.`
    )
  }

  const highlightedCode = Prism.highlight(
    code,
    langDef,
    lang
  )

  return `<pre class="language-${lang}"><code class="language-${lang}">${highlightedCode}</code></pre>`
}

marked.use({
  renderer: {
    code: highlightCode
  }
})

function slugFromGitLine(gitLine: GitLine) {
  return [
    gitLine.commitHash,
    '-',
    gitLine.message.split('/').at(-1)?.replace(/.md/, '')!,
    '.html'
  ].join('')
}

function parseGitLog(log: string) {
  return (
    log
      .split(/\n/g)
      // the last line is empty so we can ignore it
      ?.slice(0, -1)
      .reduce(
        (acc, line) => {
          const { commitHash, parsed } = acc
          const isCommitLine = /^\*/.test(line)

          if (isCommitLine) {
            return {
              commitHash: line.split(' ')[1],
              parsed: [
                ...parsed,
                {
                  type: 'commit',
                  message: line,
                  commitHash
                }
              ] as GitLine[]
            }
          }

          return {
            commitHash,
            parsed: [
              ...parsed,
              { type: 'file', message: line, commitHash }
            ] as GitLine[]
          }
        },
        { commitHash: '', parsed: [] } as {
          commitHash: string
          parsed: GitLine[]
        }
      ).parsed
  )
}

function renderBlogHome(gitLines: GitLine[]) {
  const logList = gitLines
    .map((line) => {
      if (line.type === 'file') {
        const slug = slugFromGitLine(line)
        const commitMessage = line.message.replace(
          /\s/g,
          '&nbsp;'
        )
        return `<div><a class="postLink" href="${slug}">${commitMessage}</a></div>`
      }

      const [char1, commitHash, ...commitMessage] =
        line.message.split(' ')
      return [
        '<div>',
        char1,
        `<span class="commitHash">${commitHash}</span>`,
        commitMessage.join(' '),
        '</div>'
      ].join(' ')
    })
    .join('')

  return [
    headContent,
    '<link rel="stylesheet" href="styles/home.css" />',
    devJs,
    header,
    `<main>
      <div class="innerContainer">
        <h1>Home</h1>
        <div class="logList">
          ${logList}
        </div>
      </div>
     </main>`,
    footer
  ].join('\n')
}

interface Page {
  html: string
  slug: string
}

async function getGitFileFromHash(
  commitHash: string,
  filePath: string
): Promise<string> {
  const cacheKey = `${commitHash}:${filePath}`
  const cached = await cacheGet(cacheKey)

  if (cached) {
    return cached
  }

  const exec = util.promisify(childProcess.exec)
  const { stderr, stdout } = await exec(
    `git show ${cacheKey}`
  )

  if (stderr) {
    return stderr
  }
  cacheSet(cacheKey, stdout)
  return stdout
}

function renderPages(gitLines: GitLine[]): Promise<Page[]> {
  return Promise.all(
    gitLines
      .filter((line) => line.type === 'file')
      .map(async (line) => {
        const { message } = line
        const filePath = message.slice(4)
        const slug = slugFromGitLine(line)
        const gitFile = await getGitFileFromHash(
          line.commitHash,
          filePath
        )

        return {
          html: [
            headContent,
            '<link rel="stylesheet" href="styles/prism-theme.min.css" />',
            '<link rel="stylesheet" href="styles/page.css" />',
            devJs,
            header,
            `<main>
              <div class="innerContainer">
                ${marked.parse(gitFile, {
                  mangle: false,
                  headerIds: false
                })}
              </div>
            </main>`,
            footer
          ].join(''),
          slug
        }
      })
  )
}

function writePages(pages: Page[]): Promise<void> {
  return new Promise((resolve, reject) => {
    async.eachSeries(
      pages,
      async (page) => {
        await fs.writeFile(
          `${buildDir}/${page.slug}`,
          page.html
        )
      },
      (err) => {
        if (err) {
          reject(err)
          return
        }
        resolve()
      }
    )
  })
}

console.log('Preparing build...')
const buildStartTime = performance.now()

childProcess.exec(
  'git log --graph --oneline --name-status --diff-filter=AM -- "src/documents/"',
  async (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`)
      await cacheClose()
      return
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`)
      await cacheClose()
      return
    }
    const parsedLog = parseGitLog(stdout)
    const renderedHomePage = renderBlogHome(parsedLog)

    const renderedPages = await measurePerformance(
      'Render pages',
      () => renderPages(parsedLog)
    )
    await measurePerformance('Write pages', async () => {
      await fs.emptyDir(buildDir)
      await fs.writeFile(
        `${buildDir}/index.html`,
        renderedHomePage
      )
      await writePages(renderedPages)
      await fs.copy('src/styles', `${buildDir}/styles`)
    })

    const buildTotalTime =
      performance.now() - buildStartTime
    console.log(
      'Build complete! Took',
      buildTotalTime,
      'ms'
    )
    console.log('Build output in', buildDir)
    await cacheClose()
  }
)
