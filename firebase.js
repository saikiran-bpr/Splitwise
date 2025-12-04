// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth,
  getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD51Dm4NTX7lNCuzAaCHoXGz89HKGHhaoY",
  authDomain: "splitwise-app-a6307.firebaseapp.com",
  projectId: "splitwise-app-a6307",
  storageBucket: "splitwise-app-a6307.firebasestorage.app",
  messagingSenderId: "899724300872",
  appId: "1:899724300872:web:0dd5ea5d9220193bddfe7d",
  measurementId: "G-HDBHW4CFBC"
};

const app = initializeApp(firebaseConfig);

// Initialize auth with persistence, fallback to getAuth if already initialized
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error) {
  // Auth already initialized, use getAuth instead
  if (error.code === 'auth/already-initialized') {
    auth = getAuth(app);
  } else {
    console.error("Error initializing Firebase auth:", error);
    auth = getAuth(app);
  }
}

export { auth };
export const db = getFirestore(app);
export default app;
