import fs from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { loadAccountConfig, parseAccountArg, dataPath } from './lib/config.mjs';

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

function toWib(date = new Date()) {
  return new Date(date.getTime() + WIB_OFFSET_MS);
}

function nowWibYmd() {
  return toWib().toISOString().slice(0, 10);
}

function nowWibMinutes() {
  const w = toWib();
  return w.getUTCHours() * 60 + w.getUTCMinutes();
}

function timestampToWibYmd(ts) {
  return toWib(new Date(ts)).toISOString().slice(0, 10);
}

function slotToMinutes(s) {
  const [h, m] = s.split('.').map(Number);
  return h * 60 + m;
}

async function loadTodayLog(account) {
  const raw = await fs.readFile(dataPath(account, 'posted-log.json'), 'utf8').catch(() => '[]');
  const log = JSON.parse(raw);
  const today = nowWibYmd();
  return log.filter((p) => timestampToWibYmd(p.timestamp) === today);
}

async function main() {
  const account = parseAccountArg();
  const config = await loadAccountConfig(account);
  const slots = config.slots;

  const todayLog = await loadTodayLog(account);
  const postedSlots = new Set(todayLog.map((p) => p.slot));
  const nowMin = nowWibMinutes();

  console.log(`Account: ${account} · Today: ${nowWibYmd()} · Now: ${Math.floor(nowMin / 60)}:${String(nowMin % 60).padStart(2, '0')} WIB`);
  console.log(`Posted today: [${[...postedSlots].sort().join(', ')}] (${postedSlots.size}/${slots.length})`);

  let targetSlot = null;
  for (let i = 0; i < slots.length; i++) {
    if (slotToMinutes(slots[i]) <= nowMin && !postedSlots.has(i)) {
      targetSlot = i;
      break;
    }
  }

  if (targetSlot === null) {
    console.log('Nothing to catchup. All eligible slots posted.');
    process.exit(0);
  }

  console.log(`Catchup target: slot ${targetSlot} (${slots[targetSlot]} WIB)`);

  const result = spawnSync(
    'node',
    ['scripts/generate-and-post.mjs', `--account=${account}`, `--slot=${targetSlot}`],
    { stdio: 'inherit', env: process.env }
  );

  process.exit(result.status || 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
