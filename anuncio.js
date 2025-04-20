// Importações do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCNr5JoKsWJVeUYAaVDqmPznZo100v0uvg",
  authDomain: "corretorcerto-76933.firebaseapp.com",
  databaseURL: "https://corretorcerto-76933-default-rtdb.firebaseio.com",
  projectId: "corretorcerto-76933",
  storageBucket: "corretorcerto-76933.firebasestorage.app",
  messagingSenderId: "357149829474",
  appId: "1:357149829474:web:324b2005d82eabbce5e43b"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// Elementos do DOM
const form = document.getElementById('anuncio-form');
const steps = document.querySelectorAll('.form-step');
const imageInput = document.getElementById('imagens');
const imagePreview = document.getElementById('image-preview');
const reviewImages = document.getElementById('review-images');
const btnImovel = document.getElementById('btn-imovel');
const btnAutomovel = document.getElementById('btn-automovel');

// Variáveis globais
let currentStep = 0;
let selectedFiles = [];

let loadingAnimation;
// Inicialize a animação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    loadingAnimation = lottie.loadAnimation({
        container: document.getElementById('loading-corretor'),
        renderer: 'svg',
        loop: true,
        autoplay: false, // Não autoplay inicialmente
        path: '/LoadingAnuncioCar.json' // Ajuste o caminho conforme necessário
    });
});

// Função para mostrar o passo atual
function showStep(stepIndex) {
    steps.forEach((step, index) => {
        step.classList.toggle('active', index === stepIndex);
    });
    
    // Atualizar stepper
    document.querySelectorAll('.step').forEach((step, index) => {
        step.classList.toggle('active', index <= stepIndex);
    });
    
    // Atualizar revisão se for o último passo
    if (stepIndex === 3) {
        updateReview();
    }
}

function nextStep() {
    if (!validateStep(currentStep)) {
        console.error('Validação falhou no passo', currentStep);
        highlightInvalidFields();
        
        // Mostra mensagem específica
        let errorMessage = 'Por favor, corrija os seguintes erros:';
        const invalidFields = document.querySelectorAll('.is-invalid');
        
        invalidFields.forEach(field => {
            const fieldName = field.id || field.name;
            errorMessage += `\n- Campo ${fieldName} inválido`;
        });
        
        alert(errorMessage);
        return;
    }
    
    currentStep++;
    showStep(currentStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function highlightInvalidFields() {
    const invalidFields = document.querySelectorAll('.is-invalid');
    if (invalidFields.length > 0) {
        invalidFields[0].scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center'
        });
    }
}


// Função para voltar ao passo anterior
function prevStep() {
    if (currentStep > 0) {
        currentStep--;
        showStep(currentStep);
    }
}

// Função para atualizar o stepper visual
function updateStepper() {
    document.querySelectorAll('.step').forEach((step, index) => {
        if (index < currentStep) {
            step.classList.add('completed');
            step.classList.add('active');
        } else if (index === currentStep) {
            step.classList.add('active');
            step.classList.remove('completed');
        } else {
            step.classList.remove('active', 'completed');
        }
    });
}

