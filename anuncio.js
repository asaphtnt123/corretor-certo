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
const formAnuncio = document.getElementById("form-anuncio");
const tipoAnuncioRadios = document.querySelectorAll('input[name="tipo-anuncio"]');
const formImovel = document.getElementById("form-imovel");
const formAutomovel = document.getElementById("form-automovel");
const imagePreviewContainer = document.getElementById("image-preview");
const imagensInput = document.getElementById("imagens");

// Verificação de autenticação
onAuthStateChanged(auth, (user) => {
    if (!user) {
        alert("Acesso restrito! Faça login para continuar.");
        window.location.href = "login.html";
    }
});

// Alternar entre formulários de imóvel e automóvel
tipoAnuncioRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (e.target.value === 'imovel') {
            formImovel.classList.remove('hidden');
            formAutomovel.classList.add('hidden');
        } else {
            formImovel.classList.add('hidden');
            formAutomovel.classList.remove('hidden');
        }
    });
});

// Pré-visualização de imagens
imagensInput.addEventListener('change', function() {
    imagePreviewContainer.innerHTML = '';
    
    if (this.files.length === 0) {
        imagePreviewContainer.innerHTML = '<p class="no-images">Nenhuma imagem selecionada</p>';
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
            
            imgContainer.appendChild(img);
            imagePreviewContainer.appendChild(imgContainer);
        }
        
        reader.readAsDataURL(file);
    }
});

// Validação de formulário
function validarFormulario(tipoAnuncio) {
    let valido = true;
    
    // Campos comuns
    if (!document.getElementById("titulo").value.trim()) {
        alert("Por favor, informe um título para o anúncio");
        return false;
    }
    
    if (!document.getElementById("descricao").value.trim()) {
        alert("Por favor, adicione uma descrição");
        return false;
    }
    
    if (isNaN(parseFloat(document.getElementById("preco").value))) {
        alert("Por favor, informe um preço válido");
        return false;
    }
    
    if (imagensInput.files.length === 0) {
        alert("Por favor, adicione pelo menos uma imagem");
        return false;
    }
    
    // Validação específica por tipo
    if (tipoAnuncio === 'imovel') {
        if (!document.getElementById("tipo-imovel").value) {
            alert("Por favor, selecione o tipo de imóvel");
            return false;
        }
        
        if (!document.getElementById("bairro").value.trim()) {
            alert("Por favor, informe o bairro");
            return false;
        }
    } else if (tipoAnuncio === 'automovel') {
        if (!document.getElementById("marca").value.trim()) {
            alert("Por favor, informe a marca do veículo");
            return false;
        }
        
        if (!document.getElementById("modelo").value.trim()) {
            alert("Por favor, informe o modelo do veículo");
            return false;
        }
        
        if (isNaN(parseInt(document.getElementById("ano").value))) {
            alert("Por favor, informe um ano válido");
            return false;
        }
    }
    
    return valido;
}

// Upload de imagens
async function uploadImagens(files, tipo) {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error("Usuário não autenticado");
        
        const urls = [];
        
        for (const file of files) {
            // Verificar tamanho do arquivo (limite de 5MB)
            if (file.size > 5 * 1024 * 1024) {
                throw new Error(`A imagem ${file.name} é muito grande (limite: 5MB)`);
            }
            
            const fileName = file.name.replace(/[^\w.]/g, "_");
            const storageRef = ref(storage, `${tipo}/${user.uid}/${Date.now()}_${fileName}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            urls.push(downloadURL);
        }
        
        return urls;
    } catch (error) {
        console.error("Erro no upload:", error);
        throw error;
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

    const tipoAnuncio = document.querySelector('input[name="tipo-anuncio"]:checked')?.value;
    
    // Validação inicial
    if (!tipoAnuncio) {
        alert("Por favor, selecione o tipo de anúncio");
        return;
    }
    
    if (!validarFormulario(tipoAnuncio)) {
        return;
    }

    try {
        // Mostrar loading
        const submitBtn = formAnuncio.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publicando...';
        submitBtn.disabled = true;

        // Obter dados do formulário
        const titulo = document.getElementById("titulo").value.trim();
        const descricao = document.getElementById("descricao").value.trim();
        const preco = parseFloat(document.getElementById("preco").value);
        const imagens = imagensInput.files;

        // Dados comuns a todos os anúncios
        const anuncioData = {
            titulo,
            descricao,
            preco,
            userId: user.uid,
            data: serverTimestamp(),
            destaque: false,
            visualizacoes: 0,
            status: "ativo"
        };

        // Upload de imagens
        anuncioData.imagens = await uploadImagens(imagens, tipoAnuncio);
        
        // Adiciona campos específicos conforme o tipo de anúncio
        if (tipoAnuncio === "imovel") {
            anuncioData.tipo = document.getElementById("tipo-imovel").value;
            anuncioData.quartos = parseInt(document.getElementById("quartos").value) || 0;
            anuncioData.banheiros = parseInt(document.getElementById("banheiros").value) || 0;
            anuncioData.bairro = document.getElementById("bairro").value.trim();
            anuncioData.area = parseFloat(document.getElementById("area").value) || 0;
            
            // Salva na coleção de imóveis
            await addDoc(collection(db, "imoveis"), anuncioData);
        } 
        else if (tipoAnuncio === "automovel") {
            anuncioData.marca = document.getElementById("marca").value.trim();
            anuncioData.modelo = document.getElementById("modelo").value.trim();
            anuncioData.ano = parseInt(document.getElementById("ano").value);
            anuncioData.km = parseInt(document.getElementById("km").value) || 0;
            anuncioData.cor = document.getElementById("cor")?.value.trim() || '';
            anuncioData.combustivel = document.getElementById("combustivel")?.value || '';
            
            // Salva na coleção de automóveis
            await addDoc(collection(db, "automoveis"), anuncioData);
        }

        // Feedback de sucesso
        alert("Anúncio publicado com sucesso!");
        window.location.href = "perfil.html#anuncios";
        
    } catch (error) {
        console.error("Erro ao publicar anúncio:", error);
        
        // Mensagens de erro amigáveis
        let errorMessage = "Erro ao publicar anúncio. Tente novamente.";
        
        if (error.message.includes("storage/unauthorized")) {
            errorMessage = "Erro de permissão. Faça login novamente.";
        } else if (error.message.includes("storage/object-not-found")) {
            errorMessage = "Erro ao enviar imagens. Tente novamente.";
        } else if (error.message.includes("5MB")) {
            errorMessage = error.message;
        }
        
        alert(errorMessage);
    } finally {
        // Restaurar botão
        const submitBtn = formAnuncio.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
        }
    }
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
    if (formAnuncio) {
        formAnuncio.addEventListener("submit", criarAnuncio);
        
        // Mostrar formulário de imóvel por padrão
        document.getElementById("tipo-anuncio-imovel").checked = true;
        formImovel.classList.remove('hidden');
    }
});
