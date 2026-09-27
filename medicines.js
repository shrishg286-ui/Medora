const express = require('express');
const { z } = require('zod');
const prisma = require('../db');
const { auth, requireRoles } = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const q = String(req.query.q || '');
    const medicines = await prisma.medicine.findMany({ where: { active: true, name: { contains: q, mode: 'insensitive' } }, orderBy: { name: 'asc' } });
    res.json({ medicines });
  } catch (e) { next(e); }
});

router.post('/', auth, requireRoles('PHARMACY','ADMIN'), async (req, res, next) => {
  try {
    const data = z.object({ name: z.string().min(2), description: z.string().optional(), price: z.number().int().positive(), stock: z.number().int().nonnegative().default(0), requiresRx: z.boolean().default(false) }).parse(req.body);
    const medicine = await prisma.medicine.create({ data });
    res.status(201).json({ medicine });
  } catch (e) { next(e); }
});
module.exports = router;
