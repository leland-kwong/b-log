import util from 'node:util'
import childProcess from 'node:child_process'
import fs from 'node:fs'
import * as R from 'ramda'

export type FileData = {
  // timestamp in milliseconds
  timestamp: number
  filePath: string
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

export async function fileDataSortedByDate(
  workingDir = '.'
) {
  const fsExists = util.promisify(fs.exists)
  const gitListFilesCmd = [
    `cd ${workingDir}`,
    ' && ',
    `git ls-files -- src/documents`
  ].join('')
  const filePaths = await exec(gitListFilesCmd)
  const filesArray = filePaths.stdout.trim().split('\n')

  return R.sort(
    R.descend(R.prop('timestamp')),
    await filesArray.reduce(async (results, filePath) => {
      if (!(await fsExists(filePath))) {
        console.log(
          'file does not exist',
          filePath,
          'skipping'
        )
        return results
      }
      const gitGetFileInfoCmd = [
        `cd ${workingDir}`,
        ' && ',
        `git log --format=[%ct][%h] -n1 ${filePath}`
      ].join('')
      const { stderr, stdout } = await exec(
        gitGetFileInfoCmd
      )
      if (stderr) {
        console.error(stderr)
      }
      const [timestamp] =
        extractWordsBetweenBrackets(stdout)
      const info: FileData = {
        timestamp: Number(timestamp) * 1000,
        filePath
      }
      return [...(await results), info]
    }, Promise.resolve([] as FileData[]))
  )
}
