# RentX — Complete Setup Guide

## Project Structure
```
RentX/
├── backend/      ← Node.js API (port 5000)
├── mobile/       ← React Native Android App
└── admin/        ← Web Admin Portal (port 3000)
```

---

## 1. BACKEND SETUP

### Prerequisites
- Node.js 18+
- MongoDB (install from mongodb.com or use MongoDB Atlas free cloud)

### Steps

```bash
cd backend
npm install

# Copy env file and fill in values
copy .env.example .env
```

### Edit backend/.env
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/rentx   # or your Atlas URL
JWT_SECRET=change_this_to_something_random_and_long

# Leave Twilio empty for dev (OTP prints to console)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Sign up free at cloudinary.com
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Run Backend
```bash
npm run dev
# Server starts at http://localhost:5000
# Test: open http://localhost:5000/health
```

### Create Admin User (run once in MongoDB)
```js
// In MongoDB Compass or Atlas, run in rentx database:
db.users.insertOne({
  phone: "+923001234567",   // your phone number
  name: "Admin",
  role: "admin",
  city: "Chiniot",
  isProfileComplete: true,
  isActive: true,
  rating: 5,
  totalRatings: 0,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

---

## 2. MOBILE APP SETUP

### Prerequisites
- Node.js 18+
- JDK 17 (from adoptium.net)
- Android Studio (with SDK, Emulator)
- Set ANDROID_HOME env variable

### Steps

```bash
# Step 1: Create the React Native project
cd mobile
npx react-native@latest init RentXApp --template react-native-template-typescript

# Step 2: Copy all source files from mobile/src/ into RentXApp/src/
# Copy App.tsx, index.js, app.json into RentXApp/

# Step 3: Install dependencies
cd RentXApp
npm install @react-native-async-storage/async-storage @react-native-community/datetimepicker @react-native-community/geolocation @react-navigation/bottom-tabs @react-navigation/native @react-navigation/stack axios react-native-gesture-handler react-native-image-picker react-native-paper react-native-phone-number-input react-native-reanimated react-native-safe-area-context react-native-screens react-native-vector-icons socket.io-client zustand

# Step 4: Link vector icons (add to android/app/build.gradle)
# add: apply from: "../../node_modules/react-native-vector-icons/fonts.gradle"

# Step 5: Update API URL in src/services/api.ts
# For emulator: http://10.0.2.2:5000/api
# For real device: http://YOUR_LOCAL_IP:5000/api  (e.g. 192.168.1.5:5000)

# Step 6: Run
npx react-native run-android
```

### android/app/build.gradle — add at bottom
```gradle
apply from: "../../node_modules/react-native-vector-icons/fonts.gradle"
```

### android/app/src/main/AndroidManifest.xml — add permissions
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
```

---

## 3. ADMIN PORTAL SETUP

### Steps

```bash
cd admin
npm install
npm start
# Opens at http://localhost:3000
# Backend must be running on port 5000 (proxied via package.json proxy)
```

### Login
- Use your admin phone number
- OTP will print in backend console (dev mode)

---

## 4. PAYMENT SETUP (Pakistan)

### MVP (Cash — no integration needed)
- Customers pay driver directly in cash
- Driver pays 15% commission to you monthly

### Online Payments (when ready)
Sign up at these Pakistani services:

| Service | URL | What it supports |
|---------|-----|-----------------|
| PayPro.pk | merchant.paypro.com.pk | All banks + JazzCash + EasyPaisa |
| EasyPaisa | sandbox.easypaisa.com.pk | EasyPaisa wallets |
| JazzCash | sandbox.jazzcash.com.pk | JazzCash wallets |

After getting credentials, add to backend/.env:
```
PAYPRO_USERNAME=your_username
PAYPRO_PASSWORD=your_password
EASYPAISA_STORE_ID=your_store_id
EASYPAISA_HASH_KEY=your_hash_key
JAZZCASH_MERCHANT_ID=your_merchant_id
JAZZCASH_PASSWORD=your_password
JAZZCASH_INTEGRITY_SALT=your_salt
```

---

## 5. HOW YOU COLLECT COMMISSION (as app owner)

### Model A — MVP (Recommended to start)
1. Customers pay driver in cash/EasyPaisa
2. Every week/month, drivers transfer 15% to your JazzCash/bank account
3. Track manually in admin portal

### Model B — Automated (after launch)
1. Integrate PayPro.pk
2. Customer pays app via PayPro checkout
3. App holds money, pays driver 85% via EasyPaisa API after trip completion
4. You automatically keep 15%

---

## 6. PUSH TO PRODUCTION

### Backend
- Deploy on: **Railway.app** (free), **Render.com** (free), or **DigitalOcean** ($6/month)
- Use MongoDB Atlas (free 512MB tier)
- Set NODE_ENV=production in env

### Admin
- Deploy on: **Vercel** (free) or **Netlify** (free)
- Update `proxy` in admin/package.json to production backend URL

### Mobile
- Build release APK: `cd android && ./gradlew assembleRelease`
- Upload to Google Play Store ($25 one-time fee)

---

## Development Checklist

- [ ] Backend running on port 5000
- [ ] MongoDB connected
- [ ] Admin user created in DB
- [ ] Android emulator running
- [ ] Mobile app connects to backend (check IP in api.ts)
- [ ] OTP works (check console in dev mode)
- [ ] Admin portal at localhost:3000
