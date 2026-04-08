import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

function die(message) {
  console.error(message);
  process.exit(1);
}

function parseArgs(argv) {
  const args = {
    root: null,
    apiBase: null,
    token: null,
    dryRun: false,
    concurrency: 3,
    generalSubcategoryName: 'General',
    premium: false,
    maxMb: 100,
    failFast: false,
    includeExtensions: null, // Set<string> | null
    verbose: false,
  };

  const take = (i) => {
    const v = argv[i + 1];
    if (!v || v.startsWith('--')) die(`Missing value for ${argv[i]}`);
    return v;
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--root') {
      args.root = take(i);
      i++;
    } else if (a === '--api-base') {
      args.apiBase = take(i);
      i++;
    } else if (a === '--token') {
      args.token = take(i);
      i++;
    } else if (a === '--dry-run') {
      args.dryRun = true;
    } else if (a === '--concurrency') {
      args.concurrency = Number(take(i));
      i++;
    } else if (a === '--general-subcategory') {
      args.generalSubcategoryName = take(i);
      i++;
    } else if (a === '--premium') {
      args.premium = true;
    } else if (a === '--max-mb') {
      args.maxMb = Number(take(i));
      i++;
    } else if (a === '--fail-fast') {
      args.failFast = true;
    } else if (a === '--include-ext') {
      const raw = take(i);
      args.includeExtensions = new Set(
        raw
          .split(',')
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean)
          .map((s) => (s.startsWith('.') ? s : `.${s}`))
      );
      i++;
    } else if (a === '--verbose') {
      args.verbose = true;
    } else if (a === '--help' || a === '-h') {
      args.help = true;
    } else {
      die(`Unknown arg: ${a}\nRun with --help for usage.`);
    }
  }

  return args;
}

function printHelp() {
  console.log(
    [
      'Import a local b-roll folder tree into Cutflow API.',
      '',
      'Folder structure expected:',
      '  <root>/<Category>/(media files...)',
      '  <root>/<Category>/<Subcategory>/(media files...)',
      '',
      'Usage:',
      '  node scripts/import-broll-library.mjs --root "D:\\\\xampp\\\\htdocs\\\\CutFlow - Videos" --api-base "http://127.0.0.1:8000/api"',
      '',
      'Options:',
      '  --root <path>                 Root folder that contains category folders (required)',
      '  --api-base <url>              API base URL, e.g. http://127.0.0.1:8000/api (required)',
      '  --token <token>               Optional bearer token (Authorization: Bearer ...)',
      '  --dry-run                     Print plan, do not call API',
      '  --concurrency <n>             Parallel uploads (default: 3)',
      '  --general-subcategory <name>  Subcategory name for files directly under category (default: General)',
      '  --premium                     Mark imported items as premium (default: false)',
      '  --max-mb <n>                  Skip files larger than N MB (default: 20)',
      '  --fail-fast                   Stop on first upload error (default: false)',
      '  --include-ext ".mp4,.jpg"     Only import these extensions (default: common media types)',
      '  --verbose                     Extra logging',
    ].join('\n')
  );
}

function normalizeApiBase(apiBase) {
  const base = String(apiBase ?? '').trim().replace(/\/$/, '');
  if (!base) return '';
  return base;
}

function extToType(ext) {
  const e = ext.toLowerCase();
  const img = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tif', '.tiff', '.avif']);
  const vid = new Set(['.mp4', '.mov', '.m4v', '.webm', '.mkv', '.avi']);
  if (img.has(e)) return 'image';
  if (vid.has(e)) return 'video';
  return 'unknown';
}

function defaultAllowedExts() {
  return new Set([
    '.jpg',
    '.jpeg',
    '.png',
    '.webp',
    '.gif',
    '.bmp',
    '.tif',
    '.tiff',
    '.avif',
    '.mp4',
    '.mov',
    '.m4v',
    '.webm',
    '.mkv',
    '.avi',
  ]);
}

async function isDirectory(p) {
  try {
    return (await fs.stat(p)).isDirectory();
  } catch {
    return false;
  }
}

async function listDir(p) {
  return await fs.readdir(p, { withFileTypes: true });
}

