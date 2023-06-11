# keeping it simple

This is the third iteration of my personal site and the simplest by far. I came up with this idea of using `git-log` as the source of data to build the site's content.

The build process is really quite simple:
1. get the entire git commit tree
    ```bash
    git log --graph --oneline --name-status --diff-filter=AM -- "src/documents/"
    ```
2. process each line to extract the commit hash and file path
3. render individual pages based on the file path of each modified file
4. write each page to a `build` folder
5. deploy to a static site service such as [surge.sh](https://surge.sh)
