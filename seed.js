require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
async function main() {
  const passwordHash = await bcrypt.hash('ChangeMe123!', 12);
  const doctor = await prisma.user.upsert({ where: { email: 'doctor@medora.local' }, update: {}, create: { name: 'Dr. Demo Doctor', email: 'doctor@medora.local', passwordHash, role: 'DOCTOR', isVerified: true, providerProfile: { create: { qualification: 'MBBS', specialization: 'General Medicine', licenseNumber: 'DEMO-001', isApproved: true } } } });
  const compounder = await prisma.user.upsert({ where: { email: 'compounder@medora.local' }, update: {}, create: { name: 'Demo Compounder', email: 'compounder@medora.local', passwordHash, role: 'COMPOUNDER', isVerified: true, providerProfile: { create: { qualification: 'Pharmacy/Clinical Support', isApproved: true } } } });
  const medicines = [
    ['Paracetamol 500mg', 20, 100, false],
    ['Amoxicillin 500mg', 75, 50, true],
    ['Vitamin D3', 120, 80, false]
  ];
  for (const [name, price, stock, requiresRx] of medicines) await prisma.medicine.upsert({ where: { id: `seed-${name.replace(/[^a-z0-9]/gi,'-').toLowerCase()}` }, update: { price, stock, requiresRx }, create: { id: `seed-${name.replace(/[^a-z0-9]/gi,'-').toLowerCase()}`, name, price, stock, requiresRx } });
  console.log({ doctor: doctor.email, compounder: compounder.email, demoPassword: 'ChangeMe123!' });
}
main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
