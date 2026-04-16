import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const CACHE_FILENAME = '.astro-indexnow-cache.json';
/** Bing’s examples use `POST /IndexNow` on this host (path casing matches their docs). */
const DEFAULT_PRIMARY_ENDPOINT = 'https://api.indexnow.org/IndexNow';
/** Used when the global/Bing endpoint rejects authorization; same JSON body as IndexNow spec. */
const DEFAULT_FALLBACK_ENDPOINTS = [
  'https://yandex.com/indexnow',
  'https://search.seznam.cz/indexnow',
];
const INDEXNOW_BATCH_SIZE = 10_000;

const ensureCacheFile = (cachePath) => {
  const dir = path.dirname(cachePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(cachePath)) {
    fs.writeFileSync(cachePath, '{}', 'utf8');
  }
};

const loadCache = (cachePath) => {
  try {
    return JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  } catch {
    return {};
  }
};

const saveCache = (cachePath, data) => {
  const sorted = Object.keys(data)
    .sort()
    .reduce((acc, key) => {
      acc[key] = data[key];
      return acc;
    }, {});
  fs.writeFileSync(cachePath, JSON.stringify(sorted, null, 2), 'utf8');
};

const hashFile = (filePath) => {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return `sha256:${hash.digest('hex')}`;
};

const chunk = (items, size) => {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const toUrlPath = (relativeFilePath) => {
  const normalized = relativeFilePath.replace(/\\/g, '/');

  if (normalized === 'index.html') return '/';
  if (normalized.endsWith('/index.html')) {
    return `/${normalized.replace(/\/index\.html$/, '')}`;
  }

  return `/${normalized.replace(/\.html$/, '')}`;
};

const collectHtmlFiles = (currentDir, rootDir, files = []) => {
  for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
    const fullPath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      collectHtmlFiles(fullPath, rootDir, files);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(path.relative(rootDir, fullPath));
    }
  }

  return files;
};

/** @param {{ shown: boolean }} bing403Hint */
async function postIndexNowBatch(logger, primary, fallbacks, body, bing403Hint) {
  const payload = JSON.stringify(body);
  const endpoints = [primary, ...fallbacks];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      });

      if (response.ok) {
        logger.info(`batch accepted (${response.status}) via ${endpoint}`);
        return true;
      }

      const text = await response.text();
      let detail = text.slice(0, 500);
      try {
        const parsed = JSON.parse(text);
        detail = parsed.message || parsed.errorCode || detail;
        if (
          parsed.errorCode === 'UserForbiddedToAccessSite' &&
          endpoint === primary &&
          !bing403Hint.shown
        ) {
          bing403Hint.shown = true;
          logger.warn(
            'Bing/global IndexNow returned UserForbiddedToAccessSite (often fixed by verifying the site in Bing Webmaster Tools with DNS or XML verification—Google Search Console import sometimes fails for IndexNow). Trying partner endpoints next.',
          );
          logger.warn('Doc: https://www.bing.com/indexnow/getstarted · https://www.bing.com/webmasters');
        }
      } catch {
        /* keep truncated raw body */
      }
      logger.warn(`${endpoint} → HTTP ${response.status}: ${detail}`);
    } catch (err) {
      logger.warn(`${endpoint} failed (network): ${err?.message ?? err}`);
    }
  }

  return false;
}

export default function indexNowStaticPages(options = {}) {
  let site = null;
  const cachePath = options.cacheDir
    ? path.resolve(process.cwd(), options.cacheDir, CACHE_FILENAME)
    : path.join(process.cwd(), CACHE_FILENAME);
  const excludedUrls = new Set(options.excludeUrls ?? []);
  const primaryEndpoint = options.primaryEndpoint ?? DEFAULT_PRIMARY_ENDPOINT;
  const fallbackEndpoints =
    options.fallbackEndpoints !== undefined ? options.fallbackEndpoints : DEFAULT_FALLBACK_ENDPOINTS;

  return {
    name: 'indexnow-static-pages',
    hooks: {
      'astro:config:setup': ({ config }) => {
        site = options.siteUrl ?? (config.site ? config.site.replace(/\/$/, '') : null);
        ensureCacheFile(cachePath);
      },
      'astro:build:done': async ({ dir, logger }) => {
        if (options.enabled === false) {
          logger.info('disabled');
          return;
        }

        if (!options.key) {
          throw new Error('[indexnow-static-pages] Missing IndexNow key');
        }

        if (!site) {
          throw new Error('[indexnow-static-pages] Missing site URL');
        }

        ensureCacheFile(cachePath);

        const outDir = fileURLToPath(dir instanceof URL ? dir : new URL(dir));
        const previousCache = loadCache(cachePath);
        const nextCache = {};
        const changedUrls = [];

        for (const relativeFilePath of collectHtmlFiles(outDir, outDir)) {
          const url = `${site}${toUrlPath(relativeFilePath)}`;
          if (excludedUrls.has(url)) continue;

          const filePath = path.join(outDir, relativeFilePath);
          const hash = hashFile(filePath);
          nextCache[url] = hash;

          if (previousCache[url] !== hash) {
            changedUrls.push(url);
          }
        }

        if (changedUrls.length === 0) {
          logger.info('no changed URLs detected, skipping submission');
          saveCache(cachePath, nextCache);
          return;
        }

        const batches = chunk(changedUrls, INDEXNOW_BATCH_SIZE);
        logger.info(
          `submitting ${changedUrls.length} changed URLs in ${batches.length} batch(es) (primary: ${primaryEndpoint}${fallbackEndpoints.length ? `; fallbacks: ${fallbackEndpoints.join(', ')}` : ''})`,
        );

        const bing403Hint = { shown: false };
        const bodyBase = {
          host: new URL(site).host,
          key: options.key,
          keyLocation: `${site}/${options.key}.txt`,
        };

        let anyBatchFailed = false;
        for (const batch of batches) {
          const ok = await postIndexNowBatch(
            logger,
            primaryEndpoint,
            fallbackEndpoints,
            { ...bodyBase, urlList: batch },
            bing403Hint,
          );
          if (!ok) anyBatchFailed = true;
        }

        saveCache(cachePath, nextCache);
        if (anyBatchFailed) {
          logger.warn('finished with failures — URLs may retry on the next build if hashes change again');
        } else {
          logger.info('IndexNow submission complete');
        }
      },
    },
  };
}
