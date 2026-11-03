const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Minuscule, sans accents ni ponctuation superflue. */
function normalize(str = '') {
  return String(str)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\(?\b[hf]\s*\/\s*[hf]\b\)?/g, ' ') // « H/F », « (F/H) »
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Vrai si un des motifs apparaît en début de mot dans le texte. */
function matchesAny(text, patterns) {
  const t = ` ${normalize(text)} `;
  return patterns.some((p) => t.includes(` ${normalize(p)}`));
}

function stripHtml(str = '') {
  return String(str)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(str = '', max = 300) {
  return str.length > max ? `${str.slice(0, max - 1).trimEnd()}…` : str;
}

async function fetchJson(url, options = {}, { retries = 2 } = {}) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { ...options, signal: AbortSignal.timeout(20000) });
    if (res.status === 204) return null;
    if ((res.status === 429 || res.status >= 500) && attempt < retries) {
      await sleep(1000 * 2 ** attempt);
      continue;
    }
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} sur ${url.split('?')[0]} : ${body.slice(0, 200)}`);
    }
    return res.json();
  }
}

module.exports = { sleep, normalize, matchesAny, stripHtml, truncate, fetchJson };
