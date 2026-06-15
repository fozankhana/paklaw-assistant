import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, '..', '..', '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'embeddings.json');
const MODEL_ID = 'Xenova/all-MiniLM-L6-v2';

let available = false;
let extractor = null;
const vectors = new Map(); // chunk id -> Float32Array

export const isAvailable = () => available;

const meanPoolNormalize = (output) => {
  // @xenova feature-extraction with { pooling: 'mean', normalize: true }
  // already returns a normalized sentence vector; just copy the data out.
  return Array.from(output.data);
};

const embedText = async (text) => {
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return meanPoolNormalize(output);
};

const loadCache = () => {
  try {
    if (!fs.existsSync(CACHE_FILE)) return null;
    return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
  } catch {
    return null;
  }
};

const saveCache = (items) => {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(
      CACHE_FILE,
      JSON.stringify({ model: MODEL_ID, items }, null, 0),
      'utf-8',
    );
  } catch (err) {
    logger.warn('Could not write embeddings cache:', err.message);
  }
};

// Build (or load) embeddings for every corpus chunk. Any failure leaves the
// retriever to operate on lexical BM25 alone — embeddings are a bonus, never
// a hard dependency.
export const initEmbeddings = async (chunks) => {
  if (!env.embeddings) {
    logger.info('Embeddings disabled (EMBEDDINGS=off) — using lexical retrieval only.');
    return false;
  }

  try {
    const { pipeline, env: xenovaEnv } = await import('@xenova/transformers');
    xenovaEnv.cacheDir = path.join(CACHE_DIR, 'models');
    xenovaEnv.allowLocalModels = true;

    const cache = loadCache();
    const ids = new Set(chunks.map((c) => c.id));
    const cacheValid =
      cache && cache.model === MODEL_ID && chunks.every((c) => cache.items[c.id]);

    if (cacheValid) {
      for (const c of chunks) vectors.set(c.id, cache.items[c.id]);
      available = true;
      logger.success(`Embeddings loaded from cache (${vectors.size} vectors).`);
      return true;
    }

    logger.info('Building sentence embeddings (first run downloads a small model)…');
    extractor = await pipeline('feature-extraction', MODEL_ID);

    const items = {};
    for (const c of chunks) {
      const vec = await embedText(`${c.ref}. ${c.title}. ${c.text}`);
      vectors.set(c.id, vec);
      items[c.id] = vec;
    }
    saveCache(items);
    available = true;
    logger.success(`Embeddings ready (${vectors.size} vectors).`);
    return true;
  } catch (err) {
    available = false;
    logger.warn(
      'Embeddings unavailable, continuing with lexical retrieval only:',
      err.message,
    );
    return false;
  }
};

export const embedQuery = async (text) => {
  if (!available || !extractor) return null;
  try {
    return await embedText(text);
  } catch (err) {
    logger.warn('Query embedding failed:', err.message);
    return null;
  }
};

export const cosineSimilarity = (a, b) => {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i += 1) dot += a[i] * b[i];
  return dot; // vectors are L2-normalized, so dot product == cosine similarity
};

export const getVector = (id) => vectors.get(id) || null;
