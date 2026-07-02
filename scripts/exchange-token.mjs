import { exchangeForLongLived } from './lib/threads.mjs';

const APP_ID = process.env.THREADS_APP_ID;
const REDIRECT_URI = process.env.REDIRECT_URI || 'https://localhost/';
const code = process.env.CODE;
const appSecret = process.env.THREADS_APP_SECRET;

if (!APP_ID) throw new Error('THREADS_APP_ID env missing');
if (!code) throw new Error('CODE env missing');
if (!appSecret) throw new Error('THREADS_APP_SECRET env missing');

const params = new URLSearchParams({
  client_id: APP_ID,
  client_secret: appSecret,
  grant_type: 'authorization_code',
  redirect_uri: REDIRECT_URI,
  code: code.replace(/#_$/, ''),
});

const shortRes = await fetch('https://graph.threads.net/oauth/access_token', {
  method: 'POST',
  body: params,
});
const shortRaw = await shortRes.text();
if (!shortRes.ok) throw new Error('Short token failed: ' + shortRaw);

const userIdMatch = shortRaw.match(/"user_id"\s*:\s*(\d+)/);
const tokenMatch = shortRaw.match(/"access_token"\s*:\s*"([^"]+)"/);
if (!userIdMatch || !tokenMatch) throw new Error('Cannot parse short token: ' + shortRaw);

const userId = userIdMatch[1];
const shortToken = tokenMatch[1];

console.log('short_token user_id:', userId);

const long = await exchangeForLongLived({ token: shortToken, appSecret });

console.log('---');
console.log('LONG TOKEN:', long.access_token);
console.log('Expires in days:', Math.floor(long.expires_in / 86400));
console.log('---');
console.log('Set GitHub Secrets untuk akun ini:');
console.log('  <ACCOUNT_UPPER>_THREADS_ACCESS_TOKEN =', long.access_token);
console.log('  <ACCOUNT_UPPER>_THREADS_USER_ID =', userId);
