// Importações do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore,
    doc,
    getDoc,
    updateDoc,
    arrayUnion,
    arrayRemove
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
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
        return;
    }

   

    const urlParams = new URLSearchParams(window.location.search);
    const anuncioId = urlParams.get('id');
    console.log("ID do anúncio:", anuncioId);


    const adType = urlParams.get('tipo'); // 'imovel' ou 'carro'
    
    if (!anuncioId) {
  throw new Error("Anúncio não especificado");
}
    
    try {
        // Mostrar loading
        showLoading();
        
        // Buscar os dados do anúncio no Firestore
        const collectionName = adType === 'carro' ? 'automoveis' : 'imoveis';
        const docRef = doc(db, collectionName, adId);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            throw new Error('Anúncio não encontrado no banco de dados');
        }
        
        currentAd = { id: docSnap.id, ...docSnap.data() };
        currentAdType = adType;
        
        // Renderizar os detalhes
        renderAdDetails();
        
        // Verificar se o usuário está logado e se o anúncio é favorito
        onAuthStateChanged(auth, (user) => {
            if (user) {
                checkIfFavorite(user.uid, currentAd.id);
            }
        });
        
    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
        showError(error.message || "Erro ao carregar o anúncio");
    }
});

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

function renderAdDetails() {
    if (!elements.conteudoDetalhes) return;

    // Criar o HTML dos detalhes
    let html = `
        <div class="container py-4">
            <div class="row">
                <div class="col-lg-8">
                    <!-- Carrossel de Imagens -->
                    <div id="mainCarousel" class="carousel slide mb-4" data-bs-ride="carousel">
                        <div class="carousel-inner" id="carousel-inner">
                            ${renderCarouselImages()}
                        </div>
                        ${currentAd.imagens?.length > 1 ? renderCarouselControls() : ''}
                    </div>
                    
                    <!-- Miniaturas -->
                    ${currentAd.imagens?.length > 1 ? `
                    <div class="thumbnails-container d-flex flex-wrap gap-2 mb-4" id="thumbnails-container">
                        ${renderThumbnails()}
                    </div>
                    ` : ''}
                    
                    <!-- Descrição -->
                    <div class="card mb-4">
                        <div class="card-body">
                            <h2 id="detailTitle">${currentAd.titulo || 'Sem título'}</h2>
                            <h4 class="text-primary my-3" id="detailPrice">
                                R$ ${currentAd.preco?.toLocaleString('pt-BR') || 'Preço não informado'}
                            </h4>
                            <div class="row mb-3">
                                <div class="col-md-4">
                                    <p><strong>Localização:</strong> <span id="detailLocation">${getLocationText()}</span></p>
                                </div>
                                <div class="col-md-4">
                                    <p><strong>${currentAdType === 'imovel' ? 'Área' : 'Ano'}:</strong> <span id="detailArea">${getAreaOrYearText()}</span></p>
                                </div>
                                <div class="col-md-4">
                                    <p><strong>${currentAdType === 'imovel' ? 'Quartos' : 'KM'}:</strong> <span id="detailBedrooms">${getBedroomsOrKmText()}</span></p>
                                </div>
                            </div>
                            <div class="description" id="detailDescription">
                                <h5>Descrição</h5>
                                <p>${currentAd.descricao || 'Nenhuma descrição fornecida.'}</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Características -->
                    <div class="card mb-4">
                        <div class="card-body">
                            <h5 class="card-title">Características</h5>
                            <div class="row" id="featuresGrid">
                                ${renderFeatures()}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-lg-4">
                    <!-- Anunciante -->
                    <div class="card mb-4">
                        <div class="card-body text-center">
                            <div class="mb-3">
                                <i class="fas fa-user-circle fa-4x text-secondary"></i>
                            </div>
                            <h5 id="agentName">Carregando...</h5>
                            <p class="text-muted" id="agentType"></p>
                            <div class="d-grid gap-2">
                                <a href="#" class="btn btn-success" id="btnWhatsApp">
                                    <i class="fab fa-whatsapp me-2"></i> Contatar via WhatsApp
                                </a>
                                <button class="btn btn-outline-primary" id="btnFavorite">
                                    <i class="far fa-heart me-2"></i> Adicionar aos Favoritos
                                </button>
                                <button class="btn btn-outline-secondary" id="btnReport">
                                    <i class="fas fa-flag me-2"></i> Denunciar anúncio
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Inserir o HTML no container principal
    elements.conteudoDetalhes.innerHTML = html;

    // Configurar os elementos após renderização
    setupElementsAfterRender();
    loadAgentInfo();
}

function renderCarouselImages() {
    const images = currentAd.imagens || ["images/default.jpg"];
    return images.map((img, index) => `
        <div class="carousel-item ${index === 0 ? 'active' : ''}">
            <img src="${img}" class="d-block w-100" alt="Imagem do anúncio" style="height: 400px; object-fit: cover;">
        </div>
    `).join('');
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

function renderFeatures() {
    const features = currentAdType === 'imovel' ? [
        { icon: 'fa-home', title: 'Tipo', value: currentAd.tipo || 'Não informado' },
        { icon: 'fa-ruler-combined', title: 'Área', value: currentAd.area ? `${currentAd.area} m²` : 'Não informada' },
        { icon: 'fa-bed', title: 'Quartos', value: currentAd.quartos || 'Não informado' },
        { icon: 'fa-bath', title: 'Banheiros', value: currentAd.banheiros || 'Não informado' },
        { icon: 'fa-car', title: 'Vagas', value: currentAd.garagem || 'Não informado' },
        { icon: 'fa-couch', title: 'Mobiliado', value: currentAd.mobiliado ? 'Sim' : 'Não' },
        { icon: 'fa-building', title: 'Condomínio', value: currentAd.condominio ? `R$ ${currentAd.condominio.toLocaleString('pt-BR')}` : 'Não informado' },
        { icon: 'fa-file-invoice-dollar', title: 'IPTU', value: currentAd.iptu ? `R$ ${currentAd.iptu.toLocaleString('pt-BR')}` : 'Não informado' }
    ] : [
        { icon: 'fa-car', title: 'Marca', value: currentAd.marca || 'Não informada' },
        { icon: 'fa-tag', title: 'Modelo', value: currentAd.modelo || 'Não informado' },
        { icon: 'fa-calendar-alt', title: 'Ano', value: currentAd.ano || 'Não informado' },
        { icon: 'fa-tachometer-alt', title: 'Quilometragem', value: currentAd.km ? `${currentAd.km.toLocaleString('pt-BR')} km` : 'Não informada' },
        { icon: 'fa-palette', title: 'Cor', value: currentAd.cor || 'Não informada' },
        { icon: 'fa-cogs', title: 'Câmbio', value: currentAd.cambio || 'Não informado' },
        { icon: 'fa-gas-pump', title: 'Combustível', value: currentAd.combustivel || 'Não informado' }
    ];

    return features.map(feat => `
        <div class="col-md-6 mb-3">
            <div class="d-flex align-items-center">
                <i class="fas ${feat.icon} me-3 text-primary"></i>
                <div>
                    <small class="text-muted">${feat.title}</small>
                    <div class="fw-bold">${feat.value}</div>
                </div>
            </div>
        </div>
    `).join('');
}

async function loadAgentInfo() {
    if (!currentAd?.userId) return;

    try {
        const userDoc = await getDoc(doc(db, "users", currentAd.userId));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            
            const agentName = getElementSafe('agentName');
            const agentType = getElementSafe('agentType');
            const btnWhatsApp = getElementSafe('btnWhatsApp');
            
            if (agentName) agentName.textContent = userData.name || "Anunciante";
            if (agentType) agentType.textContent = userData.userType === 'comercial' ? 'Profissional' : 'Particular';
            if (btnWhatsApp && userData.phone) {
                btnWhatsApp.href = `https://wa.me/55${userData.phone.replace(/\D/g, '')}?text=Olá, vi seu anúncio e gostaria de mais informações`;
            }
        }
    } catch (error) {
        console.error("Erro ao carregar informações do anunciante:", error);
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
