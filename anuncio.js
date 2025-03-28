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
const anuncioForm = document.getElementById('anuncio-form');
const imagensInput = document.getElementById('imagens');
const imagePreview = document.getElementById('image-preview');
const submitBtn = document.querySelector('button[type="submit"]');
const btnImovel = document.getElementById('btn-imovel');
const btnAutomovel = document.getElementById('btn-automovel');
const imovelFields = document.getElementById('imovel-fields');
const automovelFields = document.getElementById('automovel-fields');

// Estado do aplicativo
const state = {
  selectedFiles: [],
  isSubmitting: false,
  currentStep: 1
};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
  setupEventListeners();
  initStepper();
  toggleFormularios(true); // Começa com imóvel ativo
});

function setupEventListeners() {
  // Alternância entre imóvel e automóvel
  btnImovel.addEventListener('change', () => toggleFormularios(true));
  btnAutomovel.addEventListener('change', () => toggleFormularios(false));
  
  // Navegação entre steps
  document.querySelectorAll('.next-step').forEach(btn => {
    btn.addEventListener('click', nextStep);
  });
  
  document.querySelectorAll('.prev-step').forEach(btn => {
    btn.addEventListener('click', prevStep);
  });
  
  // Upload de imagens
  imagensInput.addEventListener('change', handleImageUpload);
  
  // Submissão do formulário
  anuncioForm.addEventListener('submit', criarAnuncio);
}

function toggleFormularios(isImovel) {
  if (isImovel) {
    imovelFields.style.display = 'block';
    automovelFields.style.display = 'none';
    
    // Configurar campos obrigatórios
    document.getElementById('tipo-imovel').required = true;
    document.getElementById('bairro').required = true;
    document.getElementById('marca').required = false;
    document.getElementById('modelo').required = false;
    document.getElementById('ano').required = false;
  } else {
    imovelFields.style.display = 'none';
    automovelFields.style.display = 'block';
    
    // Configurar campos obrigatórios
    document.getElementById('tipo-imovel').required = false;
    document.getElementById('bairro').required = false;
    document.getElementById('marca').required = true;
    document.getElementById('modelo').required = true;
    document.getElementById('ano').required = true;
  }
}

function initStepper() {
  // Esconde todos os steps
  document.querySelectorAll('.form-step').forEach(step => {
    step.classList.remove('active');
  });
  
  // Mostra apenas o primeiro step
  document.getElementById('step-1').classList.add('active');
  
  // Atualiza o estado
  state.currentStep = 1;
}

function showStep(stepNumber) {
  // Valida se pode avançar
  if (stepNumber > state.currentStep && !validateStep(state.currentStep)) {
    return;
  }

  // Esconde todos os steps
  document.querySelectorAll('.form-step').forEach(step => {
    step.classList.remove('active');
  });
  
  // Mostra o step atual
  document.getElementById(`step-${stepNumber}`).classList.add('active');
  
  // Atualiza o stepper visual
  document.querySelectorAll('.step').forEach((step, index) => {
    step.classList.toggle('active', index === stepNumber - 1);
    step.classList.toggle('completed', index < stepNumber - 1);
  });
  
  // Atualiza o estado
  state.currentStep = stepNumber;
  
  // Atualiza botões de navegação
  updateNavigationButtons();
}

function updateNavigationButtons() {
  const prevButtons = document.querySelectorAll('.prev-step');
  const nextButtons = document.querySelectorAll('.next-step');
  
  // Atualiza botão anterior
  prevButtons.forEach(btn => {
    btn.disabled = state.currentStep === 1;
  });
  
  // Atualiza botão próximo
  nextButtons.forEach(btn => {
    btn.textContent = state.currentStep === 3 ? 'Revisar' : 'Próximo';
    btn.innerHTML = state.currentStep === 3 ? 
      'Revisar <i class="fas fa-arrow-right ms-2"></i>' : 
      'Próximo <i class="fas fa-arrow-right ms-2"></i>';
  });
}

