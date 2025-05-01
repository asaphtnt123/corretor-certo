// Importações do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore,
    doc,
    getDoc,
    updateDoc,
    arrayUnion,
    arrayRemove,
     increment
     
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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
const auth = getAuth(app);

// Elementos da UI com verificações de existência
function getElementSafe(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.error(`Elemento com ID ${id} não encontrado`);
    }
    return element;
}

const elements = {
    conteudoDetalhes: getElementSafe('conteudo-detalhes'),
    title: getElementSafe('detailTitle'),
    price: getElementSafe('detailPrice'),
    location: getElementSafe('detailLocation'),
    area: getElementSafe('detailArea'),
    bedrooms: getElementSafe('detailBedrooms'),
    bathrooms: getElementSafe('detailBathrooms'),
    description: getElementSafe('detailDescription'),
    featuresGrid: getElementSafe('featuresGrid'),
    carouselInner: getElementSafe('carousel-inner'),
    thumbnailsContainer: getElementSafe('thumbnails-container'),
    btnWhatsApp: getElementSafe('btnWhatsApp'),
    btnFavorite: getElementSafe('btnFavorite'),
    btnReport: getElementSafe('btnReport'),
    agentName: getElementSafe('agentName'),
    agentType: getElementSafe('agentType')
};

// Variáveis globais
let currentAd = null;
let currentAdType = null;
let isFavorite = false;

// Função principal quando o DOM é carregado
document.addEventListener('DOMContentLoaded', async function() {
    // Verificar se o container principal existe
    if (!elements.conteudoDetalhes) {
        console.error('Elemento principal #conteudo-detalhes não encontrado');
        showError("Erro ao carregar a página. Recarregue e tente novamente.");
        return;
    }

    // Obter parâmetros da URL
    const urlParams = new URLSearchParams(window.location.search);
    const anuncioId = urlParams.get('id');
    const adType = urlParams.get('tipo'); // 'imovel' ou 'carro'
    
    console.log("ID do anúncio:", anuncioId, "Tipo:", adType);

    // Validações iniciais
    if (!anuncioId) {
        showError("Anúncio não especificado na URL");
        return;
    }

    if (adType !== 'imovel' && adType !== 'carro') {
        showError("Tipo de anúncio inválido. Deve ser 'imovel' ou 'carro'");
        return;
    }

    try {
        // Mostrar estado de carregamento
        showLoading();
        
        // Configurar timeout para evitar espera infinita
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Tempo excedido ao carregar o anúncio")), 10000)
        );

        // Buscar os dados do anúncio no Firestore
        const collectionName = adType === 'carro' ? 'automoveis' : 'imoveis';
        const docRef = doc(db, collectionName, anuncioId);

        // Race entre a busca do documento e o timeout
        const docSnap = await Promise.race([
            getDoc(docRef),
            timeoutPromise
        ]);

        if (!docSnap.exists()) {
            throw new Error('Anúncio não encontrado no banco de dados');
        }
        
        // Armazenar dados do anúncio
        currentAd = { 
            id: docSnap.id, 
            ...docSnap.data(),
            // Garantir que imagens existam ou usar padrão
            imagens: docSnap.data().imagens || ["images/default.jpg"]
        };
        currentAdType = adType;
        
        // Renderizar os detalhes do anúncio
        renderAdDetails();
        
        // Verificar se o usuário está logado e se o anúncio é favorito
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    await checkIfFavorite(user.uid, currentAd.id);
                    // Atualizar botão de WhatsApp com dados do usuário se disponível
                    if (currentAd.userId) {
                        await loadAgentInfo();
                    }
                } catch (error) {
                    console.error("Erro ao verificar favoritos:", error);
                }
            }
        });
        
    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
        
        // Mensagens de erro mais amigáveis
        let errorMessage = "Erro ao carregar o anúncio";
        if (error.message.includes("Tempo excedido")) {
            errorMessage = "O anúncio está demorando muito para carregar. Verifique sua conexão.";
        } else if (error.message.includes("Anúncio não encontrado")) {
            errorMessage = "O anúncio solicitado não foi encontrado. Pode ter sido removido.";
        }
        
        showError(errorMessage);
        
        // Opção para voltar à página anterior
        const backButton = document.createElement('a');
        backButton.href = "javascript:history.back()";
        backButton.className = "btn btn-primary mt-3";
        backButton.innerHTML = '<i class="fas fa-arrow-left me-2"></i> Voltar';
        elements.conteudoDetalhes.appendChild(backButton);
    }
});

