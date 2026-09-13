import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;
const STORAGE_DIR = path.resolve(process.env.STORAGE_DIR || 'vault_storage');
const MAX_FILE_SIZE = (Number(process.env.MAX_FILE_SIZE_MB) || 500) * 1024 * 1024;
const FILE_TTL_MS = (Number(process.env.FILE_TTL_HOURS) || 24) * 60 * 60 * 1000;
const CLEANUP_INTERVAL = (Number(process.env.CLEANUP_INTERVAL_MINUTES) || 15) * 60 * 1000;

if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

// 1. HTTP Security Headers via Helmet with customized CSP for CDNs
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.tailwindcss.com",
          "https://cdnjs.cloudflare.com",
          "https://unpkg.com"
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com"
        ],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'", `http://localhost:${PORT}`]
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

// 2. Strict CORS Configuration
const allowedOrigin = process.env.FRONTEND_ORIGIN || '*';
app.use(cors({
  origin: allowedOrigin === '*' ? true : allowedOrigin,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// 3. Rate Limiters (Anti-DDoS & Anti-Abuse)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});
app.use(globalLimiter);

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // max 30 uploads per hour per IP
  message: { error: 'Upload limit reached for this IP. Please try again in an hour.' }
});

// 4. Resolve and Serve Static Frontend
const publicDir = path.join(__dirname, '..', 'frontend');

if (!fs.existsSync(path.join(publicDir, 'index.html'))) {
  console.error(`[Frontend] index.html not found at: ${publicDir}`);
}

app.use(express.static(publicDir));
// 5. Multer Storage with File Whitelisting
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, STORAGE_DIR),
  filename: (req, file, cb) => {
    // Cryptographically secure pseudorandom file identifier
    const fileId = crypto.randomBytes(8).toString('hex');
    cb(null, `${fileId}.cypher`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    // Only permit client-side cipher binaries
    if (file.mimetype === 'application/octet-stream' || file.originalname.endsWith('.cypher')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid payload type. Only .cypher blobs permitted.'));
    }
  }
});

// 6. Routes with Strict Input Sanitization
app.post('/api/upload', uploadLimiter, upload.single('vault'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No payload uploaded.' });

  const fileId = path.parse(req.file.filename).name;
  res.json({
    success: true,
    fileId: fileId,
    expiresInHours: Number(process.env.FILE_TTL_HOURS) || 24
  });
});

// Enforce strict 16-hex regex matching on :fileId to prevent path traversal
app.get('/api/vault/:fileId', (req, res) => {
  const fileId = req.params.fileId;

  if (!/^[a-f0-9]{16}$/i.test(fileId)) {
    return res.status(400).json({ error: 'Malformed file identifier.' });
  }

  const safePath = path.join(STORAGE_DIR, `${fileId}.cypher`);

  if (!fs.existsSync(safePath)) {
    return res.status(404).json({ error: 'Vault file missing or expired.' });
  }

  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${fileId}.cypher"`);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  fs.createReadStream(safePath).pipe(res);
});

app.get('/', (req, res) => {
  const indexPath = path.join(publicDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Could not find index.html');
  }
});

// 7. Expired Storage Cleanup
setInterval(() => {
  const now = Date.now();
  fs.readdir(STORAGE_DIR, (err, files) => {
    if (err) return;
    files.forEach((file) => {
      const fullPath = path.join(STORAGE_DIR, file);
      fs.stat(fullPath, (err, stats) => {
        if (err) return;
        if (now - stats.mtimeMs > FILE_TTL_MS) {
          fs.unlink(fullPath, () => {});
        }
      });
    });
  });
}, CLEANUP_INTERVAL);

// 8. Global Error Handler (Prevents server crashing & leaking stack traces)
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    error: err.message || 'Internal security barrier triggered.'
  });
});

app.listen(PORT, () => {
  console.log(`[CookedDrive Secure API] listening on http://localhost:${PORT}`);
  console.log(`[Security] Helmet CSP, IP Throttling, and Path Sanitization active.`);
});