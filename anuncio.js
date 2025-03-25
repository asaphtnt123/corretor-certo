// Firebase v8 - Código 100% funcional
const firebaseConfig = {
    apiKey: "AIzaSyCNr5JoKsWJVeUYAaVDqmPznZo100v0uvg",
    authDomain: "corretorcerto-76933.firebaseapp.com",
    projectId: "corretorcerto-76933",
    storageBucket: "corretorcerto-76933.appspot.com",
    messagingSenderId: "357149829474",
    appId: "1:357149829474:web:324b2005d82eabbce5e43b"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

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
