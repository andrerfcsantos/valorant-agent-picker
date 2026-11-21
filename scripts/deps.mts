import {
  execSync,
  type ExecSyncOptionsWithStringEncoding,
} from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = path.resolve(import.meta.dirname, "..");
const PACKAGE_JSON_PATH = path.join(ROOT_DIR, "package.json");

const CI = process.argv.includes("--ci");

type OutdatedEntry = {
  current?: string;
  wanted: string;
  latest: string;
};

type PackageJson = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  engines?: { node?: string };
  devEngines?: { runtime?: { version?: string } };
};

const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;

const pkg: PackageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, "utf8"));

/** First numeric component of a version or range: "^24.13.3" -> 24. */
function major(range: string | undefined): number | null {
  const match = range?.match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

function readOutdated(): Record<string, OutdatedEntry> {
  const options: ExecSyncOptionsWithStringEncoding = {
    cwd: ROOT_DIR,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  };

  // Having outdated packages is itself a non-zero exit, which is the normal
  // case here, so a failed run is told apart from a normal one by whether it
  // still produced parseable JSON rather than by the exit code. Reporting an
  // all-clear because the command never ran would be worse than crashing:
  // inside an npm script `node_modules/.bin/vp` shadows the global binary, so
  // a stale local `vite-plus` can be missing the subcommand outright.
  let stdout: string | undefined;
  try {
    stdout = execSync("vp outdated --format json", options);
  } catch (error) {
    stdout = (error as { stdout?: string }).stdout;
  }

  // An empty report means nothing is outdated. Anything else must be npm's
  // name -> row map: a failed registry request also prints JSON, as
  // {"error": {...}}, and reading that as data would report an all-clear.
  if (stdout !== undefined && !stdout.trim()) return {};
  let parsed: unknown;
  try {
    parsed = stdout === undefined ? undefined : JSON.parse(stdout);
  } catch {
    // Reported below.
  }
  const isRow = (row: unknown) =>
    typeof row === "object" &&
    row !== null &&
    typeof (row as OutdatedEntry).wanted === "string" &&
    typeof (row as OutdatedEntry).latest === "string";
  if (
    typeof parsed === "object" &&
    parsed !== null &&
    !Array.isArray(parsed) &&
    !("error" in parsed) &&
    Object.values(parsed).every(isRow)
  ) {
    return parsed as Record<string, OutdatedEntry>;
  }

  const npmError = (parsed as { error?: { code?: string; summary?: string } })
    ?.error;
  if (npmError) {
    console.error(
      `${red("`vp outdated` failed:")} ${[npmError.code, npmError.summary].filter(Boolean).join(" - ")}`,
    );
  } else {
    console.error(
      `${red("Could not read `vp outdated`.")} The local vite-plus in node_modules\n` +
        `shadows the global \`vp\` inside npm scripts - run ${bold("vp update vite-plus")}\n` +
        `if it is too old to have the subcommand.`,
    );
  }
  process.exit(1);
}

/**
 * The Node.js version the project targets must be stated in three places that
 * can silently drift apart: the pinned dev runtime, the published `engines`
 * constraint, and the `@types/node` major that decides which APIs typecheck.
 */
function checkNodeAlignment(): boolean {
  const pinned = pkg.devEngines?.runtime?.version;
  const engines = pkg.engines?.node;
  const types = pkg.devDependencies?.["@types/node"];

  const majors = [
    {
      label: "devEngines.runtime.version",
      value: pinned,
      major: major(pinned),
    },
    { label: "engines.node", value: engines, major: major(engines) },
    { label: "@types/node", value: types, major: major(types) },
  ];

  const missing = majors.filter((m) => m.major === null);
  const distinct = new Set(
    majors.map((m) => m.major).filter((m) => m !== null),
  );
  const running = major(process.versions.node);
  const aligned = missing.length === 0 && distinct.size === 1;

  console.log(bold("Node.js version"));
  for (const { label, value, major: m } of majors) {
    const mark =
      m === null ? red("?") : distinct.size === 1 ? green("✓") : yellow("!");
    console.log(`  ${mark} ${label.padEnd(28)} ${value ?? red("not set")}`);
  }
  const runningOk = aligned && running === [...distinct][0];
  console.log(
    `  ${runningOk ? green("✓") : yellow("!")} ${"running node".padEnd(28)} v${process.versions.node}`,
  );

  if (!aligned) {
    console.log(
      `\n  ${red("Mismatch.")} Pick one major, then run ` +
        `${bold("vp env pin <major>")} and align engines.node and @types/node to it.`,
    );
  } else if (!runningOk) {
    console.log(
      `\n  ${yellow("This shell is on a different major.")} Run ${bold("vp env install")}.`,
    );
  }

  return aligned && runningOk;
}

/**
 * vite-plus requires one exact `@voidzero-dev/vite-plus-core` build, aliased as
 * `vite`, while package.json declares that alias as a caret range so updates
 * are not blocked. A routine update can therefore resolve a core that the
 * installed CLI rejects (as 1.5 -> 1.7 did, when core jumped from 1.x to
 * 8.3.8000), and `vp build` then refuses to run. The lockfile must also hoist
 * `vite` to the top level: when npm nests it under vite-plus, `vp test` cannot
 * resolve it. Both are read from the lockfile, which is what installs ship.
 */
const VITE_CORE = "@voidzero-dev/vite-plus-core";

function checkVitePlusAlignment(): boolean {
  type LockPackage = {
    name?: string;
    version?: string;
    dependencies?: Record<string, string>;
  };
  let packages: Record<string, LockPackage> = {};
  try {
    const lock = JSON.parse(
      fs.readFileSync(path.join(ROOT_DIR, "package-lock.json"), "utf8"),
    );
    packages = lock.packages ?? {};
  } catch {
    console.log(
      `\n${bold("Vite+")}\n  ${red("?")} package-lock.json not readable`,
    );
    return false;
  }

  const cli = packages["node_modules/vite-plus"];
  const requiredSpec = cli?.dependencies?.vite;
  const required = requiredSpec?.startsWith(`npm:${VITE_CORE}@`)
    ? requiredSpec.slice(`npm:${VITE_CORE}@`.length)
    : undefined;
  const hoistedPkg = packages["node_modules/vite"];
  const nestedPkg = packages["node_modules/vite-plus/node_modules/vite"];
  const hoisted = hoistedPkg?.version;
  const nested = nestedPkg?.version;
  // The CLI resolves its own nested copy first; project code and `vp test`
  // only see the hoisted one. Both must be the build vite-plus requires, from
  // the core package itself rather than a same-numbered fork.
  const isRequired = (entry: LockPackage | undefined) =>
    !!required && entry?.name === VITE_CORE && entry.version === required;
  const cliOk = isRequired(nestedPkg ?? hoistedPkg);
  const rootOk = isRequired(hoistedPkg);
  const ok = cliOk && rootOk;

  console.log(`\n${bold("Vite+")}`);
  console.log(
    `  ${ok ? green("✓") : red("!")} ${"vite-plus".padEnd(28)} ${cli?.version ?? red("not installed")} ${dim(`(requires core ${required ?? "?"})`)}`,
  );
  console.log(
    `  ${rootOk ? green("✓") : red("!")} ${"vite (vite-plus-core)".padEnd(28)} ${hoisted ?? red("not hoisted")}`,
  );
  if (nested !== undefined) {
    console.log(
      `  ${cliOk ? green("✓") : red("!")} ${"  nested under vite-plus".padEnd(28)} ${nested}`,
    );
  }

  if (!ok && hoisted === undefined && cliOk) {
    console.log(
      `\n  ${red("vite is nested under vite-plus.")} Declare it as a direct devDependency with\n` +
        `  the same alias as the override, then run ${bold("vp install")}.`,
    );
  } else if (!ok) {
    const exact = `npm:${VITE_CORE}@${required ?? "<version>"}`;
    console.log(
      `\n  ${red("Mismatch.")} Set the ${bold("vite")} devDependency and override to ${bold(exact)}\n` +
        `  and run ${bold("vp install")}. Then put the ${bold("^")} back on both and run ${bold("vp install")} again;\n` +
        `  the lockfile keeps the exact version. ${dim("(`npm view vite-plus@<version> dependencies.vite`")}\n` +
        `  ${dim("shows the core a release needs.)")}`,
    );
  }

  return ok;
}

function checkDependencies(): boolean {
  const outdated = readOutdated();

  // `wanted` is the newest version the declared semver range allows, so it is
  // exactly what a plain `vp update` will install. Anything past it needs the
  // range widened, which is a breaking-change review.
  const inRange: [string, OutdatedEntry][] = [];
  const outOfRange: [string, OutdatedEntry][] = [];

  // The `vite` alias is not upgraded on its own: it must be the core build the
  // selected vite-plus requires, which the Vite+ section above checks.
  const { vite: viteCore, ...independent } = outdated;

  for (const [name, entry] of Object.entries(independent)) {
    if (entry.current !== entry.wanted) inRange.push([name, entry]);
    if (entry.wanted !== entry.latest) outOfRange.push([name, entry]);
  }

  const width = Math.max(
    12,
    ...[...inRange, ...outOfRange].map(([name]) => name.length),
  );

  console.log(
    `\n${bold("Minor / patch")} ${dim("(within the declared range)")}`,
  );
  if (inRange.length === 0) {
    console.log(`  ${green("✓")} up to date`);
  } else {
    for (const [name, { current, wanted }] of inRange) {
      console.log(
        `  ${name.padEnd(width)}  ${current} ${dim("->")} ${green(wanted)}`,
      );
    }
    console.log(`\n  Apply with ${bold("npm run deps:update")}.`);
  }

  console.log(
    `\n${bold("Major")} ${dim("(outside the declared range - needs testing)")}`,
  );
  if (outOfRange.length === 0) {
    console.log(`  ${green("✓")} nothing pending`);
  } else {
    for (const [name, { wanted, latest }] of outOfRange) {
      console.log(
        `  ${name.padEnd(width)}  ${wanted} ${dim("->")} ${yellow(latest)}`,
      );
    }
    if (outOfRange.some(([name]) => name === "@types/node")) {
      console.log(
        `\n  ${dim("@types/node tracks the Node.js major above - bump the pin with")}\n` +
          `  ${dim("`vp env pin <major>` and engines.node in the same commit, or not at all.")}`,
      );
    }
    console.log(
      `\n  Review each changelog, then take them one at a time with\n` +
        `  ${bold("vp add <name>@latest")} (${bold("-D")} for a devDependency). Validate with ${bold("vp check")}\n` +
        `  and the build before committing.`,
    );
  }

  if (viteCore) {
    console.log(
      `\n  ${dim(`vite (${VITE_CORE}) ${viteCore.current ?? "?"} -> ${viteCore.latest} is not listed: it moves with`)}\n` +
        `  ${dim("vite-plus. Upgrade vite-plus, then set both `vite` entries to the core it requires.")}`,
    );
  }

  return inRange.length === 0;
}

const nodeOk = checkNodeAlignment();
const vitePlusOk = checkVitePlusAlignment();
const depsOk = checkDependencies();

if (!vitePlusOk) process.exitCode = 1;

if (CI && !(nodeOk && vitePlusOk && depsOk)) {
  console.log(`\n${red("deps:check failed")} ${dim("(--ci)")}`);
  process.exit(1);
}