function validateStep(stepIndex) {
        console.log("Validando passo 2 - Tipo:", btnImovel.checked ? "Imóvel" : "Automóvel");

    let isValid = true;
    
    if (stepIndex === 0) {
        // Validação comum para todos os anúncios
        const requiredCommonFields = document.querySelectorAll(`
            #step-1 #titulo[required],
            #step-1 #descricao[required],
            #step-1 #preco[required],
            #step-1 input[name="negociacao"][required]
        `);
        
        requiredCommonFields.forEach(field => {
            if (!field.value || !field.value.trim()) {
                field.classList.add('is-invalid');
                isValid = false;
            } else {
                field.classList.remove('is-invalid');
            }
        });

        // Validação específica para imóveis
        if (btnImovel.checked) {
            const requiredImovelFields = document.querySelectorAll(`
                #step-1 #tipo-imovel[required],
                #step-1 #bairro[required],
                #step-1 #area[required]
            `);
            
            requiredImovelFields.forEach(field => {
                if (!field.value || !field.value.trim()) {
                    field.classList.add('is-invalid');
                    isValid = false;
                } else {
                    field.classList.remove('is-invalid');
                }
            });
        }
        // Validação específica para automóveis
        else if (btnAutomovel.checked) {
            const requiredAutomovelFields = document.querySelectorAll(`
                #step-1 #tipo-automovel[required],
                #step-1 #marca[required],
                #step-1 #modelo[required],
                #step-1 #ano[required]
            `);
            
            requiredAutomovelFields.forEach(field => {
                if (!field.value || !field.value.trim()) {
                    field.classList.add('is-invalid');
                    isValid = false;
                } else {
                    field.classList.remove('is-invalid');
                }
            });
        }
        
        // Validação adicional para descrição
        const descricao = document.getElementById('descricao');
        if (descricao.value.length < 20) {
            descricao.classList.add('is-invalid');
            isValid = false;
        } else {
            descricao.classList.remove('is-invalid');
        }
        
        // Validação adicional para preço
        const preco = document.getElementById('preco');
        if (isNaN(parseFloat(preco.value))) {
            preco.classList.add('is-invalid');
            isValid = false;
        } else {
            preco.classList.remove('is-invalid');
        }
        
        // Validação para tipo de negociação
        const negociacao = document.querySelector('input[name="negociacao"]:checked');
        if (!negociacao) {
            isValid = false;
            document.querySelectorAll('input[name="negociacao"]').forEach(radio => {
                radio.closest('.btn-group').classList.add('is-invalid');
            });
        } else {
            document.querySelectorAll('input[name="negociacao"]').forEach(radio => {
                radio.closest('.btn-group').classList.remove('is-invalid');
            });
        }
        
    } else if (stepIndex === 1) {
        isValid = validateStep2();
    }
    
    return isValid;
}

function debugValidation() {
    const requiredFields = document.querySelectorAll('#step-1 input[required], #step-1 select[required], #step-1 textarea[required]');
    console.log("--- Validação Debug ---");
    requiredFields.forEach(field => {
        console.log(`Campo: ${field.id}, Valor: ${field.value}, Válido: ${field.value.trim() !== ''}`);
    });
    console.log("Descrição length:", document.getElementById('descricao').value.length);
    console.log("Preço válido:", !isNaN(parseFloat(document.getElementById('preco').value)));
}


