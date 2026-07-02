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

export function buildPrompt({ config, angle, product, destination, note = '' }) {
  const parts = [
    `Kamu content creator Threads untuk ${config.brandName}.`,
    '',
    config.brandDescription,
    '',
    `Buat 1 post Threads Bahasa Indonesia:`,
    `- Produk fokus: ${product?.name || '-'} (${product?.desc || '-'})`,
    `- Destinasi/topik: ${destination}`,
    `- Catatan: ${note || '-'}`,
    '',
    `ANGLE WAJIB (paling penting, jangan default ke formula umum):`,
    `**${angle.name}** — ${angle.instruction}`,
    '',
    `Format post:`,
    ...config.formatRules.map((r) => `- ${r}`),
    '',
    `Voice signature ${config.brandName}:`,
    config.voiceSignature,
    '',
    config.antiPatterns ? `HINDARI:\n${config.antiPatterns.map((r) => `- ${r}`).join('\n')}` : '',
    '',
    `Info brand (natural fit only, TIDAK forced):`,
    config.brandInfo,
    '',
    `PENTING - format output WAJIB persis pakai tag:`,
    `<teks>baris1|baris2|baris3</teks>`,
    `<cta>${pickRandom(config.ctaSamples)}</cta>`,
    '',
    `Gunakan pipe | untuk jeda baris. JANGAN pakai newline asli di dalam teks. JANGAN pakai quote dobel. JANGAN tulis apapun di luar tag.`,
  ];
  return parts.filter(Boolean).join('\n');
}

export async function generatePost({ apiKey, config, product, destination, note = '' }) {
  const angle = pickRandom(config.angles);
  const prompt = buildPrompt({ config, angle, product, destination, note });

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
  if (!res.ok) {
    throw new Error(`Anthropic ${res.status}: ${JSON.stringify(data)}`);
  }

  const raw = data.content?.[0]?.text || '';
  const { teks, cta } = parseResponse(raw);
  const text = teks.replace(/\|/g, '\n');
  return {
    text,
    cta,
    angle: angle.name,
    productSlug: product?.slug || null,
    destination,
    full: `${text}\n\n${cta}`,
  };
}
