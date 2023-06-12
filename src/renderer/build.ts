import { DateTime } from 'luxon'
import util from 'util'
import fs from 'fs-extra'
import { marked } from 'marked'
import Prism from 'prismjs'
import loadLanguages from 'prismjs/components/'
import * as async from 'async'

import { fileDataSortedByDate } from './fileDataSortedByDate'
import type { FileData } from './fileDataSortedByDate'

import {
  measurePerformance,
  cacheGet,
  cacheSet,
  cacheClose
} from './utils'

loadLanguages(['typescript', 'bash', 'json', 'jsx', 'tsx'])

const buildDir =
  process.env.NODE_ENV === 'development'
    ? '.local-dev-build'
    : 'build'
const headContent = /* html */ `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Geologica:wght@400;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet"><link rel="stylesheet" href="styles/reset.css" />
  <link rel="stylesheet" href="styles/base.css" />
  <link rel="stylesheet" href="styles/header.css" />
  <link rel="stylesheet" href="styles/footer.css" />
  <link rel="stylesheet" href="assets/fontawesome/css/brands.min.css" />
  <link rel="stylesheet" href="assets/fontawesome/css/fontawesome.min.css" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://scripts.sirv.com/sirvjs/v3/sirv.js"></script>
`
const header = /* html */ `
  <header class="header">
    <div class="innerContainer headerInnerContainer">
      <a href="index.html" class="headerLink navLink navLogo">L K</a>
      <div>
        <a href="about.html" class="headerLink navLink">About</a>
        <a href="https://github.com/leland-kwong" class="headerLink">
          <i class="font-icon fa-brands fa-github"></i>
        </a>
      </div>
    </div>
  </header>
`
const footer = /* html */ `
  <footer class="footer">
    <div class="innerContainer">
      Deployed with <a href="https://vercel.com/">Vercel</a>
    </div>
  </footer>
`

function postDate(timestamp: number) {
  return DateTime.fromMillis(timestamp).toFormat(
    'LL/dd/yyyy'
  )
}

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

function slugFromFileData(fileData: FileData): string {
  return [
    fileData.filePath
      .split('/')
      .at(-1)
      ?.replace(/.md/, '')!,
    '.html'
  ].join('')
}

function renderBlogHome(fileDataSortedByDate: FileData[]) {
  const postsList = fileDataSortedByDate
    .map((fileData) => {
      const slug = slugFromFileData(fileData)
      const titleFromFilePath = fileData.filePath
        .split('/')
        .at(-1)
        ?.replace(/.md/, '')
        .replace(/-/g, ' ')
      const { timestamp } = fileData
      return `
        <div class="postItem">
          <a class="postLink" href="${slug}">${titleFromFilePath}</a>
          <span class="postDate">${postDate(
            timestamp
          )}</span>
        </div>
      `
    })
    .join('')

  return [
    headContent,
    '<link rel="stylesheet" href="styles/home.css" />',
    header,
    `<main>
      <div class="innerContainer">
        <div class="postsList">
          ${postsList}
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

async function getFile(
  filePath: string,
  modificationDate: number
): Promise<string> {
  const cacheKey = `getFile-${filePath}-${modificationDate}`
  const cached = await cacheGet(cacheKey)

  if (cached) {
    return cached
  }

  const readFile = util.promisify(fs.readFile)
  const file = await readFile(filePath, 'utf8')

  cacheSet(cacheKey, file)
  return file
}

function renderPages(
  fileDataSortedByDate: FileData[]
): Promise<Page[]> {
  return Promise.all(
    fileDataSortedByDate.map(async (fileData) => {
      const slug = slugFromFileData(fileData)
      const gitFile = await getFile(
        fileData.filePath,
        fileData.timestamp
      )
      const { timestamp } = fileData

      return {
        html: [
          headContent,
          '<link rel="stylesheet" href="styles/prism-theme.min.css" />',
          '<link rel="stylesheet" href="styles/page.css" />',
          header,
          `<main>
              <div class="innerContainer">
                <span class="postDate">${postDate(
                  timestamp
                )}</span>
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

async function build() {
  const fileDataList = await measurePerformance(
    'Get file data',
    fileDataSortedByDate
  )
  const renderedHomePage = renderBlogHome(fileDataList)
  const renderedPages = await measurePerformance(
    'Render pages',
    () => renderPages(fileDataList)
  )
  await measurePerformance('Write pages', async () => {
    await fs.emptyDir(buildDir)
    await fs.writeFile(
      `${buildDir}/index.html`,
      renderedHomePage
    )
    await writePages(renderedPages)
    await fs.copy('src/styles', `${buildDir}/styles`)
    await fs.copy('src/assets', `${buildDir}/assets`)
  })
}

console.log('Preparing build...')
const buildStartTime = performance.now()

build()
  .then(async () => {
    const buildTotalTime =
      performance.now() - buildStartTime
    console.log(
      'Build complete! Took',
      buildTotalTime,
      'ms'
    )
    console.log('Build output in', buildDir)

    await cacheClose()
  })
  .catch(async (err) => {
    console.error(err)

    await cacheClose()
    process.exit(1)
  })
