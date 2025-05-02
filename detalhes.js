// Importações do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore,
    doc,
    getDoc,
    updateDoc,
    arrayUnion,
    arrayRemove,
     increment,
    serverTimestamp
     
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

function renderAdDetails() {
    if (!elements.conteudoDetalhes) return;

    // Verifica se é aluguel e prepara os campos específicos
    const isAluguel = currentAd.negociacao === 'aluguel';
    const aluguelFields = isAluguel ? `
        <div class="row mb-3">
            <div class="col-md-4">
                <p><strong>Fiador:</strong> <span>${currentAd.fiador || 'Não informado'}</span></p>
            </div>
            <div class="col-md-4">
                <p><strong>Calção:</strong> <span>${currentAd.calcao ? 'R$ ' + currentAd.calcao.toLocaleString('pt-BR') : 'Não informado'}</span></p>
            </div>
            <div class="col-md-4">
                <p><strong>Tipo Caução:</strong> <span>${formatTipoCaucao(currentAd.tipoCaucao) || 'Não informado'}</span></p>
            </div>
        </div>
    ` : '';

    // Formata o telefone para o link do WhatsApp
    const formatPhoneForWhatsApp = (phone) => {
        if (!phone) return null;
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length === 11 ? `55${cleaned}` : cleaned;
    };

    // Prepara o link do WhatsApp
    const whatsappNumber = formatPhoneForWhatsApp(currentAd.userPhone) || '5564679464949';
    const whatsappMessage = `Olá ${currentAd.userName || ''}, vi seu anúncio "${currentAd.titulo || ''}" e gostaria de mais informações.`;
    const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

    // Função para obter o texto de localização corretamente
    const getLocationText = () => {
        if (currentAdType === 'imovel') {
            return `
                ${currentAd.bairro || 'Bairro não informado'}, 
                ${currentAd.cidade || 'Cidade não informada'} - 
                ${currentAd.estado || 'Estado não informado'}
            `;
        } else {
            // Para automóveis, mostra apenas cidade/estado se existir
            return currentAd.cidade ? 
                `${currentAd.cidade}${currentAd.estado ? ' - ' + currentAd.estado : ''}` : 
                'Localização não informada';
        }
    };

    // Criar o HTML dos detalhes
    let html = `
        <div class="container py-4">
    <div class="row">
        <div class="col-lg-8">
            <!-- Cabeçalho com título, preço e visualizações -->
            <div class="d-flex justify-content-between align-items-center mb-4">
    <div>
        <h2 id="detailTitle">${currentAd.titulo || 'Sem título'}</h2>
        <h4 class="text-primary my-3" id="detailPrice">
            R$ ${currentAd.preco?.toLocaleString('pt-BR') || 'Preço não informado'}
        </h4>
        <p class="text-muted">
            <i class="fas fa-calendar-alt me-2"></i>
            Publicado em: ${currentAd.data ? formatarData(currentAd.data) : 'Data não informada'}
        </p>
    </div>
    <div class="visualizacoes-badge bg-primary text-white p-2 rounded">
    <i class="fas fa-eye me-1"></i> 
    <span id="visualizacoes-count">
        ${currentAd.totalVisualizacoes || Object.keys(currentAd.visualizacoes || {}).length || 0}
    </span> 
    visualização${(currentAd.totalVisualizacoes || Object.keys(currentAd.visualizacoes || {}).length || 0) !== 1 ? 's' : ''}
</div>
</div>
            
            <!-- Restante do código permanece igual -->
            <div id="mainCarousel" class="carousel slide mb-4" data-bs-ride="carousel">
                <div class="carousel-inner" id="carousel-inner">
                    ${renderCarouselImages()}
                </div>
                ${currentAd.imagens?.length > 1 ? renderCarouselControls() : ''}
            </div>
            
            ${currentAd.imagens?.length > 1 ? `
            <div class="thumbnails-container d-flex flex-wrap gap-2 mb-4" id="thumbnails-container">
                ${renderThumbnails()}
            </div>
            ` : ''}
            
            <div class="card mb-4">
                <div class="card-body">
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
                    
                    ${aluguelFields}
                    
                    <div class="description" id="detailDescription">
                        <h5>Descrição</h5>
                        <p>${currentAd.descricao || 'Nenhuma descrição fornecida.'}</p>
                    </div>
                </div>
            </div>
            
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
            <div class="card mb-4">
                <div class="card-body text-center">
                    <div class="mb-3">
                        <i class="fas fa-user-circle fa-4x text-secondary"></i>
                    </div>
                    <h5 id="agentName">${currentAd.userName || 'Anunciante'}</h5>
                    <p class="text-muted" id="agentType">${currentAd.userType || 'Usuário'}</p>
                    ${currentAd.userPhone ? `<p class="text-muted mb-3"><i class="fas fa-phone"></i> ${currentAd.userPhone}</p>` : ''}
                    <div class="d-grid gap-2">
    <a href="${whatsappLink}" class="btn btn-success" id="btnWhatsApp" target="_blank">
        <i class="fab fa-whatsapp me-2"></i> Contatar via WhatsApp
    </a>
    <button class="btn ${isFavorite ? 'btn-danger' : 'btn-outline-primary'}" id="btnFavorite">
        <i class="${isFavorite ? 'fas' : 'far'} fa-heart me-2"></i> ${isFavorite ? 'Remover dos' : 'Adicionar aos'} Favoritos
    </button>
    <!-- Botão de Compartilhamento no Facebook -->
    <button class="btn btn-primary" id="shareFacebookBtn">
        <i class="fab fa-facebook-f me-2"></i> Compartilhar
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
    
    // Carrega as informações do usuário se não estiverem disponíveis
    if (!currentAd.userName && currentAd.userId) {
        loadAgentInfo();
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
            imagens: docSnap.data().imagens || ["images/default.jpg"],
            // Garantir que visualizações seja um número
            visualizacoes: Number(docSnap.data().visualizacoes) || 0
        };
        currentAdType = adType;
        
        // Registrar visualização (com pequeno delay para não atrapalhar carregamento)
        setTimeout(async () => {
            try {
                await registrarVisualizacao(anuncioId, collectionName);
                
                // Atualizar contador após registro
                const updatedDoc = await getDoc(docRef);
                if (updatedDoc.exists()) {
                    const updatedViews = Number(updatedDoc.data().visualizacoes) || 0;
                    const counter = document.getElementById('visualizacoes-count');
                    if (counter) {
                        counter.textContent = updatedViews.toLocaleString('pt-BR');
                    }
                }
            } catch (error) {
                console.error("Erro ao registrar visualização:", error);
            }
        }, 500);
        
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

// Função para registrar visualizações (adicione esta função se não existir)
async function registrarVisualizacao(anuncioId, collectionName) {
    try {
        const docRef = doc(db, collectionName, anuncioId);
        
        // Atualização atômica garantida
        await updateDoc(docRef, {
            visualizacoes: increment(1),
            ultimaVisualizacao: serverTimestamp()
        });
        
        console.log(`Visualização registrada para ${collectionName}/${anuncioId}`);
        return true;
    } catch (error) {
        console.error("Erro ao registrar visualização:", error);
        
        // Fallback para caso o campo não exista
        if (error.code === 'not-found') {
            try {
                await setDoc(docRef, {
                    visualizacoes: 1,
                    ultimaVisualizacao: serverTimestamp()
                }, { merge: true });
                return true;
            } catch (fallbackError) {
                console.error("Erro no fallback de visualização:", fallbackError);
            }
        }
        return false;
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
      title: type === 'error' ? 'Erro!' : 'Sucesso!',
      text: message,
      icon: type,
      confirmButtonText: 'OK'
    });
  } else {
    alert(`${type.toUpperCase()}: ${message}`);
  }
}


window.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const anuncioId = urlParams.get('id');
    const tipo = urlParams.get('tipo') === 'carro' ? 'automoveis' : 'imoveis';
    
    if (anuncioId && tipo) {
        // Adicione um pequeno delay para garantir que a página carregue
        setTimeout(async () => {
            await registrarVisualizacao(anuncioId, tipo);
        }, 1000);
    }
});

function setupFacebookShare() {
    // Cria um evento delegado para o botão (funciona mesmo se o botão for criado depois)
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'shareFacebookBtn') {
            shareOnFacebook();
        }
        
        // Também funciona se clicar em elementos dentro do botão
        if (e.target && e.target.closest('#shareFacebookBtn')) {
            shareOnFacebook();
        }
    });
}

function shareOnFacebook() {
    try {
        // Pega os dados do anúncio
        const titulo = currentAd?.titulo || 'Ótimo anúncio no Corretor Certo';
        const preco = currentAd?.preco ? `R$ ${currentAd.preco.toLocaleString('pt-BR')}` : 'Preço a consultar';
        const localizacao = currentAd?.bairro || currentAd?.cidade || '';
        const tipoAnuncio = currentAdType === 'imovel' ? 'Imóvel' : 'Veículo';
        
        // Pega a primeira imagem do anúncio (ou imagem padrão)
        const imagem = currentAd?.imagens?.[0] || 'https://corretorcerto.netlify.app/images/logo-social.jpg';
        
        // Texto profissional para compartilhamento
        const texto = `🏘️ ${tipoAnuncio} à ${currentAd?.negociacao === 'venda' ? 'Venda' : 'Aluguel'}\n✍️ ${titulo}\n💵 ${preco}\n📍 ${localizacao}\n\n🔍 Encontrei no Corretor Certo - Plataforma especializada em ${tipoAnuncio === 'Imóvel' ? 'imóveis' : 'veículos'}!`;
        
        // URL completa para compartilhamento
        const urlCompartilhamento = window.location.href;
        
        // Abre o diálogo de compartilhamento com todos os parâmetros
        window.open(
            `https://www.facebook.com/dialog/share?` +
            `app_id=2676543169456090` +  // App ID genérico para compartilhamento básico
            `&display=popup` +
            `&href=${encodeURIComponent(urlCompartilhamento)}` +
            `&quote=${encodeURIComponent(texto)}` +
            `&picture=${encodeURIComponent(imagem)}` +
            `&redirect_uri=https://corretorcerto.netlify.app`,
            'fb-share-dialog',
            'width=600,height=500,top=100,left=100,toolbar=0,status=0'
        );

    } catch (error) {
        console.error('Erro ao compartilhar:', error);
        // Fallback simples
        window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`,
            'fb-share-dialog',
            'width=600,height=500'
        );
    }
}

// Inicializa o compartilhamento quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', setupFacebookShare);
