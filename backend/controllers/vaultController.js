const fs = require('fs');
const path = require('path');
const { STORAGE_PATH } = require('../config/constants');

// UUID validation regex (v4)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Handle Encrypted Payload Upload
 */
const uploadEncryptedFile = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No encrypted payload received.' });
    }

    // Extract UUID from the generated filename
    const fileId = path.parse(req.file.filename).name;

    return res.status(201).json({
      success: true,
      fileId,
      expiresIn: '24 Hours'
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to process file upload.' });
  }
};

/**
 * Handle Payload Retrieval & Streaming
 */
const fetchEncryptedFile = (req, res) => {
  try {
    const { fileId } = req.params;

    if (!fileId || !UUID_REGEX.test(fileId)) {
      return res.status(400).json({ error: 'Invalid or malformed File ID.' });
    }

    const targetPath = path.join(STORAGE_PATH, `${fileId}.cypher`);

    if (!fs.existsSync(targetPath)) {
      return res.status(404).json({ error: 'File not found or expired.' });
    }

    // Set binary stream headers
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileId}.cypher"`);

    const readStream = fs.createReadStream(targetPath);
    readStream.on('error', () => {
      res.status(500).end();
    });

    readStream.pipe(res);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to stream payload.' });
  }
};

module.exports = {
  uploadEncryptedFile,
  fetchEncryptedFile
};