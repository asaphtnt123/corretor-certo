// Importar funções do Firebase corretamente
import { collection, query, where, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA-7HOp-Ycvyf3b_03ev__8aJEwAbWSQZY",
  authDomain: "connectfamilia-312dc.firebaseapp.com",
  projectId: "connectfamilia-312dc",
  storageBucket: "connectfamilia-312dc.appspot.com",
  messagingSenderId: "797817838649",
  appId: "1:797817838649:web:1aa7c54abd97661f8d81e8",
  measurementId: "G-QKN9NFXZZQ"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Ativar persistência da autenticação
setPersistence(auth, browserLocalPersistence)
  .then(() => console.log("Persistência ativada!"))
  .catch((error) => console.error("Erro na persistência:", error));

console.log("Firebase inicializado com sucesso!");

export { app, db, auth, storage };


// Verificação de autenticação
auth.onAuthStateChanged((user) => {
    if (!user) {
        alert("Acesso restrito! Faça login para continuar.");
        window.location.href = "login.html";
    }
});

// Upload de imagens
async function uploadImagens(files, tipo) {
    try {
        const user = auth.currentUser;
        const urls = [];
        
        for (const file of files) {
            const fileName = file.name.replace(/[^\w.]/g, "_");
            const storageRef = storage.ref(`${tipo}/${user.uid}/${fileName}`);
            const snapshot = await storageRef.put(file);
            urls.push(await snapshot.ref.getDownloadURL());
        }
        
        return urls;
    } catch (error) {
        console.error("Erro no upload:", error);
        alert("Erro ao enviar imagens. Tente arquivos menores (até 2MB)");
        return [];
    }
}

// Criar anúncio
async function criarAnuncio(event) {
    event.preventDefault();

    const titulo = document.getElementById("titulo").value.trim();
    const descricao = document.getElementById("descricao").value.trim();
    const preco = document.getElementById("preco").value.trim();
    const tipoAnuncio = document.querySelector('input[name="tipo-anuncio"]:checked')?.value;
    const imagens = document.getElementById("imagens").files;

    if (!titulo || !descricao || !preco || !imagens.length || !tipoAnuncio) {
        alert("Preencha todos os campos obrigatórios!");
        return;
    }

    try {
        const urls = await uploadImagens(imagens, tipoAnuncio);
        if (urls.length === 0) return;

        await db.collection("anuncios").add({
            titulo,
            descricao,
            preco: parseFloat(preco),
            tipo: tipoAnuncio,
            imagens: urls,
            userId: auth.currentUser.uid,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert("Anúncio publicado com sucesso!");
        window.location.href = "meus-anuncios.html";
    } catch (error) {
        console.error("Erro ao publicar:", error);
        alert("Erro: " + error.message);
    }
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("form-anuncio");
    if (form) form.addEventListener("submit", criarAnuncio);
});
