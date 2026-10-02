# CI workflow (ready, not active)

`ci.yml` here runs tsc, eslint (6-warning baseline), vitest and the build on every push and PR.
It is not in `.github/workflows/` because the GitHub token used for pushes has no `workflow` scope, so GitHub refuses the push.
To activate: in GitHub, add the file as `.github/workflows/ci.yml` (web editor, "Add file"), or give the push token the `workflow` scope and move it.
Run the live smoke check any time with `npm run smoke`.
