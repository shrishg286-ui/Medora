require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const prisma = require('./db');

const app = express();
app.set('trust proxy', 1);
app.use(helmet());
const origins = (process.env.FRONTEND_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({ origin: origins.length ? origins : true, credentials: false }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 100 }), require('./routes/auth'));
app.use('/api/providers', require('./routes/providers'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/medicines', require('./routes/medicines'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/reminders', require('./routes/reminders'));

app.get('/api/health', async (req, res) => { await prisma.$queryRaw`SELECT 1`; res.json({ ok: true, service: 'medora-api' }); });
app.use((err, req, res, next) => { console.error(err); if (err.name === 'ZodError') return res.status(400).json({ error: 'Invalid request', details: err.issues }); if (err.code === 'P2002') return res.status(409).json({ error: 'A record with that unique value already exists' }); if (err.code === 'P2025') return res.status(404).json({ error: 'Record not found' }); res.status(500).json({ error: 'Internal server error' }); });

const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`Medora API running on http://localhost:${port}`));
process.on('SIGINT', async () => { await prisma.$disconnect(); process.exit(0); });
process.on('SIGTERM', async () => { await prisma.$disconnect(); process.exit(0); });
