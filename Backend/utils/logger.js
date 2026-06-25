const config = require('config');

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

const getConfig = () => {
  try {
    return config.get('logging');
  } catch {
    return {};
  }
};

const getLevel = () => {
  const cfg = getConfig();
  const envLevel = process.env.LOG_LEVEL;
  const configured = envLevel || cfg.level || 'info';
  return LEVELS[configured] !== undefined ? configured : 'info';
};

const shouldLog = (level) => LEVELS[level] <= LEVELS[getLevel()];

const formatDev = (level, message, meta) => {
  const time = new Date().toISOString();
  const metaText = meta && Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `[${time}] [${level.toUpperCase()}] ${message}${metaText}`;
};

const write = (level, message, meta = {}) => {
  if (!shouldLog(level)) {
    return;
  }

  const cfg = getConfig();
  const useJson = cfg.format === 'json' || process.env.LOG_FORMAT === 'json';

  if (useJson) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        message,
        ...meta,
      })
    );
    return;
  }

  const line = formatDev(level, message, meta);
  if (level === 'error') {
    console.error(line);
    return;
  }

  if (level === 'warn') {
    console.warn(line);
    return;
  }

  console.log(line);
};

const logger = {
  error: (message, meta) => write('error', message, meta),
  warn: (message, meta) => write('warn', message, meta),
  info: (message, meta) => write('info', message, meta),
  debug: (message, meta) => write('debug', message, meta),
};

module.exports = logger;