function nextStep() {
  if (validateStep(state.currentStep)) {
    showStep(state.currentStep + 1);
  }
}

function prevStep() {
  showStep(state.currentStep - 1);
}

function validateStep(step) {
  // Validação básica para cada passo
  if (step === 1) {
    const titulo = document.getElementById('titulo').value.trim();
    const descricao = document.getElementById('descricao').value.trim();
    const preco = document.getElementById('preco').value;
    
    if (!titulo || titulo.length < 10) {
      showAlert('O título deve ter pelo menos 10 caracteres', 'error');
      return false;
    }
    
    if (!descricao || descricao.length < 30) {
      showAlert('A descrição deve ter pelo menos 30 caracteres', 'error');
      return false;
    }
    
    if (!preco || isNaN(preco)) {
      showAlert('Por favor, insira um preço válido', 'error');
      return false;
    }
  }
  
  if (step === 2) {
    const isImovel = btnImovel.checked;
    
    if (isImovel) {
      const tipoImovel = document.getElementById('tipo-imovel').value;
      const bairro = document.getElementById('bairro').value.trim();
      
      if (!tipoImovel) {
        showAlert('Selecione o tipo de imóvel', 'error');
        return false;
      }
      
      if (!bairro) {
        showAlert('Informe o bairro', 'error');
        return false;
      }
    } else {
      const marca = document.getElementById('marca').value;
      const modelo = document.getElementById('modelo').value.trim();
      const ano = document.getElementById('ano').value;
      
      if (!marca) {
        showAlert('Selecione a marca do veículo', 'error');
        return false;
      }
      
      if (!modelo) {
        showAlert('Informe o modelo do veículo', 'error');
        return false;
      }
      
      if (!ano) {
        showAlert('Selecione o ano do veículo', 'error');
        return false;
      }
    }
  }
  
  if (step === 3) {
    if (state.selectedFiles.length === 0) {
      showAlert('Adicione pelo menos uma imagem', 'error');
      return false;
    }
  }
  
  return true;
}