function slugDisplayName(name) {
  return name.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

async function scanTree(root, { generalSubcategoryName, includeExtensions, verbose }) {
  const allowed = includeExtensions ?? defaultAllowedExts();
  const absRoot = path.resolve(root);
  if (!(await isDirectory(absRoot))) die(`Root folder not found or not a directory: ${absRoot}`);

  const categories = [];
  const entries = await listDir(absRoot);
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const catDir = path.join(absRoot, e.name);
    const categoryName = slugDisplayName(e.name);

    const catFiles = [];
    const subcategories = [];
    const catEntries = await listDir(catDir);
    for (const ce of catEntries) {
      const p = path.join(catDir, ce.name);
      if (ce.isDirectory()) {
        const subEntries = await listDir(p);
        const items = [];
        for (const se of subEntries) {
          if (!se.isFile()) continue;
          const filePath = path.join(p, se.name);
          const ext = path.extname(se.name).toLowerCase();
          if (!allowed.has(ext)) continue;
          const t = extToType(ext);
          if (t === 'unknown') continue;
          items.push({ filePath, fileName: se.name, type: t });
        }
        if (items.length > 0) {
          subcategories.push({
            name: slugDisplayName(ce.name),
            items,
          });
        }
      } else if (ce.isFile()) {
        const ext = path.extname(ce.name).toLowerCase();
        if (!allowed.has(ext)) continue;
        const t = extToType(ext);
        if (t === 'unknown') continue;
        catFiles.push({ filePath: p, fileName: ce.name, type: t });
      }
    }

    if (catFiles.length > 0) {
      subcategories.unshift({ name: generalSubcategoryName, items: catFiles });
    }

    const total = subcategories.reduce((n, s) => n + s.items.length, 0);
    if (total === 0) continue;

    if (verbose) {
      console.log(`[scan] ${categoryName}: ${subcategories.length} subcategory(ies), ${total} file(s)`);
    }

    categories.push({ name: categoryName, subcategories });
  }

  if (categories.length === 0) die('No importable media found under the root folder.');
  return { root: absRoot, categories };
}

async function fetchJson(url, { method = 'GET', headers, body } = {}) {
  let res;
  try {
    res = await fetch(url, { method, headers, body });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    const cause = /** @type {any} */ (err).cause;
    const extra =
      cause && typeof cause === 'object'
        ? ` (cause: ${String(cause.code ?? cause.message ?? JSON.stringify(cause))})`
        : '';
    throw new Error(`Network error calling ${method} ${url}: ${err.message}${extra}`);
  }
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { res, text, json };
}

function authHeaders(token) {
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

async function apiGetCategories(apiBase, token) {
  const url = `${apiBase}/categories`;
  const { res, json, text } = await fetchJson(url, { headers: { ...authHeaders(token) } });
  if (!res.ok) {
    throw new Error(`GET /categories failed: ${res.status} ${res.statusText}\n${text}`);
  }
  const data = json?.data ?? json;
  if (!Array.isArray(data)) {
    throw new Error('GET /categories returned unexpected JSON shape (expected an array or {data: array}).');
  }
  return data;
}

async function apiGetLibrary(apiBase, token) {
  const url = `${apiBase}/brolls/library`;
  const { res, json, text } = await fetchJson(url, { headers: { ...authHeaders(token) } });
  if (!res.ok) {
    throw new Error(`GET /brolls/library failed: ${res.status} ${res.statusText}\n${text}`);
  }
  if (!json || json.success !== true || !Array.isArray(json.data)) {
    throw new Error('GET /brolls/library returned unexpected JSON shape.');
  }
  return json.data;
}

function indexCategoriesFromApi(categories) {
  // Builds: categoryNameLower -> { id, name, subByNameLower: Map<subLower, {id,name}> }
  // Expected item shape: { id, name, parent_id? }
  const byId = new Map();
  for (const c of categories) {
    if (!c || typeof c !== 'object') continue;
    const id = /** @type {any} */ (c).id;
    const name = /** @type {any} */ (c).name;
    const parentId = /** @type {any} */ (c).parent_id ?? null;
    if (id == null || typeof name !== 'string') continue;
    byId.set(id, { id, name, parentId });
  }

  const roots = [];
  for (const v of byId.values()) {
    if (v.parentId == null) roots.push(v);
  }

  const byCategory = new Map();
  for (const root of roots) {
    const subBy = new Map();
    for (const v of byId.values()) {
      if (v.parentId === root.id) {
        subBy.set(String(v.name ?? '').trim().toLowerCase(), { id: v.id, name: v.name });
      }
    }
    byCategory.set(String(root.name ?? '').trim().toLowerCase(), {
      id: root.id,
      name: root.name,
      subByNameLower: subBy,
    });
  }
  return byCategory;
}

async function apiCreateCategory(apiBase, token, name) {
  // Laravel route: POST /categories { name }
  const url = `${apiBase}/categories`;
  const { res, json, text } = await fetchJson(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    throw new Error(`POST /categories failed: ${res.status} ${res.statusText}\n${text}`);
  }
  const cat = json?.data ?? json?.category ?? json;
  const id = cat?.id ?? json?.id;
  if (!id) throw new Error('POST /categories did not return an id.');
  return { id, name };
}

async function apiCreateSubcategory(apiBase, token, categoryId, name) {
  // Laravel route: POST /categories with "parent_id" to create a subcategory
  const url = `${apiBase}/categories`;
  const { res, json, text } = await fetchJson(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ parent_id: categoryId, name }),
  });
  if (!res.ok) {
    throw new Error(`POST /categories (subcategory) failed: ${res.status} ${res.statusText}\n${text}`);
  }
  const sub = json?.data ?? json?.subcategory ?? json;
  const id = sub?.id ?? json?.id;
  if (!id) throw new Error('POST /categories (subcategory) did not return an id.');
  return { id, name };
}

