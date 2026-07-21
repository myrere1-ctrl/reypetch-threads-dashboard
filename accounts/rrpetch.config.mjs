export const config = {
  slug: 'rrpetch',
  brandName: '@rrpetch (reypetch-ai.com)',
  brandDescription:
    'Akun official reypetch-ai.com. Fokus B2B (agen travel/Umroh) + B2C awareness produk. Tone: professional-friendly, product-forward, credible.',
  websiteUrl: 'https://reypetch-ai.com',

  postsPerDay: 10,
  slots: [
    '06.00', '07.30', '09.00', '10.30', '12.00',
    '13.30', '15.00', '17.00', '19.00', '21.00',
  ],

  destinations: [
    'Umroh', 'Hajj', 'Jepang', 'Prancis', 'Italia', 'Spanyol',
    'Agen Umroh', 'Agen travel Jepang', 'Agen travel Eropa',
  ],

  products: [
    { slug: 'safar-ai', name: 'Safar AI', desc: 'AI companion untuk Umroh/Hajj: doa+audio, Qibla GPS, prayer times, Vision AI, chat guide' },
    { slug: 'tomodachi-ai', name: 'Tomodachi AI', desc: 'AI companion untuk travel Jepang: itinerary, transport tips, local eats guide' },
    { slug: 'via-ai', name: 'ViaAI', desc: 'AI companion untuk travel Eropa (Prancis/Italia/Spanyol): route, budget, hidden gems' },
  ],

  angles: [
    { name: 'agency_pain_b2b', instruction: 'Pain point agen travel/Umroh: CS overwhelmed, pertanyaan jamaah 24/7, staff burnout. Angle B2B decision-maker.' },
    { name: 'case_study_short', instruction: 'Cerita singkat use case (60% CS reduction, dll). Format: pain + solution + outcome. Angka konkret bagus.' },
    { name: 'feature_reveal', instruction: 'Highlight 1 fitur spesifik dari produk (Safar/Tomodachi/Via). Fokus manfaat, bukan spec.' },
    { name: 'traveler_tip', instruction: 'Tips untuk traveler individu (jamaah Umroh, wisatawan Jepang/Eropa). Value first, produk mention di ujung.' },
    { name: 'white_label_pitch', instruction: 'Angle: "Agen travel/Umroh Anda bisa punya AI companion ber-brand sendiri tanpa build teknologi". B2B, product-forward.' },
    { name: 'myth_travel', instruction: 'Debunk myth traveling/Umroh (misal: "Umroh butuh mahal banget", "AI ga cocok untuk Umroh"). Reframe.' },
    { name: 'stat_awareness', instruction: 'Angka mengejutkan atau industry insight (misal: X% pertanyaan jamaah sebenarnya bisa dijawab AI).' },
  ],

  ctaSamples: [
    'cek link di bio ya',
    'info lengkap ada di bio 👆',
    'link demo ada di bio',
    'ada agen umroh/travel yang butuh ini?',
    'setuju gak?',
    'share ke agen yang lagi cari solusi',
    'DM kalau mau tau lebih detail',
  ],

  formatRules: [
    '3-5 baris pendek',
    'Bahasa formal-friendly, ga terlalu casual',
    'Sebutkan produk (Safar AI / Tomodachi AI / ViaAI) di tempat natural',
    'Emoji SPARING (max 1-2 per post)',
    'CTA arahkan ke "link di bio" — JANGAN tulis URL (reypetch-ai.com, safarai.reypetch-ai.com, dll) di dalam post. Reach turun kalau ada link. Link biar ditambah manual di DM/message.',
  ],

  antiPatterns: [
    'Terlalu casual sampai kayak akun personal',
    'Emoji spam',
    'Hard-sell yang aggressive ("Beli sekarang!")',
    'Klaim yang berlebihan tanpa proof',
    'Nempelin URL/link apapun di dalam post (reypetch-ai.com, safarai.reypetch-ai.com, dll) — reach turun. Cukup "cek link di bio".',
  ],

  brandInfo:
    'reypetch-ai.com — platform AI companion untuk travel + Umroh. 3 produk utama: Safar AI (Umroh, Vision AI + Qibla GPS + chat), Tomodachi AI (Jepang travel), ViaAI (Prancis/Italia/Spanyol). Model bisnis: B2C individual $9/bulan per email, atau white-label ke agen travel/Umroh (subdomain ber-brand klien). Free apps: NurulQuran, COA Adventure AI. Positioning: bukan chatbot generic, tapi AI companion khusus vertikal travel/spiritual.',

  voiceSignature: `- Professional-friendly, bukan corporate-stiff
- Menyertakan nama produk konkret (Safar AI, Tomodachi AI, ViaAI)
- Kredibel, factual, tapi tetap warm
- Fokus outcome untuk agen: hemat waktu staff, jamaah lebih nyaman, brand terlihat modern`,
};
