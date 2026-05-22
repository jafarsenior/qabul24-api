# Qabul24 Backend

Qabul24 tibbiy qabul tizimining backend qismi.

## Texnologiyalar

- Node.js
- Express
- MongoDB
- Mongoose

## Ishga Tushirish

1. Paketlarni o'rnatish:

```bash
npm install
```

2. `.env` fayl yarating:

```bash
PORT=4000
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster.mongodb.net/qabul24
JWT_SECRET=change-this-secret
DEFAULT_DOCTOR_PASSWORD=doctor123
```

3. Serverni ishga tushiring:

```bash
npm start
```

Backend URL:

```bash
http://localhost:4000/api
```

## Admin Yaratish

```bash
npm run admin:create -- admin@qabul24.uz admin123 "Admin User" "+998901234567"
```

## Deploy

Backend hosting uchun:

- Root directory: `server` papkaning o'zi
- Build command: bo'sh qoldiriladi
- Start command: `npm start`
- Environment variables: `.env.example` dagi qiymatlar
