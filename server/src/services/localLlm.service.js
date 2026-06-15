import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let llamaLib = null;
let llamaRuntime = null;
let llamaModel = null;
let available = false;
let loadError = null;

export const initLocalModel = async () => {
  if (!env.llamaModelPath) {
    logger.info('[LocalLLM] LLAMA_MODEL_PATH not set — skipping local GGUF model');
    return;
  }

  try {
    llamaLib = await import('node-llama-cpp');
    llamaRuntime = await llamaLib.getLlama();
    llamaModel = await llamaRuntime.loadModel({ modelPath: env.llamaModelPath });
    available = true;
    logger.success(`[LocalLLM] Loaded GGUF model from ${env.llamaModelPath}`);
  } catch (err) {
    loadError = err.message;
    logger.warn(`[LocalLLM] Could not load model: ${err.message}`);
    available = false;
  }
};

export const isLocalModelAvailable = () => available;

export const getLocalModelError = () => loadError;

export const generateLocal = async (systemPrompt, userMessage) => {
  if (!available || !llamaModel) throw new Error('Local GGUF model not loaded');

  const { LlamaChatSession } = llamaLib;

  const context = await llamaModel.createContext({ contextSize: env.llamaContextSize });
  try {
    const session = new LlamaChatSession({
      contextSequence: context.getSequence(),
      systemPrompt,
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Local model response timeout')), env.llamaTimeoutMs),
    );

    const answer = await Promise.race([
      session.prompt(userMessage, { temperature: 0.2 }),
      timeoutPromise,
    ]);
    return typeof answer === 'string' ? answer.trim() : '';
  } finally {
    await context.dispose();
  }
};

export const generateLocalStream = async (systemPrompt, userMessage, onChunk) => {
  if (!available || !llamaModel) throw new Error('Local GGUF model not loaded');

  const { LlamaChatSession } = llamaLib;

  const context = await llamaModel.createContext({ contextSize: env.llamaContextSize });
  try {
    const session = new LlamaChatSession({
      contextSequence: context.getSequence(),
      systemPrompt,
    });
    await session.prompt(userMessage, {
      temperature: 0.2,
      onTextChunk: onChunk,
    });
  } finally {
    await context.dispose();
  }
};