async function apiUploadItem(apiBase, token, { categoryId, subcategoryId, filePath, name, type, premium }) {
  // Laravel route: POST /media multipart form-data
  // Expected fields (per scripts/IMPORT_BROLLS.md): category_id, subcategory_id, name, type, is_premium, file
  const url = `${apiBase}/media`;
  const buf = await fs.readFile(filePath);
  const file = new File([buf], path.basename(filePath));
  const form = new FormData();
  /**
   * Backend compatibility:
   * - Some implementations model subcategories as entries in the same `categories` table (with `parent_id`)
   *   and store media on the *leaf* category via a single `category_id`.
   * - Others store both `category_id` (parent) + `subcategory_id` (leaf).
   *
   * To support both, we always send:
   * - `category_id` as the leaf (subcategory) id (so library queries on category_id=subcategory work)
   * - `subcategory_id` as the leaf id as well (for implementations that explicitly use it)
   * - `parent_id` / `parent_category_id` as the parent category id (if the backend wants both)
   */
  form.set('category_id', String(subcategoryId));
  form.set('subcategory_id', String(subcategoryId));
  form.set('parent_id', String(categoryId));
  form.set('parent_category_id', String(categoryId));
  form.set('name', name);
  form.set('type', type);
  form.set('is_premium', premium ? '1' : '0');
  form.set('file', file);

  const res = await fetch(url, {
    method: 'POST',
    headers: { ...authHeaders(token) },
    body: form,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`POST /media failed: ${res.status} ${res.statusText}\n${text}`);
  }
  return text;
}

