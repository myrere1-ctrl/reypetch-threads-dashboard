const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function extractField(raw, tag) {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i');
  const m = raw.match(re);
  return m ? m[1].trim() : null;
}

function parseResponse(raw) {
  let teks = extractField(raw, 'teks');
  let cta = extractField(raw, 'cta');
  if (teks && cta) return { teks, cta };

  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start !== -1 && end !== -1) {
    try {
      const parsed = JSON.parse(raw.slice(start, end + 1));
      if (parsed.teks && parsed.cta) return { teks: parsed.teks, cta: parsed.cta };
    } catch {}
  }

  const teksMatch = raw.match(/"teks"\s*:\s*"([\s\S]*?)"\s*,\s*"cta"/);
  const ctaMatch = raw.match(/"cta"\s*:\s*"([\s\S]*?)"\s*[},]/);
  if (teksMatch && ctaMatch) {
    return { teks: teksMatch[1], cta: ctaMatch[1] };
  }

  throw new Error('Cannot parse response: ' + raw.slice(0, 500));
}

function fewShotBlock(config, angle) {
  if (!config.fewShotExamples?.length) return '';
  // Prefer examples matching this angle, else pick any 3
  const matched = config.fewShotExamples.filter((e) => e.angle === angle.name);
  const others = config.fewShotExamples.filter((e) => e.angle !== angle.name);
  const picks = [...matched, ...others].slice(0, 3);
  return picks
    .map((e, i) => `Contoh ${i + 1} (angle: ${e.angle}):\n"${e.text}"`)
    .join('\n\n');
}

export function buildPrompt({ config, angle, product, destination, note = '' }) {
  const mentionMode = angle.mention || 'none';
  const mentionInstructions = {
    none: `MODE: PURE STORY — JANGAN sebut nama produk apapun (${config.products
      .map((p) => p.name)
      .join(', ')}). Post ini murni cerita/opini/reveal personal. Zero pitching.`,
    subtle: `MODE: SUBTLE MENTION — Cerita dulu (2-3 baris), lalu di baris terakhir sebut produk 1 kali dengan format natural: "aku pakai ${product?.name}" atau "cek ${product?.name} di bio" atau "link di bio". SATU baris doang. JANGAN list fitur produk. JANGAN puji-puji produk.`,
    focused: `MODE: PRODUCT FOCUSED — Cerita + jelaskan nilai produk. Tapi tetap dalam tone iams_ichi (casual, bukan brochure).`,
  }[mentionMode];

  const few = fewShotBlock(config, angle);

  const parts = [
    `Kamu content creator Threads untuk ${config.brandName}.`,
    '',
    config.brandDescription,
    '',
    `Buat 1 post Threads Bahasa Indonesia:`,
    `- Konteks produk (kalau dibutuhkan): ${product?.name || '-'}`,
    `- Destinasi/topik: ${destination}`,
    `- Catatan: ${note || '-'}`,
    '',
    `ANGLE WAJIB:`,
    `**${angle.name}** — ${angle.instruction}`,
    '',
    mentionInstructions,
    '',
    few ? `CONTOH POST YANG WORK di akun ini (mimic style-nya, jangan copy persis):\n\n${few}` : '',
    '',
    `Format post:`,
    ...config.formatRules.map((r) => `- ${r}`),
    `- BATAS KARAKTER: total teks + CTA MAX 450 karakter (buffer dari Threads limit 500).`,
    '',
    `Voice signature ${config.brandName}:`,
    config.voiceSignature,
    '',
    config.antiPatterns ? `HINDARI KETAT:\n${config.antiPatterns.map((r) => `- ${r}`).join('\n')}` : '',
    '',
    `PENTING - format output WAJIB persis pakai tag:`,
    `<teks>baris1|baris2|baris3</teks>`,
    `<cta>${pickRandom(config.ctaSamples)}</cta>`,
    '',
    `Gunakan pipe | untuk jeda baris. JANGAN pakai newline asli di dalam teks. JANGAN pakai quote dobel. JANGAN tulis apapun di luar tag.`,
  ];
  return parts.filter(Boolean).join('\n');
}

const THREADS_LIMIT = 500;
const MAX_RETRIES = 3;

async function callClaude({ apiKey, prompt }) {
  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 400,
      temperature: 1.0,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${JSON.stringify(data)}`);
  return data.content?.[0]?.text || '';
}

export async function generatePost({ apiKey, config, product, destination, note = '' }) {
  const angle = pickRandom(config.angles);
  let lastFull = '';
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    attempt++;
    const shortenNote = attempt > 1
      ? `${note ? note + ' ' : ''}[RETRY ${attempt}: post sebelumnya ${lastFull.length} karakter — LEBIH PENDEK, max 400 total]`
      : note;
    const prompt = buildPrompt({ config, angle, product, destination, note: shortenNote });
    const raw = await callClaude({ apiKey, prompt });
    const { teks, cta } = parseResponse(raw);
    const text = teks.replace(/\|/g, '\n');
    const full = `${text}\n\n${cta}`;
    lastFull = full;

    if (full.length <= THREADS_LIMIT) {
      if (attempt > 1) console.log(`Retry ${attempt} succeeded (${full.length} chars)`);
      return {
        text, cta,
        angle: angle.name,
        productSlug: product?.slug || null,
        destination,
        full,
      };
    }
    console.log(`Attempt ${attempt}: post too long (${full.length} chars > ${THREADS_LIMIT}), retrying...`);
  }

  console.warn(`All ${MAX_RETRIES} retries exceeded limit. Hard truncating.`);
  const truncated = lastFull.slice(0, THREADS_LIMIT - 3) + '...';
  return {
    text: truncated, cta: '',
    angle: angle.name,
    productSlug: product?.slug || null,
    destination,
    full: truncated,
  };
}
