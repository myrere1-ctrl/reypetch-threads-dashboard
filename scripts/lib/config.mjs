import path from 'node:path';
import { pathToFileURL } from 'node:url';

const VALID_ACCOUNTS = ['iams', 'rrpetch', 'iamehijrah'];

export async function loadAccountConfig(account) {
  if (!VALID_ACCOUNTS.includes(account)) {
    throw new Error(`Unknown account: "${account}". Valid: ${VALID_ACCOUNTS.join(', ')}`);
  }
  const configPath = path.resolve(`accounts/${account}.config.mjs`);
  const mod = await import(pathToFileURL(configPath).href);
  return mod.config;
}

export function parseAccountArg() {
  for (const a of process.argv.slice(2)) {
    if (a.startsWith('--account=')) return a.split('=')[1];
  }
  const env = process.env.ACCOUNT;
  if (env) return env;
  throw new Error('Missing --account=<iams|rrpetch|iamehijrah> or ACCOUNT env var');
}

export function dataPath(account, file) {
  return path.resolve(`data/${account}/${file}`);
}