async function promisePool(items, worker, concurrency) {
  const results = [];
  let idx = 0;
  let active = 0;
  let rejectFn;
  const done = new Promise((resolve, reject) => {
    rejectFn = reject;
    const pump = () => {
      while (active < concurrency && idx < items.length) {
        const current = items[idx++];
        active++;
        Promise.resolve()
          .then(() => worker(current))
          .then((r) => results.push(r))
          .catch(reject)
          .finally(() => {
            active--;
            if (idx >= items.length && active === 0) resolve(results);
            else pump();
          });
      }
    };
    pump();
  });
  try {
    return await done;
  } catch (e) {
    rejectFn?.(e);
    throw e;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  if (!args.root) die('Missing required --root');
  if (!args.apiBase) die('Missing required --api-base');
  if (!Number.isFinite(args.concurrency) || args.concurrency <= 0) die('--concurrency must be a positive number');
  if (!Number.isFinite(args.maxMb) || args.maxMb <= 0) die('--max-mb must be a positive number');

  const apiBase = normalizeApiBase(args.apiBase);
  if (!apiBase) die('Invalid --api-base');

  const plan = await scanTree(args.root, {
    generalSubcategoryName: args.generalSubcategoryName,
    includeExtensions: args.includeExtensions,
    verbose: args.verbose,
  });

  const uploadTasks = [];
  for (const cat of plan.categories) {
    for (const sub of cat.subcategories) {
      for (const it of sub.items) {
        uploadTasks.push({
          categoryName: cat.name,
          subcategoryName: sub.name,
          filePath: it.filePath,
          fileName: it.fileName,
          type: it.type,
        });
      }
    }
  }

  console.log(
    [
      `Planned import: ${plan.categories.length} categor(ies), ${uploadTasks.length} item(s)`,
      `Root: ${plan.root}`,
      `API: ${apiBase}`,
      args.dryRun ? 'Mode: DRY RUN (no API calls)' : 'Mode: LIVE (will call API)',
    ].join('\n')
  );

  if (args.dryRun) return;

  let categoriesFromApi;
  try {
    categoriesFromApi = await apiGetCategories(apiBase, args.token);
  } catch (e) {
    die(
      [
        'Could not fetch existing categories using GET /categories.',
        'Make sure your cutflow-api is running and reachable from this machine.',
        'Example: open `http://127.0.0.1:8000` in your browser (or run the API server if it is not started).',
        '',
        String(e instanceof Error ? e.message : e),
      ].join('\n')
    );
  }

  const index = indexCategoriesFromApi(categoriesFromApi);
  const ensured = new Map(); // `${catLower}::${subLower}` -> {categoryId, subcategoryId}

  for (const cat of plan.categories) {
    const catKey = cat.name.toLowerCase();
    let catEntry = index.get(catKey);
    if (!catEntry) {
      console.log(`[api] create category: ${cat.name}`);
      const created = await apiCreateCategory(apiBase, args.token, cat.name);
      catEntry = { id: created.id, name: created.name, subByNameLower: new Map() };
      index.set(catKey, catEntry);
    }

    for (const sub of cat.subcategories) {
      const subKey = String(sub.name).trim().toLowerCase();
      let subEntry = catEntry.subByNameLower.get(subKey);
      if (!subEntry) {
        console.log(`[api] create subcategory: ${cat.name} > ${sub.name}`);
        const created = await apiCreateSubcategory(apiBase, args.token, catEntry.id, sub.name);
        subEntry = { id: created.id, name: created.name };
        catEntry.subByNameLower.set(subKey, subEntry);
      }
      ensured.set(`${catKey}::${subKey}`, { categoryId: catEntry.id, subcategoryId: subEntry.id });
    }
  }

  console.log(`[api] uploading ${uploadTasks.length} file(s) (concurrency=${args.concurrency})...`);

  let uploaded = 0;
  let skippedTooLarge = 0;
  let failed = 0;
  const failures = [];
  const maxBytes = Math.floor(args.maxMb * 1024 * 1024);

  await promisePool(
    uploadTasks,
    async (t) => {
      const catKey = t.categoryName.toLowerCase();
      const subKey = t.subcategoryName.toLowerCase();
      const ids = ensured.get(`${catKey}::${subKey}`);
      if (!ids) throw new Error(`Missing ensured IDs for ${t.categoryName} > ${t.subcategoryName}`);

      const baseName = path.parse(t.fileName).name;
      const displayName = slugDisplayName(baseName);
      try {
        const st = await fs.stat(t.filePath);
        if (st.size > maxBytes) {
          skippedTooLarge++;
          if (args.verbose) {
            console.log(
              `[skip] too large (${(st.size / (1024 * 1024)).toFixed(2)} MB > ${args.maxMb} MB): ${t.filePath}`
            );
          }
          return;
        }

        await apiUploadItem(apiBase, args.token, {
          categoryId: ids.categoryId,
          subcategoryId: ids.subcategoryId,
          filePath: t.filePath,
          name: displayName,
          type: t.type,
          premium: args.premium,
        });
        uploaded++;
      } catch (e) {
        failed++;
        const msg = String(e instanceof Error ? e.message : e);
        failures.push({ filePath: t.filePath, message: msg });
        console.error(`[error] ${t.filePath}\n${msg}\n`);
        if (args.failFast) throw e;
      }
      if (uploaded % 25 === 0 || args.verbose) {
        console.log(`[api] uploaded ${uploaded}/${uploadTasks.length}`);
      }
    },
    args.concurrency
  );

  console.log(
    [
      'Import complete.',
      `Uploaded: ${uploaded}`,
      `Skipped (too large): ${skippedTooLarge} (limit: ${args.maxMb} MB)`,
      `Failed: ${failed}`,
      failed > 0 ? 'See errors above; re-run with --fail-fast to stop on first error.' : '',
    ]
      .filter(Boolean)
      .join('\n')
  );
}

await main();

