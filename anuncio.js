import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-storage.js";

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCNr5JoKsWJVeUYAaVDqmPznZo100v0uvg",
    authDomain: "corretorcerto-76933.firebaseapp.com",
    projectId: "corretorcerto-76933",
    storageBucket: "corretorcerto-76933.appspot.com",
    messagingSenderId: "357149829474",
    appId: "1:357149829474:web:324b2005d82eabbce5e43b"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Verifica autenticação
onAuthStateChanged(auth, (user) => {
    if (!user) {
        alert("Você precisa estar logado para criar anúncios!");
        window.location.href = "login.html";
    }
});

// Upload paralelo de imagens
async function uploadImagens(imagens, tipo) {
    const user = auth.currentUser;
    if (!user) {
        alert("Usuário não autenticado!");
        return [];
    }

    try {
        const uploadPromises = Array.from(imagens).map(async (file) => {
            const fileName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
            const storageRef = ref(storage, `${tipo}/${user.uid}/${fileName}`);
            const snapshot = await uploadBytes(storageRef, file);
            return getDownloadURL(snapshot.ref);
        });

        return await Promise.all(uploadPromises);
    } catch (error) {
        console.error("Erro no upload:", error);
        alert("Falha ao enviar imagens. Verifique o formato e tamanho (máx. 5MB)");
        return [];
    }
}

// Validação de formulário
function validarFormulario(titulo, descricao, preco, imagens) {
    if (!titulo || !descricao || !preco || !imagens.length) {
        alert("Preencha todos os campos e selecione ao menos uma imagem!");
        return false;
    }

    if (imagens.length > 5) {
        alert("Máximo de 5 imagens permitidas!");
        return false;
    }

    if (isNaN(parseFloat(preco))) {
        alert("Preço inválido! Use números (ex: 250000)");
        return false;
    }

    return true;
}

// Criação de anúncio
async function criarAnuncio(event) {
    event.preventDefault();

    const titulo = document.getElementById("titulo").value.trim();
    const descricao = document.getElementById("descricao").value.trim();
    const preco = document.getElementById("preco").value.trim();
    const tipoAnuncio = document.querySelector('input[name="tipo-anuncio"]:checked')?.value;
    const imagens = document.getElementById("imagens").files;

    if (!validarFormulario(titulo, descricao, preco, imagens) || !tipoAnuncio) return;

    try {
        const imagensURLs = await uploadImagens(imagens, tipoAnuncio);
        if (imagensURLs.length === 0) return;

        await addDoc(collection(db, "anuncios"), {
            titulo,
            descricao,
            preco: parseFloat(preco),
            tipo: tipoAnuncio,
            imagens: imagensURLs,
            userId: auth.currentUser.uid,
            dataPublicacao: new Date()
        });

        document.getElementById("form-anuncio").reset();
        alert("Anúncio publicado com sucesso!");
        window.location.href = "meus-anuncios.html";
    } catch (error) {
        console.error("Erro crítico:", error);
        alert(`Erro: ${error.message || "Tente novamente mais tarde"}`);
    }
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("form-anuncio");
    if (form) form.addEventListener("submit", criarAnuncio);
});
