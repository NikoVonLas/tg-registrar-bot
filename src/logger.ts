import { config } from './config';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const colors = {
  info: '\x1b[36m',    // Cyan
  warn: '\x1b[33m',    // Yellow
  error: '\x1b[31m',   // Red
  debug: '\x1b[90m',   // Gray
  reset: '\x1b[0m',
};

function log(level: LogLevel, ...args: any[]) {
  const timestamp = new Date().toISOString();
  const color = colors[level];
  const levelStr = level.toUpperCase().padEnd(5);

  console.log(`${color}[${timestamp}] ${levelStr}${colors.reset}`, ...args);
}

export const logger = {
  info: (...args: any[]) => log('info', ...args),
  warn: (...args: any[]) => log('warn', ...args),
  error: (...args: any[]) => log('error', ...args),
  debug: (...args: any[]) => config.debug && log('debug', ...args),
};
