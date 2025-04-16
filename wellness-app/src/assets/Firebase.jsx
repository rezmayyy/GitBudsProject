import firebase from 'firebase/app';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore, setLogLevel } from "firebase/firestore"; // ← here
import { getStorage } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyCldsk9RttWXIFqsZs22_H2Z2Q3MTp4kbI",
  authDomain: "tribewell-d4492.firebaseapp.com",
  projectId: "tribewell-d4492",
  storageBucket: "tribewell-d4492.appspot.com",
  messagingSenderId: "151259052481",
  appId: "1:151259052481:web:69b05a7c36937ac0759740",
  measurementId: "G-ZJNNSH2L66"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
setLogLevel("error");

export const storage = getStorage(app);
export const functions = getFunctions(app);

if (process.env.REACT_APP_USE_EMULATOR === "true") {
  connectFunctionsEmulator(functions, "localhost", 5001);
}

export default app;
