const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Bilingual prompt wrapper text. Default 'id' — akun tanpa `config.language`
// (iamehijrah, rrpetch) ga berubah sama sekali. 'en' dipakai iams.
const LABELS = {
  id: {
    recentHistory: 'RIWAYAT POST TERAKHIR (JANGAN kontradiksi klaim spesifik di sini, JANGAN ulang topik/struktur yang sama persis — variasikan):',
    exampleHeader: (i, angle) => `Contoh ${i} (angle: ${angle}):`,
    role: (name) => `Kamu content creator Threads untuk ${name}.`,
    buildLine: 'Buat 1 post Threads Bahasa Indonesia:',
    productCtx: 'Konteks produk (kalau dibutuhkan)',
    destTopic: 'Destinasi/topik',
    noteLabel: 'Catatan',
    angleLabel: 'ANGLE WAJIB:',
    mentionNone: (products) => `MODE: PURE STORY — JANGAN sebut nama produk apapun (${products}). Post ini murni cerita/opini/reveal personal. Zero pitching.`,
    mentionSubtle: (name) => `MODE: SUBTLE MENTION — Cerita dulu (2-3 baris), lalu di baris terakhir sebut produk 1 kali dengan format natural: "aku pakai ${name}" atau "cek ${name} di bio" atau "link di bio". SATU baris doang. JANGAN list fitur produk. JANGAN puji-puji produk.`,
    mentionFocused: 'MODE: PRODUCT FOCUSED — Cerita + jelaskan nilai produk. Tapi tetap dalam tone akun ini (casual, bukan brochure).',
    exampleBlockHeader: (few) => `CONTOH POST YANG WORK di akun ini (mimic style-nya, jangan copy persis):\n\n${few}`,
    formatLabel: 'Format post:',
    charLimit: 'BATAS KARAKTER: total teks + CTA MAX 450 karakter (buffer dari Threads limit 500).',
    voiceLabel: (name) => `Voice signature ${name}:`,
    avoidLabel: (rules) => `HINDARI KETAT:\n${rules}`,
    outputLabel: 'PENTING - format output WAJIB persis pakai tag:',
    outputFooter: 'Gunakan pipe | untuk jeda baris. JANGAN pakai newline asli di dalam teks. JANGAN pakai quote dobel. JANGAN tulis apapun di luar tag.',
    affiliateBuildLine: 'Buat 1 post Threads Bahasa Indonesia yang REKOMENDASIIN produk ini secara personal & natural (BUKAN iklan/brosur):',
    affiliateProductLabel: 'Produk',
    affiliateWhyLabel: 'Kenapa worth',
    affiliateMode: 'MODE: cerita personal singkat kenapa produk ini kepake/berguna buat kamu (2-3 baris), kayak share tips ke temen. JANGAN listing fitur produk kayak brosur. JANGAN bahasa hard-sell ("beli sekarang", "diskon", "buruan", "cuma hari ini").',
    affiliateCtaNote: 'CTA WAJIB kasih tau link ada di KOMEN (bukan bio, bukan link di post ini) — variasikan kalimatnya tiap kali, jangan sama persis.',
    affiliateCtaExample: 'link di komen ya (contoh — variasikan kalimatnya)',
    affiliateOutputFooter: 'Gunakan pipe | untuk jeda baris. JANGAN pakai newline asli di dalam teks. JANGAN pakai quote dobel. JANGAN tulis apapun di luar tag. JANGAN tulis URL apapun di teks/cta.',
  },
  en: {
    recentHistory: 'RECENT POST HISTORY (do NOT contradict specific claims here, do NOT repeat the exact same topic/structure — vary it):',
    exampleHeader: (i, angle) => `Example ${i} (angle: ${angle}):`,
    role: (name) => `You are a Threads content creator for ${name}.`,
    buildLine: 'Write 1 Threads post in English:',
    productCtx: 'Product context (if relevant)',
    destTopic: 'Destination/topic',
    noteLabel: 'Note',
    angleLabel: 'REQUIRED ANGLE:',
    mentionNone: (products) => `MODE: PURE STORY — Do NOT mention any product names (${products}). This post is purely a personal story/opinion/reveal. Zero pitching.`,
    mentionSubtle: (name) => `MODE: SUBTLE MENTION — Tell the story first (2-3 lines), then in the last line mention the product once, naturally: "I use ${name}" or "check ${name} in my bio" or "link in bio". ONE line only. Do NOT list product features. Do NOT hype up the product.`,
    mentionFocused: "MODE: PRODUCT FOCUSED — Story + explain the product's value. But keep this account's tone (casual, not a brochure).",
    exampleBlockHeader: (few) => `EXAMPLES OF POSTS THAT WORK for this account (mimic the style, don't copy directly):\n\n${few}`,
    formatLabel: 'Post format:',
    charLimit: "CHARACTER LIMIT: total text + CTA MAX 450 characters (buffer under Threads' 500 limit).",
    voiceLabel: (name) => `Voice signature for ${name}:`,
    avoidLabel: (rules) => `STRICTLY AVOID:\n${rules}`,
    outputLabel: 'IMPORTANT - output format MUST use exactly these tags:',
    outputFooter: 'Use a pipe | for line breaks. Do NOT use real newlines inside the text. Do NOT use double quotes. Do NOT write anything outside the tags.',
    affiliateBuildLine: 'Write 1 Threads post in English that naturally & personally RECOMMENDS this product (NOT an ad/brochure):',
    affiliateProductLabel: 'Product',
    affiliateWhyLabel: "Why it's worth it",
    affiliateMode: 'MODE: a short personal story about why this product is useful to you (2-3 lines), like sharing a tip with a friend. Do NOT list product features like a brochure. Do NOT use hard-sell language ("buy now", "discount", "hurry", "today only").',
    affiliateCtaNote: "CTA MUST mention the link is in the COMMENTS (not bio, not linked in this post) — vary the phrasing each time, don't repeat the same line.",
    affiliateCtaExample: 'link is in the comments (example — vary the phrasing)',
    affiliateOutputFooter: 'Use a pipe | for line breaks. Do NOT use real newlines inside the text. Do NOT use double quotes. Do NOT write anything outside the tags. Do NOT write any URL in the text/cta.',
  },
};

