// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAPq4kLpJK-M_nJYL-n1eld-PDGagKOw4U",
  authDomain: "rentx-ef9d0.firebaseapp.com",
  projectId: "rentx-ef9d0",
  storageBucket: "rentx-ef9d0.firebasestorage.app",
  messagingSenderId: "145461526346",
  appId: "1:145461526346:web:bc3806199740a973f2cbb3",
  measurementId: "G-0YF7H78GEF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);