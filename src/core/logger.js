function shouldLog(level, currentLevel) {
  const order = ['error', 'warn', 'info', 'debug'];
  return order.indexOf(level) <= order.indexOf(currentLevel);
}

export function createLogger(level = process.env.LOG_LEVEL || 'info') {
  const currentLevel = String(level).toLowerCase();

  return {
    error(message, meta) {
      if (shouldLog('error', currentLevel)) {
        console.error(`[error] ${message}`, meta || '');
      }
    },
    warn(message, meta) {
      if (shouldLog('warn', currentLevel)) {
        console.error(`[warn] ${message}`, meta || '');
      }
    },
    info(message, meta) {
      if (shouldLog('info', currentLevel)) {
        console.error(`[info] ${message}`, meta || '');
      }
    },
    debug(message, meta) {
      if (shouldLog('debug', currentLevel)) {
        console.error(`[debug] ${message}`, meta || '');
      }
    },
  };
}
