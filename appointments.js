const express = require('express');
const { z } = require('zod');
const prisma = require('../db');
const { auth, requireRoles } = require('../middleware/auth');
const router = express.Router();

router.use(auth);
router.post('/', requireRoles('PATIENT'), async (req, res, next) => {
  try {
    const data = z.object({ providerId: z.string(), scheduledAt: z.coerce.date(), address: z.string().min(5), notes: z.string().max(1000).optional() }).parse(req.body);
    if (data.scheduledAt <= new Date()) return res.status(400).json({ error: 'Appointment must be in the future' });
    const provider = await prisma.user.findFirst({ where: { id: data.providerId, role: { in: ['DOCTOR','COMPOUNDER','NURSE'] }, providerProfile: { is: { isApproved: true } } } });
    if (!provider) return res.status(404).json({ error: 'Approved provider not found' });
    const clash = await prisma.appointment.findFirst({ where: { providerId: data.providerId, scheduledAt: data.scheduledAt, status: { in: ['PENDING','CONFIRMED'] } } });
    if (clash) return res.status(409).json({ error: 'Provider is already booked for this time' });
    const appointment = await prisma.appointment.create({ data: { ...data, patientId: req.user.id } });
    res.status(201).json({ appointment });
  } catch (e) { next(e); }
});

router.get('/mine', async (req, res, next) => {
  try {
    const where = req.user.role === 'PATIENT' ? { patientId: req.user.id } : { providerId: req.user.id };
    const appointments = await prisma.appointment.findMany({ where, include: { patient: { select: { id: true, name: true, phone: true } }, provider: { select: { id: true, name: true, role: true } }, }, orderBy: { scheduledAt: 'asc' } });
    res.json({ appointments });
  } catch (e) { next(e); }
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = z.object({ status: z.enum(['CONFIRMED','COMPLETED','CANCELLED']) }).parse(req.body);
    const appt = await prisma.appointment.findUnique({ where: { id: req.params.id } });
    if (!appt || (appt.patientId !== req.user.id && appt.providerId !== req.user.id)) return res.status(404).json({ error: 'Appointment not found' });
    const updated = await prisma.appointment.update({ where: { id: appt.id }, data: { status } });
    res.json({ appointment: updated });
  } catch (e) { next(e); }
});
module.exports = router;