function L(config) {
  return LABELS[config?.language === 'en' ? 'en' : 'id'];
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
  const t = L(config);
  return picks
    .map((e, i) => `${t.exampleHeader(i + 1, e.angle)}\n"${e.text}"`)
    .join('\n\n');
}

function recentPostsBlock(config, recentPosts) {
  if (!recentPosts?.length) return '';
  const lines = recentPosts
    .slice(-12)
    .map((t, i) => `${i + 1}. "${(t || '').replace(/\n/g, ' ').slice(0, 160)}"`)
    .join('\n');
  return `${L(config).recentHistory}\n${lines}`;
}

export function buildPrompt({ config, angle, product, destination, note = '', recentPosts = [] }) {
  const t = L(config);
  const mentionMode = angle.mention || 'none';
  const mentionInstructions = {
    none: t.mentionNone(config.products.map((p) => p.name).join(', ')),
    subtle: t.mentionSubtle(product?.name),
    focused: t.mentionFocused,
  }[mentionMode];

  const few = fewShotBlock(config, angle);
  const history = recentPostsBlock(config, recentPosts);

  const parts = [
    t.role(config.brandName),
    '',
    config.brandDescription,
    '',
    t.buildLine,
    `- ${t.productCtx}: ${product?.name || '-'}`,
    `- ${t.destTopic}: ${destination}`,
    `- ${t.noteLabel}: ${note || '-'}`,
    '',
    t.angleLabel,
    `**${angle.name}** — ${angle.instruction}`,
    '',
    mentionInstructions,
    '',
    history,
    history ? '' : null,
    few ? t.exampleBlockHeader(few) : '',
    '',
    t.formatLabel,
    ...config.formatRules.map((r) => `- ${r}`),
    `- ${t.charLimit}`,
    '',
    t.voiceLabel(config.brandName),
    config.voiceSignature,
    '',
    config.antiPatterns ? t.avoidLabel(config.antiPatterns.map((r) => `- ${r}`).join('\n')) : '',
    '',
    t.outputLabel,
    `<teks>baris1|baris2|baris3</teks>`,
    `<cta>${pickRandom(config.ctaSamples)}</cta>`,
    '',
    t.outputFooter,
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

export async function generatePost({ apiKey, config, product, destination, note = '', recentPosts = [] }) {
  const angle = pickRandom(config.angles);
  let lastFull = '';
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    attempt++;
    const shortenNote = attempt > 1
      ? `${note ? note + ' ' : ''}[RETRY ${attempt}: post sebelumnya ${lastFull.length} karakter — LEBIH PENDEK, max 400 total]`
      : note;
    const prompt = buildPrompt({ config, angle, product, destination, note: shortenNote, recentPosts });
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

// ===== AFFILIATE POST (rekomendasi produk asli dari data/<account>/products.json) =====
// Beda dari generatePost: bukan promosi app internal, tapi rekomendasi barang nyata
// (Amazon/Shopee). Link taruh di REPLY (auto), bukan di post ini.
export function buildAffiliatePrompt({ config, item, recentPosts = [] }) {
  const t = L(config);
  const history = recentPostsBlock(config, recentPosts);
  const parts = [
    t.role(config.brandName),
    '',
    config.brandDescription,
    '',
    t.affiliateBuildLine,
    `- ${t.affiliateProductLabel}: ${item.name}`,
    `- ${t.affiliateWhyLabel}: ${item.blurb}`,
    '',
    t.affiliateMode,
    '',
    history,
    history ? '' : null,
    t.formatLabel,
    ...config.formatRules.map((r) => `- ${r}`),
    `- ${t.charLimit}`,
    `- ${t.affiliateCtaNote}`,
    '',
    t.voiceLabel(config.brandName),
    config.voiceSignature,
    '',
    config.antiPatterns ? t.avoidLabel(config.antiPatterns.map((r) => `- ${r}`).join('\n')) : '',
    '',
    t.outputLabel,
    `<teks>baris1|baris2|baris3</teks>`,
    `<cta>${t.affiliateCtaExample}</cta>`,
    '',
    t.affiliateOutputFooter,
  ];
  return parts.filter(Boolean).join('\n');
}

export async function generateAffiliatePost({ apiKey, config, item, recentPosts = [] }) {
  let lastFull = '';
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    attempt++;
    const retryNote = attempt > 1
      ? `\n\n[RETRY ${attempt}: post sebelumnya ${lastFull.length} karakter — LEBIH PENDEK, max 400 total]`
      : '';
    const prompt = buildAffiliatePrompt({ config, item, recentPosts }) + retryNote;
    const raw = await callClaude({ apiKey, prompt });
    const { teks, cta } = parseResponse(raw);
    const text = teks.replace(/\|/g, '\n');
    const full = `${text}\n\n${cta}`;
    lastFull = full;

    if (full.length <= THREADS_LIMIT) {
      if (attempt > 1) console.log(`Retry ${attempt} succeeded (${full.length} chars)`);
      return { text, cta, angle: 'affiliate', productSlug: null, destination: null, full };
    }
    console.log(`Attempt ${attempt}: affiliate post too long (${full.length} chars > ${THREADS_LIMIT}), retrying...`);
  }

  console.warn(`All ${MAX_RETRIES} retries exceeded limit. Hard truncating.`);
  const truncated = lastFull.slice(0, THREADS_LIMIT - 3) + '...';
  return { text: truncated, cta: '', angle: 'affiliate', productSlug: null, destination: null, full: truncated };
}
