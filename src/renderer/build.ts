import debounce from 'debounce'
import chokidar from 'chokidar'
import childProcess from 'node:child_process'
import { DateTime } from 'luxon'
import util from 'util'
import fs from 'fs-extra'
import { marked } from 'marked'
import * as async from 'async'

import { getFileData } from './fileDataSortedByDate'
import type { FileData } from './fileDataSortedByDate'
import { measurePerformance } from './utils'
import { siteConfig } from './siteConfig'
import { headContent, header, footer } from './shared-html'
import { highlightCode } from './highlightCode'

type CompleteDocument = FileData & {
  markdownBody: string
}

function postDate(timestamp: number) {
  return DateTime.fromMillis(timestamp).toFormat(
    'LL/dd/yyyy'
  )
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

function draftClassFromFileData(
  fileData: FileData
): string {
  if (fileData.draft) {
    return 'isDraft'
  }
  return ''
}

function renderBlogHome(
  fileDataSortedByDate: CompleteDocument[]
) {
  const postsList = fileDataSortedByDate
    .map((parsedDocument) => {
      const slug = slugFromFileData(parsedDocument)
      const draftClass =
        draftClassFromFileData(parsedDocument)
      const titleFromFilePath = parsedDocument.filePath
        .split('/')
        .at(-1)
        ?.replace(/.md/, '')
        .replace(/-/g, ' ')
      const { dateAdded } = parsedDocument
      return `
        <div class="postItem">
          <a class="postLink ${draftClass}" href="${slug}">${titleFromFilePath}</a>
          <span class="postDate">${postDate(
            dateAdded
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

async function readFile(filePath: string): Promise<string> {
  const readFile = util.promisify(fs.readFile)
  const file = await readFile(filePath, 'utf8')

  return file
}

// gets document data for unstaged files
async function getUncommittedFiles(): Promise<FileData[]> {
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
      // get just the file path excluding the modification status
      .map((line) => line.slice(3))

    return fileList.map((filePath) => ({
      filePath,
      // TODO: get the actual date added from git, and if it
      // is a new file, then just use the current date
      dateAdded: DateTime.utc().toMillis(),
      dateModified: DateTime.utc().toMillis(),
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
  parsedDocumentList: CompleteDocument[]
): Page[] {
  return parsedDocumentList.map((parsedDocument) => {
    const { markdownBody } = parsedDocument
    const slug = slugFromFileData(parsedDocument)
    const draftClass =
      draftClassFromFileData(parsedDocument)
    const { dateAdded } = parsedDocument
    const htmlFromMarkdown = marked.parse(markdownBody, {
      mangle: false,
      headerIds: false
    })

    return {
      html: [
        headContent,
        '<link rel="stylesheet" href="styles/page.css" />',
        header,
        `<main>
              <div class="innerContainer">
                <span class="postDate ${draftClass}">${postDate(
          dateAdded
        )}</span>
                ${htmlFromMarkdown}
              </div>
            </main>`,
        footer
      ].join(''),
      slug
    }
  })
}

async function writeHomePage(
  content: string,
  buildDir: string
) {
  await fs.writeFile(`${buildDir}/index.html`, content)
}

function writePages(
  pages: Page[],
  buildDir: string
): Promise<void> {
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

async function build({
  buildDir,
  parsedDocumentList
}: {
  buildDir: string
  parsedDocumentList: CompleteDocument[]
}) {
  const buildStartTime = performance.now()

  const renderedHomePage = await measurePerformance(
    'Render homepage',
    () => renderBlogHome(parsedDocumentList)
  )
  const renderedPages = await measurePerformance(
    'Render pages',
    () => renderPages(parsedDocumentList)
  )
  await measurePerformance('Prepare dirs', async () => {
    await fs.ensureDir(buildDir)
    await fs.emptyDir(buildDir)
  })
  await measurePerformance('Write pages', async () => {
    await writeHomePage(renderedHomePage, buildDir)
    await writePages(renderedPages, buildDir)
  })
  await measurePerformance('Copy assets', async () => {
    await fs.copy('src/styles', `${buildDir}/styles`)
    await fs.copy('src/assets', `${buildDir}/assets`)
  })

  const buildTotalTime = performance.now() - buildStartTime
  console.log('Build complete! Took', buildTotalTime, 'ms')
  console.log('Build output to:', buildDir)
}

console.log('Watching documents for changes...')
chokidar
  .watch(
    [siteConfig.documentsDir, 'src/styles', 'src/assets'],
    {}
  )
  .on(
    'all',
    debounce(async () => {
      console.log('Changes detected, rebuilding...')
      const totalBuildTimeStart = performance.now()
      const commitedFiles = await measurePerformance(
        'Get file data',
        () => getFileData({ sortBy: 'dateAdded' })
      )
      const parsedCommitedFiles: CompleteDocument[] =
        await Promise.all(
          commitedFiles.map(async (fileData) => ({
            ...fileData,
            markdownBody: await readFile(fileData.filePath)
          }))
        )

      if (process.env.NODE_ENV === 'development') {
        const uncommittedFiles = await getUncommittedFiles()
        const parsedUncommittedFiles: CompleteDocument[] =
          await Promise.all(
            uncommittedFiles.map(async (fileData) => ({
              ...fileData,
              markdownBody: await readFile(
                fileData.filePath
              )
            }))
          )

        await build({
          buildDir: '.local-dev-build',
          parsedDocumentList: [
            ...parsedUncommittedFiles,
            ...parsedCommitedFiles
          ]
        })
      }

      await build({
        buildDir: siteConfig.buildDir,
        parsedDocumentList: parsedCommitedFiles
      })
      console.log(
        'Total build time:',
        performance.now() - totalBuildTimeStart,
        'ms'
      )

      // only watch for changes in dev mode
      if (process.env.NODE_ENV !== 'development') {
        process.exit(0)
      }
    }, 100)
  )
