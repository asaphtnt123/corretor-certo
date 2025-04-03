// Importações do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc,
    doc,
    getDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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
const storage = getStorage(app);
const auth = getAuth(app);

// Elementos do DOM
const form = document.getElementById('anuncio-form');
const steps = document.querySelectorAll('.form-step');
const nextButtons = document.querySelectorAll('.next-step');
const prevButtons = document.querySelectorAll('.prev-step');
const imageInput = document.getElementById('imagens');
const imagePreview = document.getElementById('image-preview');
const reviewImages = document.getElementById('review-images');
const btnImovel = document.getElementById('btn-imovel');
const btnAutomovel = document.getElementById('btn-automovel');

// Variáveis globais
let currentStep = 0;
let selectedFiles = [];

// Função para mostrar o passo atual
function showStep(stepIndex) {
    steps.forEach((step, index) => {
        step.classList.toggle('active', index === stepIndex);
    });
    
    // Atualizar stepper
    document.querySelectorAll('.step').forEach((step, index) => {
        step.classList.toggle('active', index <= stepIndex);
    });
    
    // Atualizar botões
    if (stepIndex === 3) {
        updateReview();
    }
}

// Atualize a função nextStep para melhorar o feedback
function nextStep() {
    if (currentStep < steps.length - 1) {
        if (validateStep(currentStep)) {
            currentStep++;
            showStep(currentStep);
            
            // Scroll para o topo do formulário
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        } else {
            // Mostrar mensagem de erro específica
            if (currentStep === 1) {
                alert('Por favor, preencha todos os campos obrigatórios antes de avançar.');
            }
        }
    }
}

// Função para voltar ao passo anterior
function prevStep() {
    if (currentStep > 0) {
        currentStep--;
        showStep(currentStep);
    }
}

// Modifique a função validateStep para incluir a validação específica
function validateStep(stepIndex) {
    let isValid = true;
    
    if (stepIndex === 0) {
        // Validação do passo 1 (Informações Básicas)
        const inputs = document.querySelectorAll('#step-1 input[required], #step-1 textarea[required]');
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                input.classList.add('is-invalid');
                isValid = false;
            } else {
                input.classList.remove('is-invalid');
            }
        });
        
        // Validação adicional para descrição com mínimo de caracteres
        const descricao = document.getElementById('descricao');
        if (descricao.value.length < 20) { // Alterei para 20 para testes, pode voltar para 200 depois
            descricao.classList.add('is-invalid');
            document.querySelector('#step-1 .form-text').textContent = 'A descrição precisa ter pelo menos 20 caracteres';
            isValid = false;
        } else {
            descricao.classList.remove('is-invalid');
        }
    } else if (stepIndex === 1) {
        // Validação do passo 2 (Detalhes)
        isValid = validateStep2();
    }
    // O passo 3 (Imagens) não precisa de validação antecipada
    
    return isValid;
}

