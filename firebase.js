// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAfY4UhLsg72pQd__-o7IkGxLiF0lWz9A0",
  authDomain: "rawafid-2a83e.firebaseapp.com",
  projectId: "rawafid-2a83e",
  storageBucket: "rawafid-2a83e.firebasestorage.app",
  messagingSenderId: "744601245973",
  appId: "1:744601245973:web:b761fa17b2ea1bfb80711c",
  measurementId: "G-RPYCCF3463",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
