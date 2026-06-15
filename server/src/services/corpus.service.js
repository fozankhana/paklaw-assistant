import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { logger } from '../utils/logger.js';
import { refToKey, refNumber } from '../utils/text.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');

let chunks = [];
let documents = [];
let loaded = false;

const readJsonFiles = () => {
  const files = [];
  const rootEntries = fs.readdirSync(DATA_DIR, { withFileTypes: true });

  for (const entry of rootEntries) {
    if (entry.isFile() && entry.name.endsWith('.json')) {
      files.push(path.join(DATA_DIR, entry.name));
    }
    if (entry.isDirectory()) {
      const dir = path.join(DATA_DIR, entry.name);
      for (const sub of fs.readdirSync(dir)) {
        if (sub.endsWith('.json')) files.push(path.join(dir, sub));
      }
    }
  }
  return files.map((file) => JSON.parse(fs.readFileSync(file, 'utf-8')));
};

export const loadCorpus = () => {
  if (loaded) return { chunks, documents };

  const docs = readJsonFiles();
  chunks = [];
  documents = [];

  for (const doc of docs) {
    const groups = new Set();
    const entries = (doc.entries || []).map((entry) => {
      const group = entry.part || entry.chapter || null;
      if (group) groups.add(group);
      const refKey = refToKey(entry.ref);
      const refType = /article/i.test(entry.ref) ? 'article' : 'section';
      const chunk = {
        id: `${doc.slug}::${refKey}`,
        document: doc.document,
        documentSlug: doc.slug,
        documentType: doc.type,
        year: doc.year || null,
        citation: doc.citation || null,
        group,
        ref: entry.ref,
        refKey,
        refType,
        refNumber: refNumber(entry.ref),
        title: entry.title || entry.ref,
        text: entry.text || '',
        searchText: [entry.ref, entry.title, group, entry.text].filter(Boolean).join('. '),
      };
      chunks.push(chunk);
      return chunk;
    });

    documents.push({
      document: doc.document,
      slug: doc.slug,
      type: doc.type,
      year: doc.year || null,
      citation: doc.citation || null,
      description: doc.description || '',
      entryCount: entries.length,
      groups: [...groups],
    });
  }

  // Stable order: constitution first, then acts by year.
  documents.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'constitution' ? -1 : 1;
    return (a.year || 0) - (b.year || 0);
  });

  loaded = true;
  logger.success(
    `Corpus loaded: ${chunks.length} provisions across ${documents.length} documents`,
  );
  return { chunks, documents };
};

export const getChunks = () => {
  if (!loaded) loadCorpus();
  return chunks;
};

export const getDocuments = () => {
  if (!loaded) loadCorpus();
  return documents;
};

export const getDocument = (slug) => {
  if (!loaded) loadCorpus();
  const meta = documents.find((d) => d.slug === slug);
  if (!meta) return null;

  const entries = chunks
    .filter((c) => c.documentSlug === slug)
    .map(({ ref, refKey, refType, refNumber: num, title, text, group }) => ({
      ref,
      refKey,
      refType,
      refNumber: num,
      title,
      text,
      group,
    }));

  // Group entries under their part/chapter heading, preserving first-seen order.
  const grouped = [];
  const indexByGroup = new Map();
  for (const entry of entries) {
    const key = entry.group || 'General';
    if (!indexByGroup.has(key)) {
      indexByGroup.set(key, grouped.length);
      grouped.push({ group: key, entries: [] });
    }
    grouped[indexByGroup.get(key)].entries.push(entry);
  }

  return { ...meta, sections: grouped };
};

export const getEntry = (slug, refKey) => {
  if (!loaded) loadCorpus();
  const list = chunks.filter((c) => c.documentSlug === slug);
  const index = list.findIndex((c) => c.refKey === refKey);
  if (index === -1) return null;

  const current = list[index];
  return {
    document: current.document,
    documentSlug: current.documentSlug,
    citation: current.citation,
    group: current.group,
    ref: current.ref,
    refKey: current.refKey,
    refType: current.refType,
    title: current.title,
    text: current.text,
    prev: index > 0 ? { ref: list[index - 1].ref, refKey: list[index - 1].refKey } : null,
    next:
      index < list.length - 1
        ? { ref: list[index + 1].ref, refKey: list[index + 1].refKey }
        : null,
  };
};
