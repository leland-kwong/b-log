# Keeping it Simple

This is the third iteration of my personal site and the simplest by far. I just thought of the idea to use Git as the source of truth to build the site content. This makes the build stateless and allows us to leverage the power of git to determine the status of a document (published, draft, modified, deleted, etc...). And because Git logs everything we can easily extract more data for new features.

## Build Process

The build process turns out to be quite simple:

1. Get all document files in the git repo:
    ```sh
    git ls-files -- src/documents
    ```
2. Process each line with the following command to get the timestamp and commit hash
    ```sh
    git log --format=[%ct][%h] -n1 {filePath}
    ```
3. Render individual pages based on the file path of each modified file.
4. Write each page to a `build` folder.
5. Deploy to a static site service such as [vercel](https://vercel.com) or [surge.sh](https://surge.sh).
