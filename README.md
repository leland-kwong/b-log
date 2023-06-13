# B-LOG

A website that is generated from reading git data.

## How the build system works

The build system treats git as the source of truth. This means the moment a change is committed to git it is considered ready for production. Unstaged changes are considered draft changes and are not added to the production build.
