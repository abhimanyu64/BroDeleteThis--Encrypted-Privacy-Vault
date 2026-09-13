const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { STORAGE_PATH, MAX_FILE_SIZE } = require('../config/constants');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, STORAGE_PATH);
  },
  filename: (req, file, cb) => {
    // Generate an unguessable UUID for the stored payload
    const fileId = uuidv4();
    cb(null, `${fileId}.cypher`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE }
});

module.exports = upload;