import { env } from '../config/env.js';
import { getChunks, getDocuments } from '../services/corpus.service.js';
import { isAvailable as embeddingsAvailable } from '../services/embeddings.service.js';
import { isOllamaUp } from '../services/llm.service.js';
import { isLocalModelAvailable } from '../services/localLlm.service.js';

export const health = async (req, res) => {
  const [ollama, localModel] = await Promise.all([isOllamaUp(), Promise.resolve(isLocalModelAvailable())]);

  const activeModel = localModel ? 'local-llama' : ollama ? env.ollamaModel : null;

  res.json({
    status: 'ok',
    chunks: getChunks().length,
    documents: getDocuments().length,
    embeddings: embeddingsAvailable(),
    localModel,
    ollama,
    model: activeModel,
    retrievalMode: embeddingsAvailable() ? 'hybrid (lexical + semantic)' : 'lexical (BM25)',
  });
};
