import { exec } from 'child_process'
import fs from 'fs-extra'
import { marked } from 'marked'
import Prism from 'prismjs'
import loadLanguages from 'prismjs/components/'

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

const baseStyles = [
  /* html */ `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Geologica:wght@400;600&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">`,
  '<link rel="stylesheet" href="styles/reset.css" />',
  '<link rel="stylesheet" href="styles/base.css" />',
  '<link rel="stylesheet" href="styles/header.css" />',
  '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
]
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
    ...baseStyles,
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
     </main>`
  ].join('\n')
}

interface Page {
  html: string
  slug: string
}

function getGitFileFromHash(
  commitHash: string,
  filePath: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(
      `git show ${commitHash}:${filePath}`,
      (error, stdout) => {
        if (error) {
          reject(error)
          return
        }
        resolve(stdout)
      }
    )
  })
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
            ...baseStyles,
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
            </main>`
          ].join(''),
          slug
        }
      })
  )
}

function writePages(pages: Page[]) {
  return Promise.all(
    pages.map((page) =>
      fs.writeFile(`${buildDir}/${page.slug}`, page.html)
    )
  )
}

exec(
  'git log --graph --oneline --name-status --diff-filter=AM -- "src/documents/"',
  async (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`)
      return
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`)
      return
    }
    const parsedLog = parseGitLog(stdout)
    const renderedHomePage = renderBlogHome(parsedLog)

    console.log('Preparing build...')
    const buildStartTime = performance.now()

    await fs.emptyDir(buildDir)
    await fs.writeFile(
      `${buildDir}/index.html`,
      renderedHomePage
    )
    const renderedPages = await renderPages(parsedLog)
    await writePages(renderedPages)
    await fs.copy('src/styles', `${buildDir}/styles`)

    const buildTotalTime =
      performance.now() - buildStartTime
    console.log(
      'Build complete! Took',
      buildTotalTime,
      'ms'
    )
    console.log('Build output in', buildDir)
  }
)
