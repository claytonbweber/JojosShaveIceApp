import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBpkq5DgX3elAU1aBLAYbyUZJ6gF8_pcvE",
  authDomain: "jojo-s-management-app.firebaseapp.com",
  projectId: "jojo-s-management-app",
  storageBucket: "jojo-s-management-app.firebasestorage.app",
  messagingSenderId: "1057424025658",
  appId: "1:1057424025658:web:954b5ad6109119b4136d03",
  measurementId: "G-2SHLDTH3NB"
};

// In your Firebase config file
try {
  // Initialize Firebase
  if (!getApps().length) {
    initializeApp(firebaseConfig);
  }
} catch (error) {
  console.log("Firebase initialization error:", error);
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app)