import { isProd } from '../config/env.js';
import { logger } from '../utils/logger.js';

export const notFound = (req, res) => {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  if (status >= 500) logger.error(err.stack || err.message);
  res.status(status).json({
    error: err.message || 'Internal server error',
    ...(isProd ? {} : { stack: err.stack }),
  });
};
