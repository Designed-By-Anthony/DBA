import { readFile, writeFile } from "node:fs/promises";

const [, , filePath] = process.argv;

if (!filePath) {
	throw new Error("Usage: bun build/trim-generated-whitespace.mjs <file>");
}

const source = await readFile(filePath, "utf8");
const trimmed = source.replace(/[ \t]+$/gm, "");

if (trimmed !== source) {
	await writeFile(filePath, trimmed);
}
