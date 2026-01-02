import morgan from 'morgan';

// Custom logger middleware
export const logger = morgan('combined');

// Simple console logger utility
export const log = {
  info: (message) => console.log(`[INFO] ${new Date().toISOString()} - ${message}`),
  error: (message) => console.error(`[ERROR] ${new Date().toISOString()} - ${message}`),
  warn: (message) => console.warn(`[WARN] ${new Date().toISOString()} - ${message}`),
};

