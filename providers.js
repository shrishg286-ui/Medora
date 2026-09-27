const express = require('express');
const prisma = require('../db');
const { auth, requireRoles } = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const role = req.query.role;
    const providers = await prisma.user.findMany({
      where: { role: role ? role : { in: ['DOCTOR','COMPOUNDER','NURSE','PHARMACY'] }, providerProfile: { is: { isApproved: true } } },
      select: { id: true, name: true, role: true, providerProfile: true }
    });
    res.json({ providers });
  } catch (e) { next(e); }
});

router.patch('/:id/approve', auth, requireRoles('ADMIN'), async (req, res, next) => {
  try {
    const provider = await prisma.providerProfile.update({ where: { userId: req.params.id }, data: { isApproved: true } });
    res.json({ provider });
  } catch (e) { next(e); }
});
module.exports = router;
