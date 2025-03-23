import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "realchat-4f9b4.firebaseapp.com",
  projectId: "realchat-4f9b4",
  storageBucket: "realchat-4f9b4.appspot.com", // Fixed typo: `.app` -> `.com`
  messagingSenderId: "1012935061188",
  appId: "1:1012935061188:web:2f59129c1a17420ff6e391",
};

const app = initializeApp(firebaseConfig);
 
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
