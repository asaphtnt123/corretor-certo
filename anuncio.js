// Importações atualizadas
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence,
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

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

// Verificação de autenticação
onAuthStateChanged(auth, (user) => {
    if (!user) {
        alert("Acesso restrito! Faça login para continuar.");
        window.location.href = "login.html";
    }
});

// Upload de imagens
async function uploadImagens(files, tipo) {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error("Usuário não autenticado");
        
        const urls = [];
        
        for (const file of files) {
            const fileName = file.name.replace(/[^\w.]/g, "_");
            const storageRef = ref(storage, `${tipo}/${user.uid}/${fileName}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            urls.push(downloadURL);
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

    const user = auth.currentUser;
    if (!user) {
        alert("Você precisa estar logado para criar anúncios!");
        window.location.href = "login.html";
        return;
    }

    const titulo = document.getElementById("titulo").value.trim();
    const descricao = document.getElementById("descricao").value.trim();
    const preco = parseFloat(document.getElementById("preco").value);
    const imagens = document.getElementById("imagens").files;
    const tipoAnuncio = document.querySelector('input[name="tipo-anuncio"]:checked')?.value;

    // Validações básicas
    if (!titulo || !descricao || isNaN(preco) || !imagens.length || !tipoAnuncio) {
        alert("Preencha todos os campos obrigatórios corretamente!");
        return;
    }

    try {
        // Faz o upload das imagens
        const urls = await uploadImagens(imagens, tipoAnuncio);
        if (urls.length === 0) {
            alert("Erro ao enviar imagens. Tente novamente.");
            return;
        }

        // Dados comuns a todos os anúncios
        const anuncioData = {
            titulo,
            descricao,
            preco,
            imagens: urls,
            userId: user.uid,
            data: new Date(),
            destaque: false // Pode ser alterado posteriormente para anúncios em destaque
        };

        // Adiciona campos específicos conforme o tipo de anúncio
        if (tipoAnuncio === "imovel") {
            // Campos específicos para imóveis
            anuncioData.tipo = document.getElementById("tipo-imovel").value;
            anuncioData.quartos = parseInt(document.getElementById("quartos").value);
            anuncioData.banheiros = parseInt(document.getElementById("banheiros").value);
            anuncioData.bairro = document.getElementById("bairro").value;
            anuncioData.area = parseFloat(document.getElementById("area").value);
            
            // Salva na coleção de imóveis
            await addDoc(collection(db, "imoveis"), anuncioData);
        } 
        else if (tipoAnuncio === "automovel") {
            // Campos específicos para automóveis
            anuncioData.marca = document.getElementById("marca").value;
            anuncioData.modelo = document.getElementById("modelo").value;
            anuncioData.ano = parseInt(document.getElementById("ano").value);
            anuncioData.km = parseInt(document.getElementById("km").value);
            
            // Salva na coleção de automóveis
            await addDoc(collection(db, "automoveis"), anuncioData);
        }

        alert("Anúncio publicado com sucesso!");
        window.location.href = "perfil.html#anuncios";
    } catch (error) {
        console.error("Erro ao publicar anúncio:", error);
        alert("Erro ao publicar anúncio: " + error.message);
    }
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("form-anuncio");
    if (form) form.addEventListener("submit", criarAnuncio);
});
