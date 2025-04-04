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

// Elementos da UI
const elements = {
    title: document.getElementById('detailTitle'),
    price: document.getElementById('detailPrice'),
    location: document.getElementById('detailLocation'),
    area: document.getElementById('detailArea'),
    bedrooms: document.getElementById('detailBedrooms'),
    bathrooms: document.getElementById('detailBathrooms'),
    description: document.getElementById('detailDescription'),
    featuresGrid: document.getElementById('featuresGrid'),
    carouselInner: document.getElementById('carousel-inner'),
    thumbnailsContainer: document.getElementById('thumbnails-container'),
    btnWhatsApp: document.getElementById('btnWhatsApp'),
    btnFavorite: document.getElementById('btnFavorite'),
    btnReport: document.getElementById('btnReport'),
    agentName: document.getElementById('agentName'),
    agentType: document.getElementById('agentType')
};

// Variáveis globais
let currentAd = null;
let currentAdType = null;
let isFavorite = false;

// No script.js da página detalhes.html
document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const adId = urlParams.get('id');
    const adType = urlParams.get('tipo'); // 'imovel' ou 'carro'
    
    if (!adId || !adType) {
        document.getElementById('conteudo-detalhes').innerHTML = `
            <div class="error-message">
                <h3>Anúncio não encontrado</h3>
                <p>O link pode estar incorreto ou o anúncio foi removido.</p>
                <a href="index.html" class="btn-voltar">Voltar à página inicial</a>
            </div>
        `;
        return;
    }
    
    try {
        // Mostrar loading
        document.getElementById('conteudo-detalhes').innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Carregando anúncio...</p>
            </div>
        `;
        
        // Buscar os dados do anúncio no Firestore
        const docRef = doc(db, adType === 'carro' ? 'automoveis' : 'imoveis', adId);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            throw new Error('Anúncio não encontrado');
        }
        
        const adData = { id: docSnap.id, ...docSnap.data() };
        renderizarDetalhes(adData, adType === 'carro');
        
    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
        document.getElementById('conteudo-detalhes').innerHTML = `
            <div class="error-message">
                <h3>Erro ao carregar anúncio</h3>
                <p>${error.message}</p>
                <a href="index.html" class="btn-voltar">Voltar à página inicial</a>
            </div>
        `;
    }
});

function renderizarDetalhes(adData, isAutomovel) {
    const container = document.getElementById('conteudo-detalhes');
    
    // Montar o HTML dos detalhes conforme seu código existente
    container.innerHTML = `
        <div class="detalhes-container">
            <!-- Seu código existente de renderização -->
            ${isAutomovel ? renderDetalhesCarro(adData) : renderDetalhesImovel(adData)}
        </div>
    `;
    
    // Configurar o carrossel de imagens
    inicializarCarrossel(adData.imagens || []);
    
    // Configurar botão de favorito
    const favoriteBtn = document.getElementById('favorite-btn');
    if (favoriteBtn) {
        favoriteBtn.addEventListener('click', () => toggleFavorito(adData));
    }
}

// Função para carregar detalhes do anúncio
async function loadAdDetails(adId, adType) {
    try {
        const docRef = doc(db, adType === 'imovel' ? 'imoveis' : 'automoveis', adId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            throw new Error("Anúncio não encontrado");
        }

        currentAd = docSnap.data();
        currentAd.id = docSnap.id;
        
        // Preencher dados básicos
        fillBasicInfo(currentAd, adType);
        
        // Configurar galeria de imagens
        setupImageGallery(currentAd.imagens || ["images/default.jpg"]);
        
        // Preencher características
        fillFeatures(currentAd, adType);
        
        // Preencher informações do anunciante
        fillAgentInfo(currentAd.userId);

    } catch (error) {
        throw error;
    }
}

// Preencher informações básicas e detalhadas
function fillBasicInfo(ad, type) {
    // Informações básicas (comuns a ambos)
    elements.title.textContent = ad.titulo || "Sem título";
    elements.price.textContent = ad.preco ? `R$ ${ad.preco.toLocaleString('pt-BR')}` : "Preço não informado";
    
    // Descrição detalhada - vamos incluir todas as informações aqui
    let fullDescription = ad.descricao || "Nenhuma descrição fornecida.";
    fullDescription += "\n\n";

    if (type === 'imovel') {
        // Informações específicas de imóvel
        elements.location.textContent = ad.bairro || "Local não informado";
        elements.area.textContent = ad.area ? `${ad.area} m²` : "Área não informada";
        elements.bedrooms.textContent = ad.quartos || "0";
        elements.bathrooms.textContent = ad.banheiros || "0";

        // Adiciona todas as informações à descrição
        fullDescription += `Tipo: ${ad.tipo || 'Não informado'}\n`;
        fullDescription += `Área: ${ad.area || 'Não informada'} m²\n`;
        fullDescription += `Quartos: ${ad.quartos || 'Não informado'}\n`;
        fullDescription += `Banheiros: ${ad.banheiros || 'Não informado'}\n`;
        fullDescription += `Vagas na garagem: ${ad.vagas || 'Não informado'}\n`;
        fullDescription += `Mobiliado: ${ad.mobiliado ? 'Sim' : 'Não'}\n`;
        fullDescription += `Condomínio: ${ad.condominio ? `R$ ${ad.condominio.toLocaleString('pt-BR')}` : 'Não informado'}\n`;
        fullDescription += `IPTU: ${ad.iptu ? `R$ ${ad.iptu.toLocaleString('pt-BR')}` : 'Não informado'}\n`;
        fullDescription += `Andar: ${ad.andar || 'Não informado'}\n`;
        fullDescription += `Data de construção: ${ad.anoConstrucao || 'Não informado'}\n`;
        fullDescription += `Próximo a: ${ad.proximoA || 'Não informado'}\n`;
        fullDescription += `Características: ${ad.caracteristicas?.join(', ') || 'Não informado'}\n`;

    } else {
        // Informações específicas de automóvel
        elements.location.textContent = `${ad.marca || ''} ${ad.modelo || ''}`.trim() || "Veículo";
        elements.area.textContent = ad.ano || "Ano não informado";
        elements.bedrooms.textContent = ad.km ? `${ad.km.toLocaleString('pt-BR')} km` : "KM não informada";
        elements.bathrooms.textContent = ad.cor || "Cor não informada";

        // Adiciona todas as informações à descrição
        fullDescription += `Marca: ${ad.marca || 'Não informada'}\n`;
        fullDescription += `Modelo: ${ad.modelo || 'Não informado'}\n`;
        fullDescription += `Ano: ${ad.ano || 'Não informado'}\n`;
        fullDescription += `Quilometragem: ${ad.km ? `${ad.km.toLocaleString('pt-BR')} km` : 'Não informada'}\n`;
        fullDescription += `Cor: ${ad.cor || 'Não informada'}\n`;
        fullDescription += `Câmbio: ${ad.cambio || 'Não informado'}\n`;
        fullDescription += `Combustível: ${ad.combustivel || 'Não informado'}\n`;
        fullDescription += `Portas: ${ad.portas || 'Não informado'}\n`;
        fullDescription += `Final da placa: ${ad.finalPlaca || 'Não informado'}\n`;
        fullDescription += `Acessórios: ${ad.acessorios?.join(', ') || 'Não informado'}\n`;
        fullDescription += `Opcionais: ${ad.opcionais?.join(', ') || 'Não informado'}\n`;
        fullDescription += `Histórico: ${ad.historico || 'Não informado'}\n`;
    }

    // Adiciona informações comuns a ambos
    fullDescription += `\nData de publicação: ${new Date(ad.data?.toDate()).toLocaleDateString('pt-BR') || 'Não informada'}\n`;
    
    // Atualiza a descrição na página
    elements.description.textContent = fullDescription;
}
// Configurar galeria de imagens
function setupImageGallery(images) {
    // Limpar galeria existente
    elements.carouselInner.innerHTML = '';
    elements.thumbnailsContainer.innerHTML = '';

    // Adicionar imagens ao carrossel
    images.forEach((img, index) => {
        const carouselItem = document.createElement('div');
        carouselItem.className = `carousel-item ${index === 0 ? 'active' : ''}`;
        carouselItem.innerHTML = `
            <img src="${img}" class="d-block w-100" alt="Imagem do anúncio">
        `;
        elements.carouselInner.appendChild(carouselItem);

        // Adicionar miniaturas
        const thumbnail = document.createElement('img');
        thumbnail.src = img;
        thumbnail.className = `thumbnail ${index === 0 ? 'active' : ''}`;
        thumbnail.alt = "Miniatura";
        thumbnail.addEventListener('click', () => {
            // Atualizar carrossel principal
            const carousel = new bootstrap.Carousel(document.getElementById('mainCarousel'));
            carousel.to(index);
            
            // Atualizar miniaturas ativas
            document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
            thumbnail.classList.add('active');
        });
        
        elements.thumbnailsContainer.appendChild(thumbnail);
    });

    // Se não houver imagens, adicionar placeholder
    if (images.length === 0) {
        elements.carouselInner.innerHTML = `
            <div class="carousel-item active">
                <img src="images/default.jpg" class="d-block w-100" alt="Sem imagem">
            </div>
        `;
    }
}

// Preencher características em cards organizados
function fillFeatures(ad, type) {
    elements.featuresGrid.innerHTML = '';

    const features = type === 'imovel' ? [
        { icon: 'fa-home', title: 'Tipo', value: ad.tipo || 'Não informado' },
        { icon: 'fa-ruler-combined', title: 'Área', value: ad.area ? `${ad.area} m²` : 'Não informada' },
        { icon: 'fa-bed', title: 'Quartos', value: ad.quartos || 'Não informado' },
        { icon: 'fa-bath', title: 'Banheiros', value: ad.banheiros || 'Não informado' },
        { icon: 'fa-car', title: 'Vagas', value: ad.vagas || 'Não informado' },
        { icon: 'fa-couch', title: 'Mobiliado', value: ad.mobiliado ? 'Sim' : 'Não' },
        { icon: 'fa-building', title: 'Condomínio', value: ad.condominio ? `R$ ${ad.condominio.toLocaleString('pt-BR')}` : 'Não informado' },
        { icon: 'fa-file-invoice-dollar', title: 'IPTU', value: ad.iptu ? `R$ ${ad.iptu.toLocaleString('pt-BR')}` : 'Não informado' },
        { icon: 'fa-layer-group', title: 'Andar', value: ad.andar || 'Não informado' },
        { icon: 'fa-calendar', title: 'Ano Construção', value: ad.anoConstrucao || 'Não informado' },
        { icon: 'fa-map-marker-alt', title: 'Próximo a', value: ad.proximoA || 'Não informado' },
        { icon: 'fa-list', title: 'Características', value: ad.caracteristicas?.join(', ') || 'Não informado' }
    ] : [
        { icon: 'fa-car', title: 'Marca', value: ad.marca || 'Não informada' },
        { icon: 'fa-tag', title: 'Modelo', value: ad.modelo || 'Não informado' },
        { icon: 'fa-calendar-alt', title: 'Ano', value: ad.ano || 'Não informado' },
        { icon: 'fa-tachometer-alt', title: 'Quilometragem', value: ad.km ? `${ad.km.toLocaleString('pt-BR')} km` : 'Não informada' },
        { icon: 'fa-palette', title: 'Cor', value: ad.cor || 'Não informada' },
        { icon: 'fa-cogs', title: 'Câmbio', value: ad.cambio || 'Não informado' },
        { icon: 'fa-gas-pump', title: 'Combustível', value: ad.combustivel || 'Não informado' },
        { icon: 'fa-car-side', title: 'Portas', value: ad.portas || 'Não informado' },
        { icon: 'fa-plate', title: 'Final Placa', value: ad.finalPlaca || 'Não informado' },
        { icon: 'fa-tools', title: 'Acessórios', value: ad.acessorios?.join(', ') || 'Não informado' },
        { icon: 'fa-list-check', title: 'Opcionais', value: ad.opcionais?.join(', ') || 'Não informado' },
        { icon: 'fa-history', title: 'Histórico', value: ad.historico || 'Não informado' }
    ];

    features.forEach(feature => {
        const featureCard = document.createElement('div');
        featureCard.className = 'feature-card';
        
        // Se o valor for muito longo, exibe como bloco
        const isLongValue = feature.value && feature.value.length > 30;
        
        featureCard.innerHTML = `
            <div class="feature-icon"><i class="fas ${feature.icon}"></i></div>
            <div class="feature-title">${feature.title}</div>
            <div class="feature-value ${isLongValue ? 'long-value' : ''}">${feature.value}</div>
        `;
        elements.featuresGrid.appendChild(featureCard);
    });
}

// Preencher informações do anunciante
async function fillAgentInfo(userId) {
    try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            elements.agentName.textContent = userData.name || "Anunciante";
            elements.agentType.textContent = userData.userType === 'comercial' ? 'Profissional' : 'Particular';
            
            // Configurar link do WhatsApp
            if (userData.phone) {
                elements.btnWhatsApp.href = `https://wa.me/55${userData.phone.replace(/\D/g, '')}?text=Olá, vi seu anúncio no ConnectFamília e gostaria de mais informações`;
            }
        }
    } catch (error) {
        console.error("Erro ao carregar informações do anunciante:", error);
    }
}

