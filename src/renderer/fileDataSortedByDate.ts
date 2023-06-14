import util from 'node:util'
import childProcess from 'node:child_process'
import fs from 'node:fs'
import * as R from 'ramda'

export type FileData = {
  filePath: string
  // effectively the date the file was "published"
  dateAdded: number
  dateModified?: number
  draft?: boolean
}

const exec = util.promisify(childProcess.exec)

function extractWordsBetweenBrackets(text: string) {
  const regex = /\[([^\]]+)]/g
  return Array.from(
    text.matchAll(regex),
    (match) => match[1]
  )
}

export async function getFileData({
  sortBy
}: {
  sortBy: keyof Pick<FileData, 'dateAdded'>
}) {
  const fsExists = util.promisify(fs.exists)
  const gitListFilesCmd = `git ls-files -- src/documents`

  const filePaths = await exec(gitListFilesCmd)
  const filesArray = filePaths.stdout.trim().split('\n')

  return R.sort(
    R.descend(R.prop(sortBy)),
    await filesArray.reduce(async (results, filePath) => {
      if (!(await fsExists(filePath))) {
        console.log(
          'file does not exist',
          filePath,
          'skipping'
        )
        return results
      }
      const gitGetFileInfoCmd = `git log --format=[%ct][%h] --diff-filter=A -n1 ${filePath}`
      const { stderr, stdout } = await exec(
        gitGetFileInfoCmd
      )
      if (stderr) {
        console.error(stderr)
      }
      const [timestamp] =
        extractWordsBetweenBrackets(stdout)
      const info: FileData = {
        dateAdded: Number(timestamp) * 1000,
        filePath
      }
      return [...(await results), info]
    }, Promise.resolve([] as FileData[]))
  )
}
