import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { snippet } from '../utils/text.js';
import { isLocalModelAvailable, generateLocal, generateLocalStream } from './localLlm.service.js';

const SYSTEM_PROMPT = `You are PakLaw, an expert AI legal research agent specialising in the Constitution and statutes of Pakistan.

Always follow these rules:
1. GROUNDING: Answer ONLY using the numbered source passages given in the message. Never use outside knowledge or assume facts not in the sources.
2. CITATIONS: After every factual claim, write the citation as [Document — Reference], e.g. [Constitution of Pakistan 1973 — Article 25].
3. MEMORY: The conversation history is included when available. Reference prior exchanges naturally when relevant, e.g. "Building on the equality principle we discussed..."
4. CLARIFICATION: If a question is too vague or ambiguous to answer from the sources, ask one focused clarifying question before giving a full answer.
5. FOLLOW-UPS: End every response with a short section headed exactly "**You might also ask:**" listing 2–3 natural follow-up questions as bullet points.
6. HONESTY: If the sources do not contain the answer, say so explicitly and suggest what area of law to explore.
7. TONE: Concise, neutral, precise. Plain language, short paragraphs or bullet points.
8. DISCLAIMER: Final line of every response: "This is general legal information, not legal advice — please consult a qualified lawyer for your specific situation."
Never invent provisions, section numbers, or punishments not present in the given sources.`;

const buildContext = (passages) =>
  passages.map((p, i) => `[${i + 1}] ${p.document} — ${p.ref}: ${p.title}\n${p.text}`).join('\n\n');

const buildUserMessage = (question, passages, history = []) => {
  const historyBlock = history.length
    ? `[Conversation so far:]\n${history
        .map((m) => `${m.role === 'user' ? 'You' : 'PakLaw'}: ${m.content.slice(0, 500)}`)
        .join('\n')}\n\n`
    : '';

  return (
    `${historyBlock}Question: ${question}\n\nSources:\n${buildContext(passages)}\n\n` +
    `Using only the sources above, write a grounded answer with [Document — Reference] citations. ` +
    `End with "**You might also ask:**" and 2–3 follow-up question bullets.`
  );
};

const buildOllamaMessages = (question, passages, history = []) => {
  const msgs = [{ role: 'system', content: SYSTEM_PROMPT }];
  for (const h of history.slice(-6)) {
    msgs.push({ role: h.role, content: h.content.slice(0, 1000) });
  }
  msgs.push({
    role: 'user',
    content:
      `Question: ${question}\n\nSources:\n${buildContext(passages)}\n\n` +
      `Using only the sources above, write a grounded answer with citations. ` +
      `End with "**You might also ask:**" and 2–3 follow-up question bullets.`,
  });
  return msgs;
};

export const extractiveAnswer = (question, passages) => {
  if (!passages.length) {
    return (
      `I could not find anything in the available legal library that addresses that question. ` +
      `Try rephrasing it, or browse the law library directly.\n\n` +
      `_This is general legal information, not legal advice. Please consult a qualified lawyer for your specific situation._`
    );
  }

  const intro =
    `Here are the most relevant provisions from the legal library for your question. ` +
    `The text below is quoted directly from the source law:`;

  const body = passages
    .map(
      (p, i) =>
        `**${i + 1}. ${p.document} — ${p.ref}: ${p.title}**\n\n> ${snippet(p.text, 600)}`,
    )
    .join('\n\n');

  const outro =
    `_This response quotes the provisions most relevant to your query. ` +
    `It is general legal information, not legal advice — please consult a qualified lawyer for your specific situation._`;

  return `${intro}\n\n${body}\n\n${outro}`;
};

export const isOllamaUp = async () => {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`${env.ollamaUrl}/api/tags`, { signal: controller.signal });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const generateAnswerStream = async (question, passages, history, onToken, onStatus) => {
  if (!passages.length) {
    const fb = extractiveAnswer(question, passages);
    for (const chunk of (fb.match(/.{1,60}/gs) ?? [fb])) {
      onToken(chunk);
      await sleep(15);
    }
    return { usedFallback: true, model: null };
  }

  const userMsg = buildUserMessage(question, passages, history);

  // 1. Local GGUF model (streaming)
  if (isLocalModelAvailable()) {
    try {
      onStatus('Analyzing sources…');
      await generateLocalStream(SYSTEM_PROMPT, userMsg, onToken);
      return { usedFallback: false, model: 'local-llama' };
    } catch (err) {
      logger.warn(`[LLM] Local stream failed: ${err.message}. Trying Ollama…`);
    }
  }

  // 2. Ollama (streaming)
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.ollamaTimeoutMs);
  try {
    onStatus('Generating answer…');
    const res = await fetch(`${env.ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: env.ollamaModel,
        stream: true,
        options: { temperature: 0.2 },
        messages: buildOllamaMessages(question, passages, history),
      }),
    });
    if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);

    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const d = JSON.parse(line);
          const tok = d.message?.content;
          if (tok) onToken(tok);
        } catch {}
      }
    }
    return { usedFallback: false, model: env.ollamaModel };
  } catch (err) {
    logger.warn(`[LLM] Ollama stream failed: ${err.message}. Using extractive fallback.`);
  } finally {
    clearTimeout(timer);
  }

  // 3. Extractive fallback (fake-streamed in chunks)
  onStatus('Quoting directly from legal sources…');
  const fb = extractiveAnswer(question, passages);
  for (const chunk of (fb.match(/.{1,60}/gs) ?? [fb])) {
    onToken(chunk);
    await sleep(15);
  }
  return { usedFallback: true, model: null };
};

export const generateAnswer = async (question, passages) => {
  if (!passages.length) {
    return { answer: extractiveAnswer(question, passages), usedFallback: true, model: null };
  }
  const userMsg = buildUserMessage(question, passages);
  if (isLocalModelAvailable()) {
    try {
      const answer = await generateLocal(SYSTEM_PROMPT, userMsg);
      if (answer) return { answer, usedFallback: false, model: 'local-llama' };
    } catch (err) {
      logger.warn(`[LLM] Local model failed: ${err.message}`);
    }
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.ollamaTimeoutMs);
  try {
    const res = await fetch(`${env.ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: env.ollamaModel,
        stream: false,
        options: { temperature: 0.2 },
        messages: buildOllamaMessages(question, passages),
      }),
    });
    if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
    const data = await res.json();
    const answer = data?.message?.content?.trim();
    if (!answer) throw new Error('Empty response from Ollama');
    return { answer, usedFallback: false, model: env.ollamaModel };
  } catch (err) {
    logger.warn(`[LLM] Ollama failed: ${err.message}`);
    return { answer: extractiveAnswer(question, passages), usedFallback: true, model: null };
  } finally {
    clearTimeout(timer);
  }
};
