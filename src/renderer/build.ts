import childProcess from 'node:child_process'
import { DateTime } from 'luxon'
import util from 'util'
import fs from 'fs-extra'
import { marked } from 'marked'
import Prism from 'prismjs'
import loadLanguages from 'prismjs/components/'
import * as async from 'async'

import { fileDataSortedByDate } from './fileDataSortedByDate'
import type { FileData } from './fileDataSortedByDate'

import { measurePerformance } from './utils'

loadLanguages(['typescript', 'bash', 'json', 'jsx', 'tsx'])

const siteConfig = {
  dayJobCompany: {
    name: 'Palo Alto Networks',
    url: 'https://www.paloaltonetworks.com/'
  }
}

const buildDir =
  process.env.NODE_ENV === 'development'
    ? '.local-dev-build'
    : 'build'
const headContent = /* html */ `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Geologica:wght@400;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet"><link rel="stylesheet" href="styles/reset.css" />
  <link rel="stylesheet" href="assets/fontawesome/css/brands.min.css" />
  <link rel="stylesheet" href="assets/fontawesome/css/fontawesome.min.css" />
  <link rel="stylesheet" href="styles/base.css" />
  <link rel="stylesheet" href="styles/header.css" />
  <link rel="stylesheet" href="styles/footer.css" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://scripts.sirv.com/sirvjs/v3/sirv.js"></script>
`
const header = /* html */ `
  <header class="header">
    <div class="innerContainer headerInnerContainer">
      <a href="index.html" class="headerLink navLink navLogo">L K</a>
      <div class="headerRightColumn">
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
      <div class="aboutMe footerSection">
        <div class="aboutMeImage">
          <img class="Sirv" data-src="https://vicenbis.sirv.com/Images/lelandkwong.com/IMG_1387.jpeg" alt="">
        </div>
        <div class="aboutMeText">
          <div class="aboutMeHello">Hello! My name is Leland Kwong. I work at <a href="${siteConfig.dayJobCompany.url}">${siteConfig.dayJobCompany.name}</a> as a software engineer.</div>
          <p>I believe the best digital products involve a great user experience, tasteful design, and high-quality code.</p>
        </div>
      </div>
      <div class="footerSection">
        <div class="fontSmall">This site was deployed with <a href="https://vercel.com/">Vercel</a> and statically generated with a homebrew system.</div>
        </div>
      </div>
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
    code: highlightCode,
    heading(text, level) {
      return `
        <h${level}
          class="mdHeader mdHeader${level}"
        >${text}
        </h${level}>`.trim()
    }
  }
})

function slugFromFileData(fileData: FileData): string {
  const slug = [
    fileData.filePath
      .split('/')
      .at(-1)
      ?.replace(/.md/, '')!,
    '.html'
  ].join('')

  if (fileData.draft) {
    return `DRAFT--${slug}`
  }

  return slug
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

async function getFile(filePath: string): Promise<string> {
  const readFile = util.promisify(fs.readFile)
  const file = await readFile(filePath, 'utf8')

  return file
}

async function getDrafts(): Promise<FileData[]> {
  const getListOfDocumentsInRepo =
    'git status --porcelain -- src/documents | grep -wv D'
  try {
    const { stderr, stdout } = await util.promisify(
      childProcess.exec
    )(getListOfDocumentsInRepo)
    if (stderr) {
      throw new Error(stderr)
    }
    const fileList = stdout
      .split('\n')
      .filter(Boolean)
      // get just the file path ignoring the modification status
      .map((line) => line.slice(3))

    return fileList.map((filePath) => ({
      filePath,
      timestamp: DateTime.utc().toMillis(),
      draft: true
    }))
  } catch (error: any) {
    const noLines =
      (error as childProcess.ExecException).code === 1
    if (noLines) {
      return []
    }
    throw error
  }
}

function renderPages(
  fileDataSortedByDate: FileData[]
): Promise<Page[]> {
  return Promise.all(
    fileDataSortedByDate.map(async (fileData) => {
      const slug = slugFromFileData(fileData)
      const gitFile = await getFile(fileData.filePath)
      const { timestamp } = fileData

      return {
        html: [
          headContent,
          '<link rel="stylesheet" href="styles/prism-theme.css" />',
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
  const drafts =
    process.env.NODE_ENV === 'development'
      ? await getDrafts()
      : []
  const fileDataList = [
    ...drafts,
    ...(await measurePerformance(
      'Get file data',
      fileDataSortedByDate
    ))
  ]
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
  })
  .catch(async (err) => {
    console.error(err)

    process.exit(1)
  })
