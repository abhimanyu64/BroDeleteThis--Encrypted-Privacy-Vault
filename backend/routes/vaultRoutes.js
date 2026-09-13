const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { uploadEncryptedFile, fetchEncryptedFile } = require('../controllers/vaultController');

// POST /api/vault/upload
router.post('/upload', uploadLimiter, upload.single('encryptedPayload'), uploadEncryptedFile);

// GET /api/vault/fetch/:fileId
router.get('/fetch/:fileId', fetchEncryptedFile);

module.exports = router;