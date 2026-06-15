const stamp = () => new Date().toISOString();

const write = (level, args) => {
  // eslint-disable-next-line no-console
  console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
    `${stamp()} [${level.toUpperCase()}]`,
    ...args,
  );
};

export const logger = {
  info: (...args) => write('info', args),
  warn: (...args) => write('warn', args),
  error: (...args) => write('error', args),
  success: (...args) => write('info', ['✓', ...args]),
};
