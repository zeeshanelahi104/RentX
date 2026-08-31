# RentX

RentX is a full-stack vehicle rental platform connecting riders and drivers. Riders can browse available vehicles, book rentals, chat with drivers in real time, and rate their experience. Drivers can list vehicles, manage bookings, and track earnings.

Built with **React Native (Expo)** for the mobile app, **Node.js / Express / MongoDB** for the backend, and a **React** web admin portal — with **Socket.IO** for real-time chat, **Firebase** for push notifications, **Twilio** for phone/OTP verification, and **Google Sign-In** for authentication.

## Project structure

```
RentX/
├── backend/   Node.js / Express / MongoDB API
├── mobile/    React Native (Expo) app for riders and drivers
└── admin/     React web admin portal
```

## Getting started

Each folder has its own dependencies and `.env` configuration. See [SETUP.md](SETUP.md) for the full setup and deployment guide.

### Backend

```bash
cd backend
npm install
copy .env.example .env   # fill in MongoDB, JWT, Twilio, Cloudinary, Firebase, Google values
npm run dev
```

### Mobile

```bash
cd mobile
npm install
npx expo start
```

### Admin portal

```bash
cd admin
npm install
npm start
```

## Tech stack

- **Mobile**: React Native, Expo, React Navigation, Zustand, React Native Paper
- **Backend**: Node.js, Express, MongoDB (Mongoose), Socket.IO, JWT auth
- **Admin**: React, React Query, React Router, Chart.js
- **Integrations**: Firebase (push notifications), Twilio (OTP), Cloudinary (image uploads), Google Sign-In