// Verificar se o anúncio é favorito
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

// Atualizar botão de favorito
function updateFavoriteButton() {
    if (isFavorite) {
        elements.btnFavorite.innerHTML = '<i class="fas fa-heart me-2"></i> Remover dos Favoritos';
        elements.btnFavorite.classList.add('btn-danger');
        elements.btnFavorite.classList.remove('btn-outline-primary');
    } else {
        elements.btnFavorite.innerHTML = '<i class="far fa-heart me-2"></i> Adicionar aos Favoritos';
        elements.btnFavorite.classList.remove('btn-danger');
        elements.btnFavorite.classList.add('btn-outline-primary');
    }
}

// Configurar eventos
function setupEventListeners() {
    // Botão de favorito
    elements.btnFavorite.addEventListener('click', async () => {
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
    });

    // Botão de denúncia
    elements.btnReport.addEventListener('click', () => {
        showAlert("Funcionalidade de denúncia será implementada em breve", "info");
    });

    // Botão do WhatsApp
    elements.btnWhatsApp.addEventListener('click', (e) => {
        if (!elements.btnWhatsApp.href) {
            e.preventDefault();
            showAlert("Número de WhatsApp não disponível", "info");
        }
    });
}

// Função para mostrar erro
function showError(message) {
    document.querySelector('main').innerHTML = `
        <div class="error-container text-center py-5">
            <i class="fas fa-exclamation-triangle fa-4x text-danger mb-4"></i>
            <h2 class="mb-3">${message}</h2>
            <p class="mb-4">O anúncio solicitado não está disponível ou foi removido.</p>
            <a href="index.html" class="btn btn-primary">Voltar à página inicial</a>
        </div>
    `;
}

// Função para mostrar alertas
function showAlert(message, type = 'success') {
    Swal.fire({
        title: type === 'error' ? 'Erro!' : type === 'info' ? 'Informação' : 'Sucesso!',
        text: message,
        icon: type,
        confirmButtonText: 'OK',
        customClass: {
            popup: 'custom-swal'
        }
    });
}

// Exportar para uso global se necessário
window.loadAdDetails = loadAdDetails;
