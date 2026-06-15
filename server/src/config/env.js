import dotenv from 'dotenv';

dotenv.config();

const toInt = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  port: toInt(process.env.PORT, 5000),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  ollamaUrl: (process.env.OLLAMA_URL || 'http://localhost:11434').replace(/\/$/, ''),
  ollamaModel: process.env.OLLAMA_MODEL || 'llama3.1',
  ollamaTimeoutMs: toInt(process.env.OLLAMA_TIMEOUT_MS, 45000),

  embeddings: (process.env.EMBEDDINGS || 'off').toLowerCase() === 'on',
  retrievalTopK: toInt(process.env.RETRIEVAL_TOP_K, 6),

  llamaModelPath: process.env.LLAMA_MODEL_PATH || '',
  llamaContextSize: toInt(process.env.LLAMA_CONTEXT_SIZE, 4096),
  llamaTimeoutMs: toInt(process.env.LLAMA_TIMEOUT_MS, 120000),
};

export const isProd = env.nodeEnv === 'production';
