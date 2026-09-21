import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const testRoots = ["tests/unit", "tests/repositories"];
const testFiles = testRoots.flatMap(findTests);
const runner = process.platform === "win32"
  ? resolve("node_modules/.bin/tsx.cmd")
  : resolve("node_modules/.bin/tsx");
const result = spawnSync(runner, ["--test", ...testFiles], {
  shell: process.platform === "win32",
  stdio: "inherit",
});

process.exit(result.status ?? 1);

function findTests(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return findTests(path);
    return entry.name.endsWith(".test.ts") ? [path] : [];
  });
}
