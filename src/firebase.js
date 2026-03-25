import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // <-- Importiamo il Database

// La tua configurazione specifica (quella che mi hai incollato)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// 1. Inizializza l'app Firebase
const app = initializeApp(firebaseConfig);

// 2. Inizializza e ESPORTA il Database (così possiamo usarlo nelle altre pagine)
export const db = getFirestore(app);