function renderCarouselImages() {
    const images = currentAd.imagens || ["images/default.jpg"];
    return images.map((img, index) => `
        <div class="carousel-item ${index === 0 ? 'active' : ''}">
            <img src="${img}" class="d-block w-100" alt="Imagem do anúncio" 
                 style="height: 400px; object-fit: cover;"
                 onerror="this.src='images/default.jpg'">
        </div>
    `).join('');
}
function showLoading() {
    if (elements.conteudoDetalhes) {
        elements.conteudoDetalhes.innerHTML = `
            <div class="loading text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Carregando...</span>
                </div>
                <p class="mt-3">Carregando anúncio...</p>
            </div>
        `;
    }
}



  
// Função auxiliar para formatar o tipo de caução
function formatTipoCaucao(tipo) {
    const tipos = {
        'dinheiro': 'Dinheiro',
        'titulo': 'Título de Capitalização',
        'seguro': 'Seguro Fiança'
    };
    return tipos[tipo] || tipo;
}


function formatarData(data) {
    // Se for um timestamp do Firebase
    const date = data.toDate ? data.toDate() : new Date(data);
    
    const options = { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    return date.toLocaleDateString('pt-BR', options);
}

function renderCarouselControls() {
    return `
        <button class="carousel-control-prev" type="button" data-bs-target="#mainCarousel" data-bs-slide="prev">
            <span class="carousel-control-prev-icon" aria-hidden="true"></span>
            <span class="visually-hidden">Anterior</span>
        </button>
        <button class="carousel-control-next" type="button" data-bs-target="#mainCarousel" data-bs-slide="next">
            <span class="carousel-control-next-icon" aria-hidden="true"></span>
            <span class="visually-hidden">Próximo</span>
        </button>
    `;
}

function renderThumbnails() {
    const images = currentAd.imagens || [];
    return images.map((img, index) => `
        <img src="${img}" class="thumbnail ${index === 0 ? 'active' : ''}" 
             style="width: 60px; height: 60px; object-fit: cover; cursor: pointer;" 
             alt="Miniatura" data-bs-target="#mainCarousel" data-bs-slide-to="${index}">
    `).join('');
}

function getLocationText() {
    if (currentAdType === 'imovel') {
        return currentAd.bairro || 'Local não informado';
    } else {
        return `${currentAd.marca || ''} ${currentAd.modelo || ''}`.trim() || 'Veículo';
    }
}

function getAreaOrYearText() {
    if (currentAdType === 'imovel') {
        return currentAd.area ? `${currentAd.area} m²` : 'Área não informada';
    } else {
        return currentAd.ano || 'Ano não informado';
    }
}

function getBedroomsOrKmText() {
    if (currentAdType === 'imovel') {
        return currentAd.quartos || '0';
    } else {
        return currentAd.km ? `${currentAd.km.toLocaleString('pt-BR')} km` : 'KM não informada';
    }
}

// Função auxiliar para renderizar características
function renderFeatures() {
    let features = '';
    
    if (currentAdType === 'imovel') {
        features = `
            <div class="col-md-6">
                <p><i class="fas fa-bed"></i> ${currentAd.quartos || 0} Quartos</p>
                <p><i class="fas fa-bath"></i> ${currentAd.banheiros || 0} Banheiros</p>
                <p><i class="fas fa-car"></i> ${currentAd.garagem || 0} Vagas</p>
            </div>
            <div class="col-md-6">
                ${currentAd.mobiliado ? '<p><i class="fas fa-couch"></i> Mobiliado</p>' : ''}
                ${currentAd.aceitaAnimais ? '<p><i class="fas fa-paw"></i> Aceita animais</p>' : ''}
                ${currentAd.condominio ? '<p><i class="fas fa-building"></i> Condomínio</p>' : ''}
            </div>
        `;
    } else {
        features = `
            <div class="col-md-6">
                <p><i class="fas fa-car"></i> ${currentAd.marca || 'Não informada'}</p>
                <p><i class="fas fa-tag"></i> ${currentAd.modelo || 'Não informado'}</p>
                <p><i class="fas fa-palette"></i> ${currentAd.cor || 'Não informada'}</p>
            </div>
            <div class="col-md-6">
                <p><i class="fas fa-gas-pump"></i> ${currentAd.combustivel || 'Não informado'}</p>
                <p><i class="fas fa-cog"></i> ${currentAd.cambio || 'Não informado'}</p>
            </div>
        `;
    }
    
    return features;
}

// Função para carregar informações do anunciante
async function loadAgentInfo() {
    try {
        const userDoc = await getDoc(doc(db, "users", currentAd.userId));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Atualiza o objeto currentAd com os novos dados
            currentAd.userName = userData.name || 'Anunciante';
            currentAd.userType = userData.userType || 'Usuário';
            currentAd.userPhone = userData.phone || null;
            
            // Atualiza o DOM
            updateAgentInfo();
            
            // Atualiza o link do WhatsApp se houver telefone
            if (userData.phone) {
                updateWhatsAppLink(userData.phone);
            }
        }
    } catch (error) {
        console.error("Erro ao carregar informações do anunciante:", error);
    }
}

