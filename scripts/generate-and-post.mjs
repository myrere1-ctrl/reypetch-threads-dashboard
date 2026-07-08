import fs from 'node:fs/promises';
import { generatePost } from './lib/claude.mjs';
import { postThread, verifyToken } from './lib/threads.mjs';
import { loadAccountConfig, parseAccountArg, dataPath } from './lib/config.mjs';

function parseArgs() {
  const out = { slot: null, dryRun: false };
  for (const a of process.argv.slice(2)) {
    if (a.startsWith('--slot=')) out.slot = Number(a.split('=')[1]);
    if (a === '--dry-run') out.dryRun = true;
  }
  return out;
}

function pickContent({ config, slot }) {
  const now = new Date();
  const dayIndex = Math.floor(now.getTime() / 86400000);

  let product;
  if (config.themeMode === 'weekly') {
    // 1 week per product, rotate
    const offset = config.weekOffset || 0;
    const weekIndex = (Math.floor(dayIndex / 7) + offset) % config.products.length;
    product = config.products[weekIndex];
  } else {
    // Legacy random rotation
    product = config.products[(dayIndex + slot) % config.products.length];
  }

  // Prefer product-specific destinations, fallback to config-level
  const destPool = product.destinations && product.destinations.length
    ? product.destinations
    : config.destinations || ['umum'];
  const destination = destPool[(dayIndex + slot * 2) % destPool.length];

  return { product, destination };
}

async function loadLog(account) {
  const p = dataPath(account, 'posted-log.json');
  try {
    return JSON.parse(await fs.readFile(p, 'utf8'));
  } catch {
    return [];
  }
}

async function appendLog(account, entry) {
  const p = dataPath(account, 'posted-log.json');
  const log = await loadLog(account);
  log.push(entry);
  await fs.writeFile(p, JSON.stringify(log, null, 2) + '\n');
}

async function main() {
  const account = parseAccountArg();
  const { slot, dryRun } = parseArgs();
  const config = await loadAccountConfig(account);

  if (slot === null || Number.isNaN(slot) || slot < 0 || slot >= config.slots.length) {
    throw new Error(`Usage: node generate-and-post.mjs --account=<${account}> --slot=<0-${config.slots.length - 1}>`);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const token = process.env.THREADS_ACCESS_TOKEN;
  const userId = process.env.THREADS_USER_ID;

  if (!apiKey) throw new Error('ANTHROPIC_API_KEY missing');
  if (!token) throw new Error('THREADS_ACCESS_TOKEN missing');
  if (!userId) throw new Error('THREADS_USER_ID missing');

  const { product, destination } = pickContent({ config, slot });
  console.log(`Slot ${slot} (${config.slots[slot]} WIB) · account: ${account}`);
  console.log('Pick:', { product: product.slug, destination });

  // Ambil 12 post terakhir sebagai riwayat (anti-kontradiksi + anti-repetisi)
  const log = await loadLog(account);
  const recentPosts = log.slice(-12).map((e) => e.body || e.text || '');

  const post = await generatePost({ apiKey, config, product, destination, recentPosts });
  console.log('---');
  console.log(post.full);
  console.log('---');

  if (dryRun) {
    console.log('[dry-run] skip Threads post');
    return;
  }

  await verifyToken({ token });
  const threadId = await postThread({ userId, token, text: post.full });
  console.log('Posted:', threadId);

  await appendLog(account, {
    timestamp: new Date().toISOString(),
    slot,
    slotTimeWib: config.slots[slot],
    account,
    productSlug: product.slug,
    destination,
    angle: post.angle,
    body: post.text,
    cta: post.cta,
    text: post.full,
    threadId,
  });
  console.log('Logged');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
