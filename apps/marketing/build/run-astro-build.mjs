import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { access } from 'node:fs/promises';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { spawn } from 'node:child_process';

const lockDir = join(process.cwd(), '.astro-build.lock');
const ownerPath = join(lockDir, 'owner.json');
const waitMs = 250;
const timeoutMs = 10 * 60 * 1000;

async function processExists(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code === 'EPERM';
  }
}

async function removeLockIfStale() {
  try {
    await access(ownerPath, fsConstants.F_OK);
  } catch {
    return;
  }

  try {
    const owner = JSON.parse(await readFile(ownerPath, 'utf8'));
    const active = await processExists(owner.pid);
    if (active) return;
  } catch {
    return;
  }

  await rm(lockDir, { recursive: true, force: true });
}

async function acquireLock() {
  const startedAt = Date.now();

  while (true) {
    try {
      await mkdir(lockDir);
      await writeFile(
        ownerPath,
        JSON.stringify({
          pid: process.pid,
          startedAt: new Date().toISOString(),
        }),
        'utf8',
      );
      return;
    } catch (error) {
      if (error?.code !== 'EEXIST') throw error;
      await removeLockIfStale();
      if (Date.now() - startedAt > timeoutMs) {
        throw new Error(`Timed out waiting for marketing build lock at ${lockDir}`);
      }
      await sleep(waitMs);
    }
  }
}

async function releaseLock() {
  await rm(lockDir, { recursive: true, force: true });
}

function runAstroBuild() {
  return new Promise((resolve, reject) => {
    const command = process.platform === 'win32' ? 'astro.cmd' : 'astro';
    const nodeOptions = String(process.env.NODE_OPTIONS ?? '').trim();
    const env = { ...process.env };

    // Astro can be terminated by the OS in this workspace when it uses the
    // default heap size. Give builds a safer default unless the caller already
    // pinned a heap limit explicitly.
    if (!nodeOptions.includes('--max-old-space-size=')) {
      env.NODE_OPTIONS = [nodeOptions, '--max-old-space-size=8192']
        .filter(Boolean)
        .join(' ');
    }

    const child = spawn(command, ['build'], {
      cwd: process.cwd(),
      stdio: 'inherit',
      env,
    });

    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (signal) {
        reject(new Error(`astro build exited from signal ${signal}`));
        return;
      }
      resolve(code ?? 0);
    });
  });
}

let locked = false;

try {
  await acquireLock();
  locked = true;
  const exitCode = await runAstroBuild();
  process.exitCode = exitCode;
} finally {
  if (locked) {
    await releaseLock();
  }
}