// Função auxiliar para atualizar as informações do anunciante no DOM
function updateAgentInfo() {
    const agentNameElement = document.getElementById('agentName');
    const agentTypeElement = document.getElementById('agentType');
    
    if (agentNameElement) agentNameElement.textContent = currentAd.userName;
    if (agentTypeElement) agentTypeElement.textContent = currentAd.userType;
    
    // Adiciona ou atualiza o telefone
    const phoneContainer = document.querySelector('.card-body .text-muted.mb-3');
    if (currentAd.userPhone) {
        if (!phoneContainer) {
            const agentTypeElement = document.getElementById('agentType');
            if (agentTypeElement) {
                const phoneElement = document.createElement('p');
                phoneElement.className = 'text-muted mb-3';
                phoneElement.innerHTML = `<i class="fas fa-phone"></i> ${currentAd.userPhone}`;
                agentTypeElement.after(phoneElement);
            }
        } else {
            phoneContainer.innerHTML = `<i class="fas fa-phone"></i> ${currentAd.userPhone}`;
        }
    }
}

// Função para atualizar o link do WhatsApp
function updateWhatsAppLink(phone) {
    const formattedPhone = formatPhoneForWhatsApp(phone);
    if (!formattedPhone) return;
    
    const whatsappBtn = document.getElementById('btnWhatsApp');
    if (whatsappBtn) {
        const message = `Olá ${currentAd.userName || ''}, vi seu anúncio "${currentAd.titulo || ''}" e gostaria de mais informações.`;
        whatsappBtn.href = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    }
}

// Função para formatar telefone para o WhatsApp
function formatPhoneForWhatsApp(phone) {
    if (!phone) return null;
    // Remove todos os caracteres não numéricos
    const cleaned = phone.replace(/\D/g, '');
    // Verifica se já tem código do país (se não tiver, adiciona 55)
    return cleaned.length === 11 ? `55${cleaned}` : cleaned;
}