// Função para atualizar a revisão
function updateReview() {
    // Informações básicas
    document.getElementById('review-titulo').textContent = document.getElementById('titulo').value;
    document.getElementById('review-descricao').textContent = document.getElementById('descricao').value;
    document.getElementById('review-preco').textContent = parseFloat(document.getElementById('preco').value).toLocaleString('pt-BR');
    
    // Tipo de negociação
    const negociacao = document.querySelector('input[name="negociacao"]:checked').value;
    document.getElementById('review-negociacao').textContent = negociacao === 'venda' ? 'Venda' : 'Aluguel';
    
    // Verificar se é imóvel ou automóvel
    if (btnImovel.checked) {
        document.getElementById('review-tipo').textContent = 'Imóvel';
        document.getElementById('review-imovel-details').style.display = 'block';
        document.getElementById('review-automovel-details').style.display = 'none';
        
        // Detalhes do imóvel
        document.getElementById('review-bairro').textContent = document.getElementById('bairro').value;
        document.getElementById('review-quartos').textContent = document.getElementById('quartos').value || '0';
        document.getElementById('review-banheiros').textContent = document.getElementById('banheiros').value || '0';
        document.getElementById('review-garagem').textContent = document.getElementById('garagem').value || '0';
        document.getElementById('review-area').textContent = document.getElementById('area').value || '0';
        
        // Características
        const caracteristicas = [];
        if (document.getElementById('mobiliado').checked) caracteristicas.push('Mobiliado');
        if (document.getElementById('aceita-animais').checked) caracteristicas.push('Aceita animais');
        if (document.getElementById('condominio').checked) caracteristicas.push('Condomínio');
        if (document.getElementById('piscina').checked) caracteristicas.push('Piscina');
        if (document.getElementById('elevador').checked) caracteristicas.push('Elevador');
        if (document.getElementById('portaria').checked) caracteristicas.push('Portaria 24h');
        
        document.getElementById('review-caracteristicas').textContent = 
            caracteristicas.length > 0 ? caracteristicas.join(', ') : 'Nenhuma';
    } else {
        document.getElementById('review-tipo').textContent = 'Automóvel';
        document.getElementById('review-imovel-details').style.display = 'none';
        document.getElementById('review-automovel-details').style.display = 'block';
        
        // Detalhes do automóvel
        document.getElementById('review-marca-modelo').textContent = 
            `${document.getElementById('marca').value} ${document.getElementById('modelo').value}`;
        document.getElementById('review-ano').textContent = document.getElementById('ano').value;
        document.getElementById('review-km').textContent = document.getElementById('km').value || 'Não informada';
        document.getElementById('review-cor').textContent = document.getElementById('cor').value || 'Não informada';
        document.getElementById('review-combustivel').textContent = 
            document.getElementById('combustivel').value || 'Não informado';
        document.getElementById('review-cambio').textContent = 
            document.getElementById('cambio').value || 'Não informado';
    }
    
    // Imagens
    reviewImages.innerHTML = '';
    if (selectedFiles.length > 0) {
        selectedFiles.forEach(file => {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            img.alt = 'Preview';
            reviewImages.appendChild(img);
        });
    } else {
        reviewImages.innerHTML = '<p>Nenhuma imagem selecionada</p>';
    }
}

