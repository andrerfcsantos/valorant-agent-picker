This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Requirements

- [Node.js](https://nodejs.org/en/) 24 (the active LTS line)

The required major is declared in `package.json` in two places: `engines.node`,
which makes `npm install` fail on the wrong major (`engine-strict=true` is set in
`.npmrc`), and `devEngines.runtime`, which [Vite+](https://viteplus.dev) uses to
download and select the right runtime automatically. `@types/node` is kept on the
same major so the types match what actually runs.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Upgrading dependencies

Every dependency is declared as a caret range, so `vp update` is free to move
within a major. The lockfile is what pins exact versions.

| Command                     | What it does                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------- |
| `npm run deps:check`        | Reports the Node.js version alignment and splits pending updates into minor/patch and major |
| `npm run deps:update`       | Applies every minor/patch update the declared ranges already allow                          |
| `npm run deps:update:major` | Interactively picks major updates, which widen the ranges in `package.json`                 |

`deps:update` is the routine one — it only moves the lockfile, so `package.json`
stays untouched and the changes are non-breaking by semver. Run `vp check` and
`npm run build` afterwards and commit `package-lock.json`.

`deps:update:major` crosses major boundaries and needs real testing: read the
changelog for each package, take them one at a time where possible, and validate
with `vp check` and `npm run build` before committing.

Bumping `@types/node` across a major is a Node.js upgrade, not a types upgrade.
Do it together with `vp env pin <major>` and a matching `engines.node`, in one
commit — `npm run deps:check` fails if the three ever disagree.

`npm run deps:check -- --ci` exits non-zero when the Node.js declarations are out
of sync or when in-range updates are pending, which makes it usable as a CI gate.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
