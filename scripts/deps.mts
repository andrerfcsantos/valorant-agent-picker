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
  try {
    const stdout = execSync("vp outdated --format json", options);
    return stdout.trim() ? JSON.parse(stdout) : {};
  } catch (error) {
    const stdout = (error as { stdout?: string }).stdout;
    try {
      if (stdout?.trim()) return JSON.parse(stdout);
    } catch {
      // Fall through to the diagnostic below.
    }
    console.error(
      `${red("Could not read `vp outdated`.")} The local vite-plus in node_modules\n` +
        `shadows the global \`vp\` inside npm scripts - run ${bold("vp update vite-plus")}\n` +
        `if it is too old to have the subcommand.`,
    );
    process.exit(1);
  }
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

function checkDependencies(): boolean {
  const outdated = readOutdated();

  // `wanted` is the newest version the declared semver range allows, so it is
  // exactly what a plain `vp update` will install. Anything past it needs the
  // range widened, which is a breaking-change review.
  const inRange: [string, OutdatedEntry][] = [];
  const outOfRange: [string, OutdatedEntry][] = [];

  for (const [name, entry] of Object.entries(outdated)) {
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
      `\n  Review each changelog, then ${bold("npm run deps:update:major")} to pick them\n` +
        `  interactively. Validate with ${bold("vp check")} and ${bold("npm run build")} before committing.`,
    );
  }

  return inRange.length === 0;
}

const nodeOk = checkNodeAlignment();
const depsOk = checkDependencies();

if (CI && !(nodeOk && depsOk)) {
  console.log(`\n${red("deps:check failed")} ${dim("(--ci)")}`);
  process.exit(1);
}