// Função para registrar contato via WhatsApp
async function registrarContatoWhatsApp(anuncioId, tipo) {
    const user = auth.currentUser;
    
    const contatoData = {
        nome: user?.displayName || 'Anônimo',
        email: user?.email || '',
        telefone: user?.phone || '',
        meio: 'whatsapp',
        data: new Date(),
        status: 'novo',
        userId: user?.uid || 'anonimo'
    };

    try {
        const docRef = doc(db, tipo, anuncioId);
        
        // Atualização sem o campo ultimoContato
        await updateDoc(docRef, {
            contatos: arrayUnion(contatoData),
            // Mantemos apenas o incremento de visualizações
            visualizacoes: increment(1)
        });
        
        console.log("Contato via WhatsApp registrado com sucesso!");
    } catch (error) {
        console.error("Erro ao registrar contato do WhatsApp:", error);
        
        // Fallback: cria o array de contatos se não existir
        if (error.code === 'not-found') {
            await setDoc(docRef, {
                contatos: [contatoData],
                visualizacoes: 1
            }, { merge: true });
        }
    }
}




async function checkIfFavorite(userId, adId) {
    try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
            const favorites = userDoc.data().favoritos || [];
            isFavorite = favorites.includes(adId);
            updateFavoriteButton();
        }
    } catch (error) {
        console.error("Erro ao verificar favoritos:", error);
    }
}

function updateFavoriteButton() {
    const btnFavorite = getElementSafe('btnFavorite');
    if (!btnFavorite) return;

    if (isFavorite) {
        btnFavorite.innerHTML = '<i class="fas fa-heart me-2"></i> Remover dos Favoritos';
        btnFavorite.classList.remove('btn-outline-primary');
        btnFavorite.classList.add('btn-danger');
    } else {
        btnFavorite.innerHTML = '<i class="far fa-heart me-2"></i> Adicionar aos Favoritos';
        btnFavorite.classList.remove('btn-danger');
        btnFavorite.classList.add('btn-outline-primary');
    }
}

function setupElementsAfterRender() {
    // Configurar eventos dos botões
    const btnFavorite = getElementSafe('btnFavorite');
    const btnReport = getElementSafe('btnReport');
    
    if (btnFavorite) {
        btnFavorite.addEventListener('click', toggleFavorite);
    }
    
    if (btnReport) {
        btnReport.addEventListener('click', () => {
            showAlert("Funcionalidade de denúncia será implementada em breve", "info");
        });
    }
    
    // Configurar miniaturas do carrossel
    const thumbnails = document.querySelectorAll('.thumbnail');
    thumbnails.forEach(thumb => {
        thumb.addEventListener('click', function() {
            thumbnails.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

async function toggleFavorite() {
    const user = auth.currentUser;
    if (!user) {
        showAlert("Você precisa estar logado para adicionar favoritos", "error");
        return;
    }

    try {
        const userDocRef = doc(db, "users", user.uid);
        
        if (isFavorite) {
            await updateDoc(userDocRef, {
                favoritos: arrayRemove(currentAd.id)
            });
            isFavorite = false;
            showAlert("Anúncio removido dos favoritos", "success");
        } else {
            await updateDoc(userDocRef, {
                favoritos: arrayUnion(currentAd.id)
            });
            isFavorite = true;
            showAlert("Anúncio adicionado aos favoritos", "success");
        }
        
        updateFavoriteButton();
        
    } catch (error) {
        console.error("Erro ao atualizar favoritos:", error);
        showAlert("Erro ao atualizar favoritos", "error");
    }
}

function showError(message) {
    if (elements.conteudoDetalhes) {
        elements.conteudoDetalhes.innerHTML = `
            <div class="container py-5 text-center">
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>Erro:</strong> ${message}
                </div>
                <a href="index.html" class="btn btn-primary mt-3">
                    <i class="fas fa-arrow-left me-2"></i> Voltar à página inicial
                </a>
            </div>
        `;
    } else {
        document.body.innerHTML = `
            <div class="container py-5 text-center">
                <h2 class="text-danger">Erro</h2>
                <p>${message}</p>
                <a href="index.html" class="btn btn-primary">Voltar</a>
            </div>
        `;
    }
}

function showAlert(message, type = 'success') {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: type === 'error' ? 'Erro!' : type === 'info' ? 'Informação' : 'Sucesso!',
            text: message,
            icon: type,
            confirmButtonText: 'OK'
        });
    } else {
        alert(`${type.toUpperCase()}: ${message}`);
    }
}


// Chamada quando a página carrega
window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const anuncioId = urlParams.get('id');
    const tipo = urlParams.get('tipo') === 'carro' ? 'automoveis' : 'imoveis';
    
    if (anuncioId && tipo) {
        registrarVisualizacao(anuncioId, tipo);
    }
});



