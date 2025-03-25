// Substitua TODOS os imports modulares (v11) por estas CDNs no HTML:
<!-- No arquivo anunciar.html -->
<script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-auth.js"></script>
<script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js"></script>
<script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-storage.js"></script>

// Código atualizado (anuncio.js):
// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCNr5JoKsWJVeUYAaVDqmPznZo100v0uvg",
    authDomain: "corretorcerto-76933.firebaseapp.com",
    projectId: "corretorcerto-76933",
    storageBucket: "corretorcerto-76933.appspot.com",
    messagingSenderId: "357149829474",
    appId: "1:357149829474:web:324b2005d82eabbce5e43b"
};

// Inicialização do Firebase v8
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Verificação de autenticação
auth.onAuthStateChanged((user) => {
    if (!user) {
        alert("Você precisa estar logado para criar anúncios!");
        window.location.href = "login.html";
    }
});

// Upload de imagens (v8)
async function uploadImagens(imagens, tipo) {
    const user = auth.currentUser;
    if (!user) {
        alert("Usuário não autenticado!");
        return [];
    }

    const urls = [];
    for (const file of imagens) {
        try {
            const fileName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
            const storageRef = storage.ref(`${tipo}/${user.uid}/${fileName}`);
            const snapshot = await storageRef.put(file);
            const url = await snapshot.ref.getDownloadURL();
            urls.push(url);
        } catch (error) {
            console.error("Erro no upload:", error);
            alert("Erro na imagem " + file.name + ": " + error.message);
        }
    }
    return urls;
}

// Função principal de criação de anúncio
async function criarAnuncio(event) {
    event.preventDefault();

    // Obtenção dos valores
    const titulo = document.getElementById("titulo").value.trim();
    const descricao = document.getElementById("descricao").value.trim();
    const preco = parseFloat(document.getElementById("preco").value);
    const tipoAnuncio = document.querySelector('input[name="tipo-anuncio"]:checked')?.value;
    const imagens = document.getElementById("imagens").files;

    // Validações
    if (!titulo || !descricao || isNaN(preco) || !imagens.length || !tipoAnuncio) {
        alert("Preencha todos os campos corretamente e selecione pelo menos 1 imagem!");
        return;
    }

    try {
        const imagensURLs = await uploadImagens(imagens, tipoAnuncio);
        if (!imagensURLs.length) return;

        // Salvar no Firestore
        await db.collection("anuncios").add({
            titulo,
            descricao,
            preco,
            tipo: tipoAnuncio,
            imagens: imagensURLs,
            userId: auth.currentUser.uid,
            dataPublicacao: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert("Anúncio criado com sucesso!");
        window.location.href = "meus-anuncios.html";
    } catch (error) {
        console.error("Erro fatal:", error);
        alert("Erro: " + error.message);
    }
}

// Event Listener
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("form-anuncio");
    form?.addEventListener("submit", criarAnuncio);
});
