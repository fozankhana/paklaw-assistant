// Precomputes the semantic embedding cache so the first request is fast.
// Requires EMBEDDINGS=on and the optional @xenova/transformers dependency.
// Run with:  EMBEDDINGS=on npm run build-index   (PowerShell: $env:EMBEDDINGS='on'; npm run build-index)
import { loadCorpus, getChunks } from '../src/services/corpus.service.js';
import { initEmbeddings, isAvailable } from '../src/services/embeddings.service.js';

const run = async () => {
  loadCorpus();
  await initEmbeddings(getChunks());
  if (isAvailable()) {
    console.log('\n✓ Embedding cache built successfully.\n');
  } else {
    console.log(
      '\n! Embeddings were not built. Set EMBEDDINGS=on and ensure @xenova/transformers is installed.\n',
    );
  }
  process.exit(0);
};

run();