function handleImageUpload() {
  imagePreview.innerHTML = '';
  state.selectedFiles = Array.from(this.files);
  
  if (state.selectedFiles.length === 0) {
    imagePreview.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-images fa-3x mb-3 text-muted"></i>
        <p class="text-muted">Nenhuma imagem selecionada</p>
      </div>
    `;
    return;
  }
  
  state.selectedFiles.forEach((file, index) => {
    const reader = new FileReader();
    
    reader.onload = function(e) {
      const imgContainer = document.createElement('div');
      imgContainer.className = 'image-preview-item d-inline-block m-2';
      imgContainer.style.width = '120px';
      imgContainer.style.height = '120px';
      imgContainer.style.position = 'relative';
      
      const img = document.createElement('img');
      img.src = e.target.result;
      img.className = 'img-thumbnail h-100 w-100';
      img.style.objectFit = 'cover';
      
      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn btn-danger btn-sm';
      removeBtn.style.position = 'absolute';
      removeBtn.style.top = '5px';
      removeBtn.style.right = '5px';
      removeBtn.innerHTML = '<i class="fas fa-times"></i>';
      removeBtn.onclick = (e) => {
        e.preventDefault();
        state.selectedFiles.splice(index, 1);
        handleImageUpload(); // Recria o preview
      };
      
      imgContainer.appendChild(img);
      imgContainer.appendChild(removeBtn);
      imagePreview.appendChild(imgContainer);
    };
    
    reader.readAsDataURL(file);
  });
}

async function criarAnuncio(event) {
  event.preventDefault();
  
  if (state.isSubmitting) return;
  
  const user = auth.currentUser;
  if (!user) {
    showAlert('Você precisa estar logado para criar anúncios!', 'error');
    setTimeout(() => window.location.href = 'login.html', 2000);
    return;
  }
  
  if (!validateStep(4)) return;
  
  try {
    toggleLoading(true);
    
    // Obter dados básicos
    const anuncioData = {
      titulo: document.getElementById('titulo').value.trim(),
      descricao: document.getElementById('descricao').value.trim(),
      preco: parseFloat(document.getElementById('preco').value),
      negociacao: document.querySelector('input[name="negociacao"]:checked').value,
      userId: user.uid,
      userEmail: user.email,
      data: serverTimestamp(),
      status: 'ativo'
    };
    
    // Adicionar campos específicos
    if (btnImovel.checked) {
      anuncioData.tipo = 'imóvel';
      anuncioData.tipoImovel = document.getElementById('tipo-imovel').value;
      anuncioData.bairro = document.getElementById('bairro').value.trim();
      anuncioData.quartos = document.getElementById('quartos').value;
      anuncioData.banheiros = document.getElementById('banheiros').value;
      anuncioData.garagem = document.getElementById('garagem').value;
      anuncioData.area = parseFloat(document.getElementById('area').value);
      
      // Características
      anuncioData.caracteristicas = [];
      document.querySelectorAll('#imovel-fields input[type="checkbox"]:checked').forEach(cb => {
        anuncioData.caracteristicas.push(cb.name);
      });
    } else {
      anuncioData.tipo = 'automóvel';
      anuncioData.marca = document.getElementById('marca').value;
      anuncioData.modelo = document.getElementById('modelo').value.trim();
      anuncioData.ano = document.getElementById('ano').value;
      anuncioData.km = document.getElementById('km').value;
      anuncioData.cor = document.getElementById('cor').value;
      anuncioData.combustivel = document.getElementById('combustivel').value;
      anuncioData.cambio = document.getElementById('cambio').value;
      
      // Características
      anuncioData.caracteristicas = [];
      document.querySelectorAll('#automovel-fields input[type="checkbox"]:checked').forEach(cb => {
        anuncioData.caracteristicas.push(cb.name);
      });
    }
    
    // Upload de imagens
    anuncioData.imagens = await uploadImagens(state.selectedFiles, anuncioData.tipo);
    
    // Salvar no Firestore
    await addDoc(collection(db, 'anuncios'), anuncioData);
    
    showAlert('Anúncio publicado com sucesso!', 'success');
    setTimeout(() => window.location.href = 'perfil.html#anuncios', 1500);
  } catch (error) {
    console.error('Erro ao publicar anúncio:', error);
    showAlert(`Erro ao publicar anúncio: ${error.message}`, 'error');
  } finally {
    toggleLoading(false);
  }
}

async function uploadImagens(files, tipo) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Usuário não autenticado');
    
    const urls = [];
    
    for (const file of files.slice(0, 10)) { // Limita a 10 imagens
      const fileName = file.name.replace(/[^\w.]/g, '_');
      const storageRef = ref(storage, `${tipo}/${user.uid}/${Date.now()}_${fileName}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      urls.push(downloadURL);
    }
    
    return urls;
  } catch (error) {
    console.error('Erro no upload:', error);
    throw error;
  }
}

function toggleLoading(isLoading) {
  state.isSubmitting = isLoading;
  submitBtn.disabled = isLoading;
  
  if (isLoading) {
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Publicando...';
  } else {
    submitBtn.innerHTML = '<i class="fas fa-paper-plane me-2"></i> Publicar Anúncio';
  }
}

function showAlert(message, type = 'success') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} position-fixed`;
  alertDiv.style.top = '20px';
  alertDiv.style.right = '20px';
  alertDiv.style.zIndex = '1000';
  alertDiv.style.animation = 'fadeIn 0.3s ease';
  alertDiv.innerHTML = `
    <div class="d-flex align-items-center">
      <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'} me-2"></i>
      ${message}
    </div>
  `;
  
  document.body.appendChild(alertDiv);
  
  setTimeout(() => {
    alertDiv.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => alertDiv.remove(), 300);
  }, 5000);
}

// Verificação de autenticação
onAuthStateChanged(auth, (user) => {
  if (!user) {
    showAlert('Acesso restrito! Faça login para continuar.', 'error');
    setTimeout(() => window.location.href = 'login.html', 2000);
  }
});
