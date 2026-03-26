import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { 
  getAuth, 
  GoogleAuthProvider, 
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";

// Firebase App Configuration (provided by user)
const firebaseConfig = {
  apiKey: "AIzaSyBf-giIprn6bRSMudRoyEkKUvafG_JUNgs",
  authDomain: "campusconnect-4caa9.firebaseapp.com",
  projectId: "campusconnect-4caa9",
  storageBucket: "campusconnect-4caa9.firebasestorage.app",
  messagingSenderId: "457816331886",
  appId: "1:457816331886:web:a6d35afa85fc3d3e01b87f",
  measurementId: "G-8JHMVWV5PC"
};

const isConfigured = firebaseConfig.apiKey !== "PASTE_API_KEY_HERE";

let app, db, auth, googleProvider;

if (isConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
  } catch (e) {
    console.error("Firebase init failed:", e);
  }
}

export { 
  db, 
  auth, 
  googleProvider, 
  isConfigured,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
};
