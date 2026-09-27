# Medora Backend

A Node.js + Express + PostgreSQL + Prisma backend for the Medora healthcare MVP.

## 1. Requirements
- Node.js 20+
- Docker Desktop (recommended for local PostgreSQL)

## 2. Install
```bash
cd medora-backend
npm install
cp .env.example .env
```
Edit `.env` and replace `JWT_SECRET` with a long random value.

## 3. Start PostgreSQL
```bash
docker compose up -d postgres
```

## 4. Create the database schema
```bash
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
```

## 5. Run the API
```bash
npm run dev
```
Health check: `GET http://localhost:4000/api/health`

Seed provider accounts (development only):
- doctor@medora.local / ChangeMe123!
- compounder@medora.local / ChangeMe123!

Change/delete these credentials before any shared deployment.

## API overview

### Auth
- `POST /api/auth/register` — patient, doctor, compounder, nurse, pharmacy
- `POST /api/auth/login`
- `GET /api/auth/me` — Bearer token

### Providers
- `GET /api/providers?role=DOCTOR`
- `PATCH /api/providers/:id/approve` — admin only

### Home visits
- `POST /api/appointments` — patient
- `GET /api/appointments/mine`
- `PATCH /api/appointments/:id/status`

### Medicines/orders
- `GET /api/medicines?q=paracetamol`
- `POST /api/medicines` — pharmacy/admin
- `POST /api/orders` — patient
- `GET /api/orders/mine`
- `PATCH /api/orders/:id/status` — pharmacy/admin

### Reports
- `POST /api/reports` multipart/form-data with `file`, `type`, `title`
- `GET /api/reports`
- `GET /api/reports/:id/download`

### Reminders
- `GET /api/reminders`
- `POST /api/reminders`
- `PATCH /api/reminders/:id`
- `DELETE /api/reminders/:id`

## Connecting the existing Medora frontend

Your current HTML can call this API using `fetch`. Example login:

```js
const response = await fetch('http://localhost:4000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const data = await response.json();
localStorage.setItem('medoraToken', data.token);
```

Authenticated requests:

```js
fetch('http://localhost:4000/api/appointments/mine', {
  headers: { Authorization: `Bearer ${localStorage.getItem('medoraToken')}` }
});
```

## Production checklist
This project is an MVP foundation, not a production medical-record system. Before handling real patient data, add:
- HTTPS everywhere and secure secret management
- Managed object storage for reports with private access URLs
- Virus/malware scanning and content validation for uploads
- Audit logs for access to medical records
- Strong provider identity/license verification and admin workflows
- Email/SMS/WhatsApp verification and appointment notifications
- Refresh-token/session strategy and account recovery
- Payment gateway + webhook verification
- Database backups, encryption at rest, monitoring and incident response
- Rate limits and abuse protection on every sensitive endpoint
- Legal/privacy/compliance review for every jurisdiction in which Medora operates
- Pharmacy/prescription rules and clinical workflows appropriate to local law

Do not store production medical files in the local `uploads/` directory.
