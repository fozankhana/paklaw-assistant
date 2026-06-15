import { z } from 'zod';
import { env } from '../config/env.js';
import { search } from '../services/retrieval.service.js';
import { generateAnswerStream } from '../services/llm.service.js';
import { snippet } from '../utils/text.js';

export const chatSchema = z.object({
  question: z
    .string({ required_error: 'A question is required' })
    .trim()
    .min(3, 'Please ask a longer question (at least 3 characters)')
    .max(1000, 'Question is too long (max 1000 characters)'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(2000),
      }),
    )
    .max(10)
    .optional()
    .default([]),
});

export const ask = async (req, res) => {
  const { question, history } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const send = (data) => {
    if (res.writableEnded) return;
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    if (typeof res.flush === 'function') res.flush();
  };

  try {
    send({ type: 'status', text: 'Searching the legal library…' });

    const results = await search(question, env.retrievalTopK);
    const passages = results.map((r) => r.chunk);

    const { usedFallback, model } = await generateAnswerStream(
      question,
      passages,
      history,
      (token) => send({ type: 'token', content: token }),
      (text) => send({ type: 'status', text }),
    );

    const sources = results.map((r) => ({
      document: r.chunk.document,
      documentSlug: r.chunk.documentSlug,
      ref: r.chunk.ref,
      refKey: r.chunk.refKey,
      title: r.chunk.title,
      snippet: snippet(r.chunk.text, 220),
      score: Number(r.score.toFixed(4)),
      exactRef: r.exactRef,
    }));

    const citations = sources.map(({ document, documentSlug, ref, refKey, title }) => ({
      document,
      documentSlug,
      ref,
      refKey,
      title,
    }));

    send({ type: 'done', citations, sources, usedFallback, model });
  } catch (err) {
    send({ type: 'error', message: err.message || 'An unexpected error occurred.' });
  } finally {
    if (!res.writableEnded) res.end();
  }
};
