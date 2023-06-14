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
  markdownBody: string
}

const exec = util.promisify(childProcess.exec)

function extractWordsBetweenBrackets(text: string) {
  const regex = /\[([^\]]+)]/g
  return Array.from(
    text.matchAll(regex),
    (match) => match[1]
  )
}

async function getLatestGitFileInfo(
  diffFilters: string,
  filePath: string
) {
  const gitCmd = `git log --format=[%ct][%h] --diff-filter=${diffFilters} -n1 ${filePath}`
  const { stderr, stdout } = await exec(gitCmd)
  if (stderr) {
    console.error(stderr)
  }
  const [timestampSeconds, commitHash] =
    extractWordsBetweenBrackets(stdout)
  const timestamp = Number(timestampSeconds) * 1000
  return {
    timestamp,
    commitHash
  }
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
      const { timestamp: dateAdded } =
        await getLatestGitFileInfo('A', filePath)
      const {
        timestamp: dateAddedOrLastModified,
        commitHash: latestCommitHash
      } = await getLatestGitFileInfo('AM', filePath)
      const isModified =
        dateAdded !== dateAddedOrLastModified
      const markdownBody = await exec(
        `git show ${latestCommitHash}:${filePath}`
      ).then(({ stdout }) => stdout)
      const fileData: FileData = {
        dateAdded: dateAdded,
        dateModified: isModified
          ? dateAddedOrLastModified
          : undefined,
        filePath,
        markdownBody
      }
      return [...(await results), fileData]
    }, Promise.resolve([] as FileData[]))
  )
}
