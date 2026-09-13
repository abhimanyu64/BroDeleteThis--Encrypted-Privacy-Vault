const path = require('path');
require('dotenv').config();

const STORAGE_PATH = path.resolve(__dirname, '..', process.env.STORAGE_DIR || 'vault_storage');
const FILE_TTL_MS = (parseInt(process.env.FILE_TTL_HOURS, 10) || 24) * 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = (parseInt(process.env.CLEANUP_INTERVAL_MINUTES, 10) || 15) * 60 * 1000;
const MAX_FILE_SIZE = (parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 500) * 1024 * 1024;
const PORT = process.env.PORT || 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '*';

module.exports = {
  STORAGE_PATH,
  FILE_TTL_MS,
  CLEANUP_INTERVAL_MS,
  MAX_FILE_SIZE,
  PORT,
  FRONTEND_ORIGIN
};