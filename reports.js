const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { z } = require('zod');
const crypto = require('crypto');
const prisma = require('../db');
const { auth } = require('../middleware/auth');
const router = express.Router();
const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ dest: uploadDir, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: (req, file, cb) => { const allowed = ['application/pdf','image/jpeg','image/png']; cb(null, allowed.includes(file.mimetype)); } });
router.use(auth);

router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'PDF, JPG, or PNG file is required' });
    const data = z.object({ type: z.enum(['PRESCRIPTION','LAB','IMAGING','OTHER']).default('OTHER'), title: z.string().min(2).max(200) }).parse(req.body);
    const safeName = `${crypto.randomUUID()}${path.extname(req.file.originalname).toLowerCase()}`;
    const finalPath = path.join(uploadDir, safeName);
    fs.renameSync(req.file.path, finalPath);
    const report = await prisma.report.create({ data: { patientId: req.user.id, type: data.type, title: data.title, fileName: req.file.originalname, storageKey: safeName, mimeType: req.file.mimetype } });
    res.status(201).json({ report });
  } catch (e) { if (req.file) { try { fs.unlinkSync(req.file.path); } catch {} } next(e); }
});

router.get('/', async (req, res, next) => { try { res.json({ reports: await prisma.report.findMany({ where: { patientId: req.user.id }, orderBy: { createdAt: 'desc' } }) }); } catch (e) { next(e); } });

router.get('/:id/download', async (req, res, next) => {
  try { const report = await prisma.report.findFirst({ where: { id: req.params.id, patientId: req.user.id } }); if (!report) return res.status(404).json({ error: 'Report not found' }); const filePath = path.join(uploadDir, report.storageKey); if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File missing from storage' }); res.type(report.mimeType).download(filePath, report.fileName); }
  catch (e) { next(e); }
});
module.exports = router;
