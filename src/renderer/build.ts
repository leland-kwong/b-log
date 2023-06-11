import { exec } from 'child_process'
import fs from 'fs-extra'
import { marked } from 'marked'

type GitLine = {
  type: 'commit' | 'file'
  message: string
}

const buildDir = 'build'

const baseStyles = [
  '<link rel="stylesheet" href="styles/reset.css" />',
  '<link rel="stylesheet" href="styles/base.css" />'
]
const devJs =
  process.env.NODE_ENV === 'development'
    ? `<script>
      window.addEventListener('visibilitychange', (e) => {
        window.location.reload();
      })
    </script>`
    : ''

function slugFromGitLine(gitLine: GitLine) {
  return [
    gitLine.message.split('/').at(-1)?.replace(/.md/, '')!,
    '.html'
  ].join('')
}

function parseGitLog(log: string): GitLine[] {
  return (
    log
      .split(/\n/g)
      // the last line is empty so we can ignore it
      ?.slice(0, -1)
      .map((line) => {
        if (/^\*/.test(line)) {
          return { type: 'commit', message: line }
        }

        return { type: 'file', message: line }
      })
  )
}

function renderBlogHome(gitLines: GitLine[]) {
  const logList = gitLines
    .map((line) => {
      if (line.type === 'file') {
        const slug = slugFromGitLine(line)
        return `<div><a href="${slug}">${line.message.replace(
          /\s/g,
          '&nbsp;'
        )}</a></div>`
      }

      const [char1, commitHash, ...commitMessage] =
        line.message.split(' ')
      return [
        '<h2>',
        char1,
        `<span class="commitHash">${commitHash}</span>`,
        commitMessage.join(' '),
        '</h2>'
      ].join(' ')
    })
    .join('')

  return [
    ...baseStyles,
    '<link rel="stylesheet" href="styles/home.css" />',
    devJs,
    logList
  ].join('\n')
}

interface Page {
  html: string
  slug: string
}

function renderPages(gitLines: GitLine[]): Promise<Page[]> {
  return Promise.all(
    gitLines
      .filter((line) => line.type === 'file')
      .map(async (line) => {
        const { message } = line
        const filePath = message.slice(4)
        const slug = slugFromGitLine(line)

        return {
          html: [
            ...baseStyles,
            '<link rel="stylesheet" href="styles/page.css" />',
            devJs,
            await fs
              .readFile(filePath, 'utf-8')
              .then((file) =>
                marked.parse(file, {
                  mangle: false,
                  headerIds: false
                })
              )
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
    try {
      await fs.emptyDir(buildDir)
      await fs.writeFile(
        `${buildDir}/index.html`,
        renderedHomePage
      )
      const renderedPages = await renderPages(parsedLog)
      await writePages(renderedPages)
      await fs.copy('src/styles', `${buildDir}/styles`)
      console.log('html files generated')
    } catch (err) {
      console.error(err)
    }
  }
)
