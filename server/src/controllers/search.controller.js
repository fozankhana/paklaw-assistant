import { search } from '../services/retrieval.service.js';
import { snippet } from '../utils/text.js';

export const searchCorpus = async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) return res.json({ query: '', results: [] });

    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const results = await search(q, limit);

    return res.json({
      query: q,
      results: results.map((r) => ({
        document: r.chunk.document,
        documentSlug: r.chunk.documentSlug,
        ref: r.chunk.ref,
        refKey: r.chunk.refKey,
        title: r.chunk.title,
        group: r.chunk.group,
        snippet: snippet(r.chunk.text, 260),
        score: Number(r.score.toFixed(4)),
      })),
    });
  } catch (err) {
    return next(err);
  }
};
