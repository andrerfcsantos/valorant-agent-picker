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

## Analytics

- **PostHog** gets every interaction as a typed event. The schema lives in
  [`src/lib/analytics.ts`](src/lib/analytics.ts), the only module that talks
  to PostHog, and is kept in step with the Overwatch Hero Picker's.
  Rolls, filter changes and keyboard shortcuts are sampled (see
  `SAMPLE_EVERY`): sum `sample_weight` rather than counting events. Share payloads (`?d=`) are redacted from every event.
- **Google Analytics** gets page views only.
- **Setup:** `.env.production` holds the public project token and host, and a
  production build fails without them. `npm run dev` runs with PostHog off
  unless `.env.local` sets them (see `.env.example`).

## The two designs

The site ships a new design ("refresh"), which is the default, and the classic
design side by side until the classic one is discontinued. Visitors switch
between them from the navbar, and the choice is remembered in their browser.

- **Default:** `NEXT_PUBLIC_DEFAULT_DESIGN` sets what a visitor sees before
  they choose (`refresh` unless set to `classic`). See `.env.example`.
- **Banners:** the new design asks for feedback on Discord, telling visitors
  who got it by default that it is the default now. The classic design says
  it will be discontinued, with a switch to the new one and the Discord link.
- **Code:** each page with two designs has one hook holding its behaviour
  (`src/hooks/usePicker.ts`, `src/hooks/useSquad.ts`,
  `src/hooks/useSharedAgent.ts`, `src/hooks/useSharedSquad.ts`) and two views
  over it. The new views live in `src/components/refresh`, their tokens in
  `src/app/refresh.css`. The About page ships both designs in its HTML and
  CSS shows the visitor's.
- **Adoption:** every PostHog event carries `design` and `design_origin`
  (`default` or `chosen`), and `design_switched` records each switch with the
  control it came from.

## Logos

The master artwork lives in [`images/logo/`](images/logo). Every size the site
uses (navbar logo, favicon, app and home-screen icons, the logo on the social
card) is rendered from it and committed:

```bash
npm run generate-logos
```

Re-run it only when a master logo changes, and look at the results, especially
the 16px favicon.

## Upgrading dependencies

Every dependency is declared as a caret range, so `vp update` is free to move
within a major. The lockfile is what pins exact versions.

| Command               | What it does                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------- |
| `npm run deps:check`  | Reports the Node.js version alignment and splits pending updates into minor/patch and major |
| `npm run deps:update` | Applies every minor/patch update the declared ranges already allow                          |

`deps:update` is the routine one — it only moves the lockfile, so `package.json`
stays untouched and the changes are non-breaking by semver. Run `vp check` and
`npm run build` afterwards and commit `package-lock.json`.

Major updates widen a range in `package.json` and need real testing. Read the
changelog, then take one package at a time with `vp add <name>@latest` (add `-D`
for a devDependency), which writes the new caret range. The `vite` alias is the exception: it moves
with `vite-plus`, so `deps:check` leaves it out of both lists. Validate with `vp check`
and `npm run build` before committing. (Vite+ rejects `vp update --latest` and
`--interactive` in npm projects.)

`vite-plus` and the `vite` alias (`@voidzero-dev/vite-plus-core`) move as a
pair: each Vite+ release requires one exact core build, which
`npm view vite-plus@<version> dependencies.vite` prints. Both are caret ranges, so a
routine update can pick a core the installed CLI rejects, and `vp build` then
stops and asks for `vp migrate`. `npm run deps:check` compares the two in the
lockfile and fails on a mismatch. To fix it, set the `vite` devDependency and
the `vite` override to the exact core version and run `vp install`, then put the
`^` back on both and run `vp install` again. The lockfile keeps the exact
version, and a caret alone would not move a newer, already locked core back
down. `vp migrate` also writes exact pins; turn them back into caret ranges the
same way. The direct `vite` devDependency is there so npm hoists the core to the
top of `node_modules`; without it `vp test` cannot resolve `vite`.

Bumping `@types/node` across a major is a Node.js upgrade, not a types upgrade.
Do it together with `vp env pin <major>` and a matching `engines.node`, in one
commit — `npm run deps:check` reports it if the three ever disagree, and
fails with `--ci`.

`npm run deps:check -- --ci` exits non-zero when the Node.js declarations are out
of sync or when in-range updates are pending, which makes it usable as a CI gate.
A Vite+ mismatch, or a `vp outdated` that failed (for example, the registry is
unreachable), fails `deps:check` with or without `--ci`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
