import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { env, isProd } from './config/env.js';
import { logger } from './utils/logger.js';
import apiRouter from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

import { loadCorpus, getChunks } from './services/corpus.service.js';
import { buildIndex } from './services/retrieval.service.js';
import { initEmbeddings } from './services/embeddings.service.js';
import { initLocalModel } from './services/localLlm.service.js';

const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.clientUrl, credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  if (!isProd) app.use(morgan('dev'));

  app.use(
    '/api',
    rateLimit({
      windowMs: 60 * 1000,
      max: 60,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Too many requests, please slow down.' },
    }),
  );

  app.get('/', (req, res) => {
    res.json({ name: 'PakLaw Assistant API', status: 'running', docs: '/api/health' });
  });

  app.use('/api', apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};

const bootstrap = async () => {
  // 1. Load and index the legal corpus before accepting traffic.
  loadCorpus();
  buildIndex(getChunks());

  // 2. Build optional semantic embeddings (no-op when EMBEDDINGS=off).
  await initEmbeddings(getChunks());

  // 3. Load local GGUF model if LLAMA_MODEL_PATH is configured.
  await initLocalModel();

  const app = createApp();
  app.listen(env.port, () => {
    logger.success(`PakLaw Assistant API running on http://localhost:${env.port}`);
    logger.info(`Ollama target: ${env.ollamaUrl} (model: ${env.ollamaModel})`);
  });
};

bootstrap().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
