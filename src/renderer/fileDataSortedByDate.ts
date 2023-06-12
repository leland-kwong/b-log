import util from 'node:util'
import childProcess from 'node:child_process'
import * as R from 'ramda'

export type FileData = {
  // timestamp in milliseconds
  timestamp: number
  commitHash: string
  filePath: string
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
  const gitListFilesCmd = [
    `cd ${workingDir}`,
    ' && ',
    `git ls-files -- src/documents`
  ].join('')
  const filePaths = await exec(gitListFilesCmd)
  const filesArray = filePaths.stdout.trim().split('\n')

  return R.sort(
    R.descend(R.prop('timestamp')),
    await Promise.all(
      filesArray.map(async (filePath) => {
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
        const [timestamp, commitHash] =
          extractWordsBetweenBrackets(stdout)
        const info: FileData = {
          timestamp: Number(timestamp) * 1000,
          commitHash,
          filePath
        }
        return info
      })
    )
  )
}
