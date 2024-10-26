// Import the functions you need from the SDKs you need
import firebase from 'firebase/app';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {

    apiKey: "AIzaSyCldsk9RttWXIFqsZs22_H2Z2Q3MTp4kbI",
  
    authDomain: "tribewell-d4492.firebaseapp.com",
  
    projectId: "tribewell-d4492",
  
    storageBucket: "tribewell-d4492.appspot.com",
  
    messagingSenderId: "151259052481",
  
    appId: "1:151259052481:web:69b05a7c36937ac0759740",
  
    measurementId: "G-ZJNNSH2L66"
  
  };
  

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app)
export const db = getFirestore(app); 

export default app
