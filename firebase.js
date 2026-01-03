import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBdMEz6ZQRcbiocqwRbZ7zFgv9xjTJ3d90",
  authDomain: "kasem-garments-inventory-8de0d.firebaseapp.com",
  projectId: "kasem-garments-inventory-8de0d",
  storageBucket: "kasem-garments-inventory-8de0d.firebasestorage.app",
  messagingSenderId: "346608007928",
  appId: "1:346608007928:web:61462f71837540980e190d",
  measurementId: "G-5S884M966T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
export const db = getFirestore(app);
export default app;
