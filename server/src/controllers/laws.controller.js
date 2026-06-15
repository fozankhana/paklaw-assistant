import { getDocuments, getDocument, getEntry } from '../services/corpus.service.js';

export const listDocuments = (req, res) => {
  res.json({ documents: getDocuments() });
};

export const getOneDocument = (req, res) => {
  const doc = getDocument(req.params.slug);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  return res.json(doc);
};

export const getOneEntry = (req, res) => {
  const entry = getEntry(req.params.slug, req.params.refKey);
  if (!entry) return res.status(404).json({ error: 'Provision not found' });
  return res.json(entry);
};
