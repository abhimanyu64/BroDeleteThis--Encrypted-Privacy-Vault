const fs = require('fs');
const path = require('path');
const { STORAGE_PATH, FILE_TTL_MS, CLEANUP_INTERVAL_MS } = require('../config/constants');

function purgeExpiredFiles() {
  fs.readdir(STORAGE_PATH, (err, files) => {
    if (err) {
      console.error('[CLEANER ERROR] Unable to scan storage directory:', err.message);
      return;
    }

    const now = Date.now();
    let purgedCount = 0;

    files.forEach((file) => {
      if (!file.endsWith('.cypher')) return;

      const filePath = path.join(STORAGE_PATH, file);
      fs.stat(filePath, (statErr, stats) => {
        if (statErr) return;

        if (now - stats.mtimeMs > FILE_TTL_MS) {
          fs.unlink(filePath, (unlinkErr) => {
            if (!unlinkErr) {
              purgedCount++;
            }
          });
        }
      });
    });

    if (purgedCount > 0) {
      console.log(`[CLEANER] Auto-purged ${purgedCount} expired vault payload(s).`);
    }
  });
}

function startCleanupTask() {
  // Run on startup, then at defined interval
  purgeExpiredFiles();
  setInterval(purgeExpiredFiles, CLEANUP_INTERVAL_MS);
  console.log('[CLEANER] Automated TTL purge daemon initialized.');
}

module.exports = { startCleanupTask };