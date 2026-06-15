import { Router } from 'express';
import { ask, chatSchema } from '../controllers/chat.controller.js';
import {
  listDocuments,
  getOneDocument,
  getOneEntry,
} from '../controllers/laws.controller.js';
import { searchCorpus } from '../controllers/search.controller.js';
import { health } from '../controllers/health.controller.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

router.get('/health', health);

router.post('/chat', validateBody(chatSchema), ask);

router.get('/laws', listDocuments);
router.get('/laws/:slug', getOneDocument);
router.get('/laws/:slug/:refKey', getOneEntry);

router.get('/search', searchCorpus);

export default router;
