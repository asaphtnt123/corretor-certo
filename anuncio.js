// Importações do Firebase
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

// Elementos DOM
const btnImovel = document.getElementById('btn-imovel');
const btnAutomovel = document.getElementById('btn-automovel');
const imovelFields = document.getElementById('imovel-fields');
const automovelFields = document.getElementById('automovel-fields');
const anuncioForm = document.getElementById('anuncio-form');
const imagensInput = document.getElementById('imagens');
const imagePreview = document.getElementById('image-preview');
const submitBtn = document.getElementById('submit-btn');

// Elementos dos formulários específicos
const tipoImovelInput = document.getElementById('tipo-imovel');
const bairroInput = document.getElementById('bairro');
const marcaInput = document.getElementById('marca');
const modeloInput = document.getElementById('modelo');
const anoInput = document.getElementById('ano');

// Estado do aplicativo
const state = {
  selectedFiles: [],
  isSubmitting: false
};

// Verificação de autenticação
onAuthStateChanged(auth, (user) => {
  if (!user) {
    showAlert('Acesso restrito! Faça login para continuar.', 'error');
    setTimeout(() => window.location.href = "login.html", 2000);
  }
});

// Funções auxiliares
function showAlert(message, type = 'success') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type}`;
  alertDiv.textContent = message;
  alertDiv.style.position = 'fixed';
  alertDiv.style.top = '20px';
  alertDiv.style.right = '20px';
  alertDiv.style.zIndex = '1000';
  alertDiv.style.padding = '1rem 2rem';
  alertDiv.style.borderRadius = '8px';
  alertDiv.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  alertDiv.style.animation = 'fadeIn 0.3s ease';
  
  if (type === 'error') {
    alertDiv.style.backgroundColor = '#e74c3c';
    alertDiv.style.color = 'white';
  } else {
    alertDiv.style.backgroundColor = '#2ecc71';
    alertDiv.style.color = 'white';
  }
  
  document.body.appendChild(alertDiv);
  
  setTimeout(() => {
    alertDiv.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => alertDiv.remove(), 300);
  }, 5000);
}

function toggleLoading(isLoading) {
  state.isSubmitting = isLoading;
  submitBtn.disabled = isLoading;
  
  if (isLoading) {
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publicando...';
  } else {
    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Publicar Anúncio';
  }
}

// Função para alternar entre formulários
function toggleFormularios(isImovel) {
  if (isImovel) {
    btnImovel.classList.add('active');
    btnAutomovel.classList.remove('active');
    imovelFields.classList.add('active');
    automovelFields.classList.remove('active');
    
    // Configurar campos obrigatórios
    tipoImovelInput.required = true;
    bairroInput.required = true;
    marcaInput.required = false;
    modeloInput.required = false;
    anoInput.required = false;
  } else {
    btnAutomovel.classList.add('active');
    btnImovel.classList.remove('active');
    automovelFields.classList.add('active');
    imovelFields.classList.remove('active');
    
    // Configurar campos obrigatórios
    tipoImovelInput.required = false;
    bairroInput.required = false;
    marcaInput.required = true;
    modeloInput.required = true;
    anoInput.required = true;
  }
}

// Inicialização dos formulários
automovelFields.classList.remove('active');
toggleFormularios(true); // Começa com imóvel ativo

// Event listeners para alternar entre formulários
btnImovel.addEventListener('click', () => toggleFormularios(true));
btnAutomovel.addEventListener('click', () => toggleFormularios(false));

// Pré-visualização de imagens
function updateImagePreview() {
  imagePreview.innerHTML = '';
  
  if (state.selectedFiles.length === 0) {
    imagePreview.innerHTML = '<p class="text-muted">Nenhuma imagem selecionada</p>';
    return;
  }
  
  state.selectedFiles.forEach((file, index) => {
    const reader = new FileReader();
    
    reader.onload = function(e) {
      const imgContainer = document.createElement('div');
      imgContainer.className = 'image-preview-item';
      
      const img = document.createElement('img');
      img.src = e.target.result;
      img.alt = 'Pré-visualização do anúncio';
      
      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-image';
      removeBtn.innerHTML = '&times;';
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        state.selectedFiles.splice(index, 1);
        updateImagePreview();
      });
      
      imgContainer.appendChild(img);
      imgContainer.appendChild(removeBtn);
      imagePreview.appendChild(imgContainer);
    };
    
    reader.readAsDataURL(file);
  });
}

// Upload de imagens
async function uploadImagens(files, tipo) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não autenticado");
    
    const urls = [];
    const uploadPromises = [];
    
    // Limitar a 10 imagens e 5MB cada
    const validFiles = Array.from(files)
      .slice(0, 10)
      .filter(file => file.size <= 5 * 1024 * 1024);
    
    if (validFiles.length === 0) {
      throw new Error("Nenhuma imagem válida (máx. 5MB cada)");
    }
    
    for (const file of validFiles) {
      const fileName = file.name.replace(/[^\w.]/g, "_");
      const storageRef = ref(storage, `${tipo}/${user.uid}/${Date.now()}_${fileName}`);
      
      uploadPromises.push(
        uploadBytes(storageRef, file)
          .then(snapshot => getDownloadURL(snapshot.ref))
      );
    }
    
    // Executar uploads em paralelo
    const results = await Promise.all(uploadPromises);
    urls.push(...results);
    
    return urls;
  } catch (error) {
    console.error("Erro no upload:", error);
    throw error;
  }
}

// Validação do formulário
function validateForm(isImovel) {
  const titulo = document.getElementById("titulo").value.trim();
  const descricao = document.getElementById("descricao").value.trim();
  const preco = parseFloat(document.getElementById("preco").value);
  
  // Validações básicas
  if (!titulo || titulo.length < 10) {
    showAlert("O título deve ter pelo menos 10 caracteres", "error");
    return false;
  }
  
  if (!descricao || descricao.length < 30) {
    showAlert("A descrição deve ter pelo menos 30 caracteres", "error");
    return false;
  }
  
  if (isNaN(preco) {
    showAlert("Preço inválido", "error");
    return false;
  }
  
  if (state.selectedFiles.length === 0) {
    showAlert("Adicione pelo menos uma imagem", "error");
    return false;
  }
  
  // Validações específicas
  if (isImovel) {
    if (!tipoImovelInput.value) {
      showAlert("Selecione o tipo de imóvel", "error");
      return false;
    }
    
    if (!bairroInput.value.trim()) {
      showAlert("Preencha o bairro", "error");
      return false;
    }
  } else {
    if (!marcaInput.value.trim()) {
      showAlert("Preencha a marca do veículo", "error");
      return false;
    }
    
    if (!modeloInput.value.trim()) {
      showAlert("Preencha o modelo do veículo", "error");
      return false;
    }
    
    if (!anoInput.value) {
      showAlert("Preencha o ano do veículo", "error");
      return false;
    }
  }
  
  return true;
}

// Criar anúncio
async function criarAnuncio(event) {
  event.preventDefault();
  
  if (state.isSubmitting) return;
  
  const user = auth.currentUser;
  if (!user) {
    showAlert("Você precisa estar logado para criar anúncios!", "error");
    setTimeout(() => window.location.href = "login.html", 2000);
    return;
  }
  
  const isImovel = btnImovel.classList.contains('active');
  const tipoAnuncio = isImovel ? 'imovel' : 'automovel';
  
  // Validar formulário
  if (!validateForm(isImovel)) return;
  
  try {
    toggleLoading(true);
    
    // Obter dados do formulário
    const titulo = document.getElementById("titulo").value.trim();
    const descricao = document.getElementById("descricao").value.trim();
    const preco = parseFloat(document.getElementById("preco").value);
    
    // Dados comuns a todos os anúncios
    const anuncioData = {
      titulo,
      descricao,
      preco,
      userId: user.uid,
      userEmail: user.email,
      data: serverTimestamp(),
      destaque: false,
      status: "ativo",
      visualizacoes: 0
    };
    
    // Upload de imagens
    anuncioData.imagens = await uploadImagens(state.selectedFiles, tipoAnuncio);
    
    // Adiciona campos específicos conforme o tipo de anúncio
    if (isImovel) {
      anuncioData.tipo = tipoImovelInput.value;
      anuncioData.quartos = parseInt(document.getElementById("quartos").value) || 0;
      anuncioData.banheiros = parseInt(document.getElementById("banheiros").value) || 0;
      anuncioData.bairro = bairroInput.value.trim();
      anuncioData.area = parseFloat(document.getElementById("area").value) || 0;
      anuncioData.mobiliado = document.getElementById("mobiliado").checked;
      anuncioData.condominio = parseFloat(document.getElementById("condominio").value) || 0;
      
      // Salva na coleção de imóveis
      await addDoc(collection(db, "imoveis"), anuncioData);
    } else {
      anuncioData.marca = marcaInput.value.trim();
      anuncioData.modelo = modeloInput.value.trim();
      anuncioData.ano = parseInt(anoInput.value);
      anuncioData.km = parseInt(document.getElementById("km").value) || 0;
      anuncioData.cor = document.getElementById("cor")?.value.trim() || '';
      anuncioData.combustivel = document.getElementById("combustivel")?.value || '';
      anuncioData.cambio = document.getElementById("cambio")?.value || '';
      anuncioData.portas = parseInt(document.getElementById("portas").value) || 4;
      
      // Salva na coleção de automóveis
      await addDoc(collection(db, "automoveis"), anuncioData);
    }
    
    showAlert("Anúncio publicado com sucesso!");
    setTimeout(() => window.location.href = "perfil.html#anuncios", 1500);
  } catch (error) {
    console.error("Erro ao publicar anúncio:", error);
    showAlert("Erro ao publicar anúncio: " + error.message, "error");
  } finally {
    toggleLoading(false);
  }
}

// Event listeners
imagensInput.addEventListener('change', function() {
  state.selectedFiles = Array.from(this.files);
  updateImagePreview();
});

anuncioForm.addEventListener('submit', criarAnuncio);

// Drag and drop para imagens
const uploadSection = document.querySelector('.upload-section');

uploadSection.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadSection.style.borderColor = '#3498db';
  uploadSection.style.backgroundColor = '#f8fbfe';
});

uploadSection.addEventListener('dragleave', () => {
  uploadSection.style.borderColor = '#bdc3c7';
  uploadSection.style.backgroundColor = '';
});

uploadSection.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadSection.style.borderColor = '#bdc3c7';
  uploadSection.style.backgroundColor = '';
  
  if (e.dataTransfer.files.length > 0) {
    imagensInput.files = e.dataTransfer.files;
    state.selectedFiles = Array.from(e.dataTransfer.files);
    updateImagePreview();
  }
});

// Máscara para preço
const precoInput = document.getElementById('preco');
if (precoInput) {
  precoInput.addEventListener('input', function(e) {
    let value = this.value.replace(/\D/g, '');
    value = (value / 100).toFixed(2);
    this.value = value ? 'R$ ' + value.replace('.', ',') : '';
  });
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  console.log("Sistema de anúncios inicializado");
});