// Função para pré-visualizar imagens
function previewImages() {
    imagePreview.innerHTML = '';
    
    if (imageInput.files.length > 0) {
        selectedFiles = Array.from(imageInput.files);
        
        selectedFiles.forEach(file => {
            const imgContainer = document.createElement('div');
            imgContainer.className = 'image-thumbnail';
            
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            img.alt = 'Preview';
            
            imgContainer.appendChild(img);
            imagePreview.appendChild(imgContainer);
        });
    } else {
        imagePreview.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-images fa-3x mb-3 text-muted"></i>
                <p class="text-muted">Nenhuma imagem selecionada</p>
            </div>
        `;
    }
}

// Event Listeners
nextButtons.forEach(button => {
    button.addEventListener('click', nextStep);
});

prevButtons.forEach(button => {
    button.addEventListener('click', prevStep);
});

imageInput.addEventListener('change', previewImages);

// Alternar entre imóvel e automóvel
btnImovel.addEventListener('change', function() {
    if (this.checked) {
        document.getElementById('imovel-fields').style.display = 'block';
        document.getElementById('automovel-fields').style.display = 'none';
    }
});

btnAutomovel.addEventListener('change', function() {
    if (this.checked) {
        document.getElementById('imovel-fields').style.display = 'none';
        document.getElementById('automovel-fields').style.display = 'block';
    }
});

// Form Submission
form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const user = auth.currentUser;
    if (!user) {
        alert('Você precisa estar logado para criar um anúncio');
        return;
    }
    
    try {
        // Verificar se há imagens
        if (selectedFiles.length === 0) {
            alert('Por favor, adicione pelo menos uma imagem');
            return;
        }
        
        // Obter dados do formulário
        const formData = {
            titulo: document.getElementById('titulo').value,
            descricao: document.getElementById('descricao').value,
            preco: parseFloat(document.getElementById('preco').value),
            negociacao: document.querySelector('input[name="negociacao"]:checked').value,
            userId: user.uid,
            data: new Date(),
            status: 'ativo'
        };
        
        // Adicionar campos específicos
        if (btnImovel.checked) {
            formData.tipo = document.getElementById('tipo-imovel').value;
            formData.bairro = document.getElementById('bairro').value;
            formData.quartos = parseInt(document.getElementById('quartos').value) || 0;
            formData.banheiros = parseInt(document.getElementById('banheiros').value) || 0;
            formData.garagem = parseInt(document.getElementById('garagem').value) || 0;
            formData.area = parseFloat(document.getElementById('area').value);
            formData.mobiliado = document.getElementById('mobiliado').checked;
            formData.aceitaAnimais = document.getElementById('aceita-animais').checked;
            formData.endereco = document.getElementById('endereco').value;
            formData.proximoA = document.getElementById('proximo-a').value;
            
            // Upload de imagens e salvar no Firestore
            const imageUrls = await uploadImages(selectedFiles, 'imoveis', user.uid);
            formData.imagens = imageUrls;
            
            await addDoc(collection(db, 'imoveis'), formData);
        } else {
            formData.marca = document.getElementById('marca').value;
            formData.modelo = document.getElementById('modelo').value;
            formData.ano = parseInt(document.getElementById('ano').value);
            formData.km = parseInt(document.getElementById('km').value) || 0;
            formData.cor = document.getElementById('cor').value;
            formData.combustivel = document.getElementById('combustivel').value;
            formData.cambio = document.getElementById('cambio').value;
            
            // Upload de imagens e salvar no Firestore
            const imageUrls = await uploadImages(selectedFiles, 'automoveis', user.uid);
            formData.imagens = imageUrls;
            
            await addDoc(collection(db, 'automoveis'), formData);
        }
        
        alert('Anúncio criado com sucesso!');
        window.location.href = 'perfil.html';
        
    } catch (error) {
        console.error('Erro ao criar anúncio:', error);
        alert('Erro ao criar anúncio. Por favor, tente novamente.');
    }
});

// Função para fazer upload das imagens
async function uploadImages(files, folder, userId) {
    const urls = [];
    
    for (const file of files) {
        const storageRef = ref(storage, `${folder}/${userId}/${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        urls.push(url);
    }
    
    return urls;
}




// Adicione esta função para validar o passo 2 (Detalhes)
function validateStep2() {
    let isValid = true;
    
    // Verifica se é imóvel ou automóvel
    if (document.getElementById('btn-imovel').checked) {
        // Validação para imóveis
        if (!document.getElementById('tipo-imovel').value) {
            document.getElementById('tipo-imovel').classList.add('is-invalid');
            isValid = false;
        } else {
            document.getElementById('tipo-imovel').classList.remove('is-invalid');
        }
        
        if (!document.getElementById('bairro').value.trim()) {
            document.getElementById('bairro').classList.add('is-invalid');
            isValid = false;
        } else {
            document.getElementById('bairro').classList.remove('is-invalid');
        }
        
        if (!document.getElementById('area').value) {
            document.getElementById('area').classList.add('is-invalid');
            isValid = false;
        } else {
            document.getElementById('area').classList.remove('is-invalid');
        }
    } else {
        // Validação para automóveis
        if (!document.getElementById('marca').value) {
            document.getElementById('marca').classList.add('is-invalid');
            isValid = false;
        } else {
            document.getElementById('marca').classList.remove('is-invalid');
        }
        
        if (!document.getElementById('modelo').value.trim()) {
            document.getElementById('modelo').classList.add('is-invalid');
            isValid = false;
        } else {
            document.getElementById('modelo').classList.remove('is-invalid');
        }
        
        if (!document.getElementById('ano').value) {
            document.getElementById('ano').classList.add('is-invalid');
            isValid = false;
        } else {
            document.getElementById('ano').classList.remove('is-invalid');
        }
    }
    
    return isValid;
}
// Inicialização
showStep(0);
