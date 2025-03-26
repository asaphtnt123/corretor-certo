// Importar funções do Firebase SDK
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; // Se estiver usando Firestore
import { getAuth } from "firebase/auth"; // Se estiver usando autenticação

// Configuração do Firebase para o novo projeto
const firebaseConfig = {
  apiKey: "AIzaSyA-7HOp-Ycvyf3b_03ev__8aJEwAbWSQZY",
  authDomain: "connectfamilia-312dc.firebaseapp.com",
  databaseURL: "https://connectfamilia-312dc-default-rtdb.firebaseio.com",
  projectId: "connectfamilia-312dc",
  storageBucket: "connectfamilia-312dc.appspot.com",
  messagingSenderId: "797817838649",
  appId: "1:797817838649:web:1aa7c54abd97661f8d81e8",
  measurementId: "G-QKN9NFXZZQ"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app); // Inicializar Firestore, se necessário
const auth = getAuth(app); // Inicializar Auth, se necessário

export { app, analytics, db, auth };
