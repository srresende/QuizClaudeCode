// Fails if any question explanation leaked into the client bundle (.next/static).
// Run after `next build`.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const STATIC_DIR = ".next/static";
const questions = JSON.parse(readFileSync("src/data/questions.json", "utf8"));
const needles = questions.map((q) => q.explanation.slice(0, 40));

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* files(path);
    else yield path;
  }
}

let scanned = 0;
const leaks = [];
for (const file of files(STATIC_DIR)) {
  scanned++;
  const content = readFileSync(file, "utf8");
  for (const needle of needles) {
    if (content.includes(needle)) leaks.push(`${file}: "${needle}…"`);
  }
}

if (leaks.length > 0) {
  console.error(`✘ Explanations found in client bundle:\n${leaks.join("\n")}`);
  process.exit(1);
}
console.log(`✔ No explanations in ${scanned} client files.`);
