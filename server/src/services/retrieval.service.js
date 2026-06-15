import { tokenize, extractReferences } from '../utils/text.js';
import { logger } from '../utils/logger.js';
import {
  isAvailable as embeddingsAvailable,
  embedQuery,
  cosineSimilarity,
  getVector,
} from './embeddings.service.js';

// BM25 parameters.
const K1 = 1.5;
const B = 0.75;

let docs = []; // [{ chunk, tokens, length, tf: Map }]
let idf = new Map();
let avgdl = 0;
let built = false;

export const buildIndex = (chunks) => {
  docs = chunks.map((chunk) => {
    const tokens = tokenize(chunk.searchText);
    const tf = new Map();
    for (const token of tokens) tf.set(token, (tf.get(token) || 0) + 1);
    return { chunk, tokens, length: tokens.length, tf };
  });

  const N = docs.length;
  const df = new Map();
  let totalLen = 0;
  for (const doc of docs) {
    totalLen += doc.length;
    for (const term of new Set(doc.tokens)) df.set(term, (df.get(term) || 0) + 1);
  }
  avgdl = N ? totalLen / N : 0;

  idf = new Map();
  for (const [term, freq] of df) {
    idf.set(term, Math.log(1 + (N - freq + 0.5) / (freq + 0.5)));
  }

  built = true;
  logger.success(`Retrieval index built (${N} documents, vocab ${idf.size}).`);
};

const bm25Score = (doc, queryTokens) => {
  let score = 0;
  for (const term of queryTokens) {
    const termIdf = idf.get(term);
    if (!termIdf) continue;
    const freq = doc.tf.get(term) || 0;
    if (!freq) continue;
    const denom = freq + K1 * (1 - B + (B * doc.length) / (avgdl || 1));
    score += termIdf * ((freq * (K1 + 1)) / denom);
  }
  return score;
};

const normalize = (scores) => {
  const max = Math.max(0, ...scores);
  if (max === 0) return scores.map(() => 0);
  return scores.map((s) => s / max);
};

// Returns the top-k chunks for a query, blending lexical BM25, optional
// semantic similarity, and a hard boost for explicitly-cited provisions.
export const search = async (query, k = 6) => {
  if (!built) throw new Error('Retrieval index has not been built');
  const cleanQuery = String(query || '').trim();
  if (!cleanQuery) return [];

  const queryTokens = tokenize(cleanQuery);
  const lexRaw = docs.map((doc) => bm25Score(doc, queryTokens));
  const lex = normalize(lexRaw);

  // Optional semantic layer.
  let sem = docs.map(() => 0);
  let usedSemantic = false;
  if (embeddingsAvailable()) {
    const qVec = await embedQuery(cleanQuery);
    if (qVec) {
      usedSemantic = true;
      sem = docs.map((doc) => {
        const v = getVector(doc.chunk.id);
        return v ? Math.max(0, cosineSimilarity(qVec, v)) : 0;
      });
    }
  }

  // Hard boost for explicit references like "Article 25" or "Section 302".
  const refs = extractReferences(cleanQuery);
  const refKeys = new Set(refs.map((r) => r.key));

  const scored = docs.map((doc, i) => {
    const lexWeight = usedSemantic ? 0.6 : 1;
    const semWeight = usedSemantic ? 0.4 : 0;
    let score = lexWeight * lex[i] + semWeight * sem[i];
    if (refKeys.has(doc.chunk.refKey)) score += 1.5;
    return {
      chunk: doc.chunk,
      score,
      lexScore: lexRaw[i],
      semScore: sem[i],
      exactRef: refKeys.has(doc.chunk.refKey),
    };
  });

  return scored
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
};

export const isBuilt = () => built;
