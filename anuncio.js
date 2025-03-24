import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-storage.js";

// Inicializando Firebase
const auth = getAuth();
const db = getFirestore();
const storage = getStorage();

// Garante que o usuário esteja autenticado antes de criar anúncios
onAuthStateChanged(auth, (user) => {
    if (!user) {
        alert("Você precisa estar logado para criar um anúncio!");
        window.location.href = "login.html";
    }
});

// Função para fazer upload das imagens para o Firebase Storage
async function uploadImagens(imagens, tipo) {
    const urls = [];
    const user = auth.currentUser;
    
    if (!user) {
        alert("Usuário não autenticado!");
        return [];
    }

    for (let i = 0; i < imagens.length; i++) {
        let file = imagens[i];
        let fileName = file.name.replace(/[^a-zA-Z0-9.]/g, "_"); // Remove caracteres especiais
        const storageRef = ref(storage, `${tipo}/${user.uid}/${fileName}`);

        try {
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            urls.push(downloadURL);
        } catch (error) {
            console.error("Erro ao fazer upload da imagem:", error);
            alert("Erro ao enviar imagem. Tente novamente.");
        }
    }

    return urls;
}

// Função para criar um novo anúncio
async function criarAnuncio(event) {
    event.preventDefault();

    const titulo = document.getElementById("titulo").value;
    const descricao = document.getElementById("descricao").value;
    const preco = document.getElementById("preco").value;
    const tipoAnuncio = document.querySelector('input[name="tipo-anuncio"]:checked').value;
    const imagens = document.getElementById("imagens").files;

    if (!titulo || !descricao || !preco || imagens.length === 0) {
        alert("Preencha todos os campos e envie pelo menos uma imagem.");
        return;
    }

    try {
        const imagensURLs = await uploadImagens(imagens, tipoAnuncio);
        const user = auth.currentUser;

        await addDoc(collection(db, "anuncios"), {
            titulo,
            descricao,
            preco,
            tipo: tipoAnuncio,
            imagens: imagensURLs,
            userId: user.uid,
            dataPublicacao: new Date()
        });

        alert("Anúncio criado com sucesso!");
        window.location.href = "meus-anuncios.html";
    } catch (error) {
        console.error("Erro ao criar anúncio:", error);
        alert("Erro ao criar anúncio. Tente novamente.");
    }
}

// Adiciona evento ao formulário de criação de anúncios
document.addEventListener("DOMContentLoaded", () => {
    const formAnuncio = document.getElementById("form-anuncio");

    if (formAnuncio) {
        formAnuncio.addEventListener("submit", criarAnuncio);
    } else {
        console.warn("Formulário de anúncio não encontrado.");
    }
});
