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

// Elementos DOM
const btnImovel = document.getElementById('btn-imovel');
const btnAutomovel = document.getElementById('btn-automovel');
const imovelFields = document.getElementById('imovel-fields');
const automovelFields = document.getElementById('automovel-fields');
const anuncioForm = document.getElementById('anuncio-form');
const imagensInput = document.getElementById('imagens');
const imagePreview = document.getElementById('image-preview');

// Verificação de autenticação
onAuthStateChanged(auth, (user) => {
    if (!user) {
        alert("Acesso restrito! Faça login para continuar.");
        window.location.href = "login.html";
    }
});

// Elementos DOM

// Inicialmente, mostra apenas o formulário de imóvel (já que ele começa ativo)
automovelFields.classList.add('hidden');

// Alternar entre imóvel e automóvel
btnImovel.addEventListener('click', () => {
    btnImovel.classList.add('active');
    btnAutomovel.classList.remove('active');
    imovelFields.classList.remove('hidden');
    automovelFields.classList.add('hidden');
});

btnAutomovel.addEventListener('click', () => {
    btnAutomovel.classList.add('active');
    btnImovel.classList.remove('active');
    automovelFields.classList.remove('hidden');
    imovelFields.classList.add('hidden');
});
// Pré-visualização de imagens
imagensInput.addEventListener('change', function() {
    imagePreview.innerHTML = '';
    
    if (this.files.length === 0) {
        imagePreview.innerHTML = '<p class="text-muted">Nenhuma imagem selecionada</p>';
        return;
    }
    
    for (let file of this.files) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const imgContainer = document.createElement('div');
            imgContainer.className = 'image-preview-item';
            
            const img = document.createElement('img');
            img.src = e.target.result;
            img.alt = 'Pré-visualização do anúncio';
            img.className = 'img-thumbnail';
            
            imgContainer.appendChild(img);
            imagePreview.appendChild(imgContainer);
        }
        
        reader.readAsDataURL(file);
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
            const storageRef = ref(storage, `${tipo}/${user.uid}/${Date.now()}_${fileName}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            urls.push(downloadURL);
        }
        
        return urls;
    } catch (error) {
        console.error("Erro no upload:", error);
        alert("Erro ao enviar imagens. Tente arquivos menores (até 5MB)");
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

    const isImovel = btnImovel.classList.contains('active');
    const tipoAnuncio = isImovel ? 'imovel' : 'automovel';

    try {
        // Mostrar loading
        const submitBtn = anuncioForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Publicando...';
        submitBtn.disabled = true;

        // Obter dados do formulário
        const titulo = document.getElementById("titulo").value.trim();
        const descricao = document.getElementById("descricao").value.trim();
        const preco = parseFloat(document.getElementById("preco").value);
        const imagens = imagensInput.files;

        // Validações básicas
        if (!titulo || !descricao || isNaN(preco) || imagens.length === 0) {
            alert("Preencha todos os campos obrigatórios corretamente!");
            return;
        }

        // Dados comuns a todos os anúncios
        const anuncioData = {
            titulo,
            descricao,
            preco,
            userId: user.uid,
            data: serverTimestamp(),
            destaque: false,
            status: "ativo"
        };

        // Upload de imagens
        anuncioData.imagens = await uploadImagens(imagens, tipoAnuncio);
        if (anuncioData.imagens.length === 0) return;

        // Adiciona campos específicos conforme o tipo de anúncio
        if (isImovel) {
            anuncioData.tipo = document.getElementById("tipo-imovel").value;
            anuncioData.quartos = parseInt(document.getElementById("quartos").value) || 0;
            anuncioData.banheiros = parseInt(document.getElementById("banheiros").value) || 0;
            anuncioData.bairro = document.getElementById("bairro").value.trim();
            anuncioData.area = parseFloat(document.getElementById("area").value) || 0;
            
            // Salva na coleção de imóveis
            await addDoc(collection(db, "imoveis"), anuncioData);
        } else {
            anuncioData.marca = document.getElementById("marca").value.trim();
            anuncioData.modelo = document.getElementById("modelo").value.trim();
            anuncioData.ano = parseInt(document.getElementById("ano").value);
            anuncioData.km = parseInt(document.getElementById("km").value) || 0;
            anuncioData.cor = document.getElementById("cor")?.value.trim() || '';
            anuncioData.combustivel = document.getElementById("combustivel")?.value || '';
            
            // Salva na coleção de automóveis
            await addDoc(collection(db, "automoveis"), anuncioData);
        }

        alert("Anúncio publicado com sucesso!");
        window.location.href = "perfil.html#anuncios";
    } catch (error) {
        console.error("Erro ao publicar anúncio:", error);
        alert("Erro ao publicar anúncio: " + error.message);
    } finally {
        // Restaurar botão
        const submitBtn = anuncioForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-paper-plane me-2"></i>Publicar Anúncio';
            submitBtn.disabled = false;
        }
    }
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
    if (anuncioForm) {
        anuncioForm.addEventListener("submit", criarAnuncio);
    }
});