// Função para registrar visualizações (versão robusta)
async function registrarVisualizacao(anuncioId, tipo) {
    try {
        const user = auth.currentUser;
        if (!user) return; // Só registra se usuário estiver logado

        const docRef = doc(db, tipo, anuncioId);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) return;

        // Verifica se o usuário já visualizou hoje
        const hoje = new Date().toDateString();
        const visualizacoes = docSnap.data().visualizacoes || {};
        
        if (visualizacoes[user.uid] !== hoje) {
            await updateDoc(docRef, {
                [`visualizacoes.${user.uid}`]: hoje,
                totalVisualizacoes: increment(1),
                ultimaVisualizacao: serverTimestamp()
            });
            console.log(`Visualização registrada para ${tipo} ID: ${anuncioId}`);
            return true;
        }
        return false;
    } catch (error) {
        console.error("Erro ao registrar visualização:", error);
        return false;
    }
}

// Função para carregar detalhes do anúncio (atualizada)
async function loadAdDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const adId = urlParams.get('id');
    currentAdType = urlParams.get('tipo');
    
    if (!adId || !currentAdType) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const collectionName = currentAdType === 'carro' ? 'automoveis' : 'imoveis';
        const docRef = doc(db, collectionName, adId);
        
        // Usando onSnapshot para atualizações em tempo real
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                currentAd = { 
                    id: docSnap.id,
                    ...data,
                    // Calcula visualizações totais
                    visualizacoes: data.totalVisualizacoes || Object.keys(data.visualizacoes || {}).length
                };
                
                renderAdDetails();
                
                // Registra visualização após renderização
                setTimeout(() => registrarVisualizacao(adId, collectionName), 1000);
            } else {
                showError("Anúncio não encontrado");
            }
        });

        // Limpeza quando a página for fechada
        window.addEventListener('beforeunload', () => unsubscribe());
        
    } catch (error) {
        console.error("Erro ao carregar anúncio:", error);
        showError("Erro ao carregar anúncio");
    }
}

// Função para renderizar detalhes (atualizada)
function renderAdDetails() {
    if (!currentAd) return;
    
    const whatsappLink = `https://wa.me/55${currentAd.userPhone}?text=Olá, vi seu anúncio "${currentAd.titulo}" no Corretor Certo`;
    
    document.getElementById('app').innerHTML = `
        <div class="container py-4">
            <div class="row">
                <div class="col-lg-8">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h2>${currentAd.titulo || 'Sem título'}</h2>
                            <h4 class="text-primary my-3">
                                R$ ${currentAd.preco?.toLocaleString('pt-BR') || 'Preço não informado'}
                            </h4>
                            <p class="text-muted">
                                <i class="fas fa-calendar-alt me-2"></i>
                                Publicado em: ${formatarData(currentAd.dataPublicacao || currentAd.data)}
                            </p>
                        </div>
                        <div class="visualizacoes-badge">
                            <i class="fas fa-eye me-1"></i> 
                            ${currentAd.visualizacoes?.toLocaleString('pt-BR') || '0'} 
                            visualização${currentAd.visualizacoes !== 1 ? 's' : ''}
                        </div>
                    </div>
                    
                    <!-- Restante do seu template HTML aqui -->
                </div>
            </div>
        </div>
    `;
    
    // Configurar botões e interações
    setupInteractions();
}
// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    loadAdDetails();
});
