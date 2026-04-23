/**
 * Fill package-lock.json "packages" entries that are only `{ optional: true }`
 * with version, resolved, and integrity from the registry.
 * Stub-only entries break `npm ci` on Linux (npm semver: Invalid Version: ).
 */
import fs from "node:fs";

const lockPath = new URL("../package-lock.json", import.meta.url);
const lock = JSON.parse(fs.readFileSync(lockPath, "utf8"));
const { packages } = lock;

function getVersionForStub(stubPath) {
	if (stubPath.startsWith("node_modules/rollup/node_modules/")) {
		const name = stubPath.slice("node_modules/rollup/node_modules/".length);
		const v = packages["node_modules/rollup"]?.optionalDependencies?.[name];
		return v ? { name, version: v } : null;
	}
	if (stubPath.startsWith("node_modules/@sentry/cli/node_modules/")) {
		const name = stubPath.slice(
			"node_modules/@sentry/cli/node_modules/".length,
		);
		const v =
			packages["node_modules/@sentry/cli"]?.optionalDependencies?.[name];
		return v ? { name, version: v } : null;
	}
	return null;
}

async function fetchDist(name, version) {
	const url = `https://registry.npmjs.org/${encodeURIComponent(name)}/${version}`;
	const res = await fetch(url);
	if (!res.ok) throw new Error(`${name}@${version}: HTTP ${res.status}`);
	const j = await res.json();
	const dist =
		j.dist || (j.versions && j.versions[version] && j.versions[version].dist);
	if (!dist?.integrity || !dist?.tarball) {
		throw new Error(`${name}@${version}: missing dist in registry response`);
	}
	return { integrity: dist.integrity, tarball: dist.tarball };
}

let fixed = 0;
const tasks = [];
for (const [p, meta] of Object.entries(packages)) {
	if (!meta || typeof meta !== "object") continue;
	if (Object.keys(meta).length !== 1 || meta.optional !== true) continue;
	const spec = getVersionForStub(p);
	if (!spec) continue;
	tasks.push(
		(async () => {
			const dist = await fetchDist(spec.name, spec.version);
			packages[p] = {
				version: spec.version,
				resolved: dist.tarball,
				integrity: dist.integrity,
				optional: true,
			};
			fixed++;
		})(),
	);
}
await Promise.all(tasks);

fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2) + "\n");
console.log(`fix-lock-optional-stubs: filled ${fixed} stub entries`);