function validateStep2() {
    let isValid = true;
    
    if (btnImovel.checked) {
        // Validação apenas para imóveis
        const tipoImovel = document.getElementById('tipo-imovel');
        const bairro = document.getElementById('bairro');
        const area = document.getElementById('area');
        
        if (!tipoImovel.value) {
            tipoImovel.classList.add('is-invalid');
            isValid = false;
        } else {
            tipoImovel.classList.remove('is-invalid');
        }
        
        if (!bairro.value.trim()) {
            bairro.classList.add('is-invalid');
            isValid = false;
        } else {
            bairro.classList.remove('is-invalid');
        }
        
        if (!area.value) {
            area.classList.add('is-invalid');
            isValid = false;
        } else {
            area.classList.remove('is-invalid');
        }
    } else {
        // Validação apenas para automóveis
        const tipoAutomovel = document.getElementById('tipo-automovel');
        const marca = document.getElementById('marca');
        const modelo = document.getElementById('modelo');
        const ano = document.getElementById('ano');
        
        if (!tipoAutomovel.value) {
            tipoAutomovel.classList.add('is-invalid');
            isValid = false;
        } else {
            tipoAutomovel.classList.remove('is-invalid');
        }
        
        if (!marca.value) {
            marca.classList.add('is-invalid');
            isValid = false;
        } else {
            marca.classList.remove('is-invalid');
        }
        
        if (!modelo.value.trim()) {
            modelo.classList.add('is-invalid');
            isValid = false;
        } else {
            modelo.classList.remove('is-invalid');
        }
        
        if (!ano.value) {
            ano.classList.add('is-invalid');
            isValid = false;
        } else {
            ano.classList.remove('is-invalid');
        }
    }
    
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

        // Dentro da função updateReview()
const tipoVeiculo = {
    'carro': 'Carro',
    'caminhonete': 'Caminhonete',
    'van': 'Van',
    'caminhao': 'Caminhão',
    'moto': 'Moto',
    'onibus': 'Ônibus',
    'outro': 'Outro'
};

document.getElementById('review-tipo-veiculo').textContent = 
    tipoVeiculo[document.getElementById('tipo-automovel').value] || 'Não informado';
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


         const tipoVeiculoMap = {
            'carro': 'Carro',
            'caminhonete': 'Caminhonete',
            'van': 'Van',
            'caminhao': 'Caminhão',
            'moto': 'Moto',
            'onibus': 'Ônibus',
            'outro': 'Outro'
        };

         const tipoVeiculo = document.getElementById('tipo-automovel').value;
        document.getElementById('review-tipo-veiculo').textContent = tipoVeiculoMap[tipoVeiculo] || tipoVeiculo;

        
        // Detalhes do automóvel
         // Detalhes do automóvel
        document.getElementById('review-tipo-veiculo').textContent = 
            document.getElementById('tipo-automovel').value;
        document.getElementById('review-marca-modelo').textContent = 
            `${document.getElementById('marca').value} ${document.getElementById('modelo').value}`;
        // Na função que preenche os dados de revisão, adicione:
document.getElementById('review-cidade').textContent = document.getElementById('cidade').value;
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
document.addEventListener('DOMContentLoaded', function() {
    // Delegation para os botões
    document.body.addEventListener('click', function(e) {
        if (e.target.classList.contains('next-step')) {
            e.preventDefault();
            nextStep();
        }
        
        if (e.target.classList.contains('prev-step')) {
            e.preventDefault();
            prevStep();
        }
    });
    
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

    // Preview de imagens
    imageInput.addEventListener('change', previewImages);

// Atualização do código JavaScript para criar anúncio
form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const user = auth.currentUser;
    if (!user) {
        alert('Você precisa estar logado para criar anúncio');
        return;
    }

    // Configuração do loading
    const loadingScreen = document.getElementById('loading-screen');
    const loadingText = document.getElementById('loading-text');
    
    // Mostrar loading com fade
    loadingText.textContent = btnImovel.checked 
        ? 'Salvando seu imóvel...' 
        : 'Salvando seu veículo...';
    loadingScreen.style.display = 'flex';
    setTimeout(() => loadingScreen.classList.add('show'), 10);
    loadingAnimation.play();
    
    // Desabilita o botão de submit
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    
    try {
        // Verificar se há imagens
        if (selectedFiles.length === 0) {
            // Esconder loading com fade
            loadingScreen.classList.remove('show');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                loadingAnimation.stop();
            }, 300);
            
            submitBtn.disabled = false;
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
            status: 'ativo',
            visualizacoes: 0, // Inicializa contador de visualizações
            contatos: [], // Array para armazenar contatos
            ultimaAtualizacao: new Date()
        };
        
        // Adicionar campos específicos
        if (btnImovel.checked) {
            // Campos básicos
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
            
            // Novos campos para imóveis
            formData.fiador = document.getElementById('fiador').value;
            formData.calcao = parseFloat(document.getElementById('calcao').value) || 0;
            formData.tipoCaucao = document.getElementById('tipo-caucao').value;
            
            // Upload de imagens e salvar no Firestore
            const imageUrls = await uploadImages(selectedFiles, 'imoveis', user.uid);
            formData.imagens = imageUrls;
            
            await addDoc(collection(db, 'imoveis'), formData);
        } else {
            // Campos para automóveis
            formData.tipo = document.getElementById('tipo-automovel').value;
            formData.cidade = document.getElementById('cidade').value; // Novo campo

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
        window.location.href = 'perfil.html#meus-anuncios';
        
    } catch (error) {
        console.error('Erro ao criar anúncio:', error);
        alert('Erro ao criar anúncio. Por favor, tente novamente.');
    } finally {
        // Esconder loading com fade
        loadingScreen.classList.remove('show');
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            loadingAnimation.stop();
            submitBtn.disabled = false;
        }, 300);
    }
});

// Função para registrar visualizações
async function registrarVisualizacao(anuncioId, tipo) {
    try {
        const docRef = doc(db, tipo, anuncioId);
        await updateDoc(docRef, {
            visualizacoes: increment(1),
            ultimaVisualizacao: new Date()
        });
    } catch (error) {
        console.error("Erro ao registrar visualização:", error);
    }
}

// Função para registrar contato
async function registrarContato(anuncioId, tipo, contatoData) {
    try {
        const docRef = doc(db, tipo, anuncioId);
        await updateDoc(docRef, {
            contatos: arrayUnion({
                ...contatoData,
                data: new Date(),
                status: 'novo'
            }),
            ultimoContato: new Date()
        });
    } catch (error) {
        console.error("Erro ao registrar contato:", error);
    }
}


// Inicialização
showStep(0);
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
