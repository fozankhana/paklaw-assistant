// Lightweight text utilities shared by the corpus loader and the retriever.

export const slugify = (value = '') =>
  String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

// A compact English/legal stopword list. Numbers are deliberately kept so that
// queries like "Article 25" or "Section 302" retain their most important token.
const STOPWORDS = new Set(
  (
    'a an the and or but if then else of to in on at by for with about against between into ' +
    'through during before after above below from up down out off over under again further once ' +
    'is are was were be been being have has had do does did doing this that these those i you he ' +
    'she it we they them his her its our your their what which who whom whose when where why how ' +
    'all any both each few more most other some such no nor not only own same so than too very can ' +
    'will just shall should would could may might must as per shall'
  ).split(/\s+/),
);

export const tokenize = (value = '') => {
  const cleaned = String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ');
  return cleaned
    .split(/\s+/)
    .filter((token) => token.length >= 2 || /\d/.test(token))
    .filter((token) => !STOPWORDS.has(token));
};

// Detect explicit references such as "article 25", "art 19a", "section 302",
// "sec 489f" so the retriever can hard-boost exact provisions.
export const extractReferences = (value = '') => {
  const refs = [];
  const regex = /\b(art(?:icle)?|sec(?:tion)?|s)\.?\s*(\d+\s*-?\s*[a-z]?)\b/gi;
  let match;
  while ((match = regex.exec(value)) !== null) {
    const kind = match[1].toLowerCase().startsWith('art') ? 'article' : 'section';
    const number = match[2].replace(/[\s-]/g, '').toLowerCase();
    refs.push({ kind, number, key: `${kind}-${number}` });
  }
  return refs;
};

// Parse "Article 25A" / "Section 489-F" into a normalized lookup key.
export const refToKey = (ref = '') => {
  const match = String(ref).match(/(article|section|art|sec|s)\.?\s*(\d+\s*-?\s*[a-z]?)/i);
  if (!match) return slugify(ref);
  const kind = match[1].toLowerCase().startsWith('art') ? 'article' : 'section';
  const number = match[2].replace(/[\s-]/g, '').toLowerCase();
  return `${kind}-${number}`;
};

export const refNumber = (ref = '') => {
  const match = String(ref).match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
};

export const snippet = (value = '', length = 240) => {
  const clean = String(value).replace(/\s+/g, ' ').trim();
  return clean.length > length ? `${clean.slice(0, length).trim()}…` : clean;
};
