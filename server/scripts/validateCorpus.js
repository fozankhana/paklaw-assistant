// Sanity-checks the legal corpus: required fields, unique ids, and a summary.
// Run with:  npm run validate
import { loadCorpus, getChunks, getDocuments } from '../src/services/corpus.service.js';

const errors = [];
const { chunks } = loadCorpus();
const documents = getDocuments();

const seenIds = new Set();
for (const c of chunks) {
  if (!c.document) errors.push(`Missing document name on ${c.id}`);
  if (!c.ref) errors.push(`Missing ref on ${c.id}`);
  if (!c.title) errors.push(`Missing title on ${c.id}`);
  if (!c.text || c.text.length < 20) errors.push(`Suspiciously short text on ${c.id}`);
  if (seenIds.has(c.id)) errors.push(`Duplicate id: ${c.id}`);
  seenIds.add(c.id);
}

console.log('\n=== PakLaw Corpus Validation ===');
for (const doc of documents) {
  console.log(`  • ${doc.document} (${doc.slug}) — ${doc.entryCount} provisions`);
}
console.log(`  Total provisions: ${getChunks().length}`);

if (errors.length) {
  console.error(`\n✗ ${errors.length} problem(s) found:`);
  for (const e of errors) console.error(`   - ${e}`);
  process.exit(1);
}

console.log('\n✓ Corpus is valid.\n');
process.exit(0);
