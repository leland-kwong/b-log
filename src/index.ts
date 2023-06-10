import { exec } from 'child_process'

exec(
  'git log --graph --oneline --name-status',
  (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`)
      return
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`)
      return
    }
    console.log(stdout)
  }
)
