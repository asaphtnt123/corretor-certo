// Importações do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore,
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

// Elementos da página
const anunciosContainer = document.getElementById('anuncios-container');
const propertyTypes = document.querySelectorAll('.property-type');
const filterBairro = document.getElementById('filter-bairro');
const filterTipo = document.getElementById('filter-tipo');
const filterQuartos = document.getElementById('filter-quartos');
const filterPreco = document.getElementById('filter-preco');
const btnFiltrar = document.getElementById('btn-filtrar');

// Variáveis globais
let currentType = 'todos';
let currentFilters = {
    bairro: '',
    tipo: '',
    quartos: '',
    preco: ''
};

// Carregar anúncios
async function loadAnuncios() {
    try {
        // Mostrar estado de carregamento
        anunciosContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Carregando...</span>
                </div>
                <p class="mt-3">Carregando anúncios...</p>
            </div>
        `;

        // Construir query baseada nos filtros
        let q = query(collection(db, "imoveis"));
        
        if (currentType !== 'todos') {
            q = query(q, where("tipo", "==", currentType));
        }
        
        if (currentFilters.bairro) {
            q = query(q, where("bairro", "==", currentFilters.bairro));
        }
        
        // Adicione outros filtros conforme necessário...

        const querySnapshot = await getDocs(q);
        
        // Limpar container
        anunciosContainer.innerHTML = '';
        
        if (querySnapshot.empty) {
            anunciosContainer.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-home fa-3x mb-3 text-muted"></i>
                    <h4>Nenhum anúncio encontrado</h4>
                    <p class="text-muted">Tente ajustar seus filtros de busca</p>
                </div>
            `;
            return;
        }
        
        // Processar resultados
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            data.id = doc.id;
            anunciosContainer.appendChild(createPropertyCard(data));
        });
        
        // Configurar eventos de clique
        setupCardClickEvents();
        
    } catch (error) {
        console.error("Erro ao carregar anúncios:", error);
        anunciosContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-exclamation-triangle fa-3x mb-3 text-danger"></i>
                <h4>Erro ao carregar anúncios</h4>
                <p class="text-muted">${error.message}</p>
                <button class="btn btn-primary mt-3" onclick="loadAnuncios()">
                    <i class="fas fa-sync-alt me-2"></i>Tentar novamente
                </button>
            </div>
        `;
    }
}

// Criar card de imóvel
function createPropertyCard(property) {
    const col = document.createElement('div');
    col.className = 'col-lg-4 col-md-6 mb-4';
    col.dataset.adId = property.id;
    
    // Determinar classe de destaque
    const highlightClass = property.destaque ? 'highlighted' : '';
    
    col.innerHTML = `
        <div class="property-card ${highlightClass}">
            ${property.status === 'novo' ? '<div class="card-badge">Novo</div>' : ''}
            <div class="card-image-container">
                <img src="${property.imagens?.[0] || 'https://via.placeholder.com/800x600'}" 
                     alt="${property.titulo}" class="card-image">
                <div class="image-overlay"></div>
            </div>
            <div class="card-content">
                <h3 class="card-title">${property.titulo || 'Imóvel sem título'}</h3>
                <p class="card-price">R$ ${property.preco?.toLocaleString('pt-BR') || 'Sob consulta'}</p>
                <div class="card-details">
                    <span><i class="fas fa-map-marker-alt"></i> ${property.bairro || 'Local não informado'}</span>
                    <span><i class="fas fa-expand"></i> ${property.area ? property.area + ' m²' : 'Área não informada'}</span>
                    <span><i class="fas fa-bed"></i> ${property.quartos || '0'} Quarto(s)</span>
                </div>
            </div>
            <div class="card-hover-effect">
                <button class="btn-view-more">
                    Ver Detalhes
                </button>
            </div>
        </div>
    `;
    
    // Adiciona evento de clique no botão "Ver Detalhes"
    const btn = col.querySelector('.btn-view-more');
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = `detalhes.html?id=${property.id}&tipo=imovel`;
    });
    
    return col;
}

// Configurar eventos de clique nos cards
function setupCardClickEvents() {
    document.querySelectorAll('.property-card').forEach(card => {
        card.addEventListener('click', function(e) {
            // Evitar abrir detalhes se clicar em botões dentro do card
            if (e.target.closest('button') || e.target.tagName === 'A') {
                return;
            }
            
            // Encontrar o ID do anúncio
            const adId = this.closest('[data-ad-id]')?.dataset.adId;
            if (adId) {
                window.location.href = `detalhes.html?id=${adId}&tipo=imovel`;
            }
        });
    });
}

// Event Listeners
propertyTypes.forEach(type => {
    type.addEventListener('click', () => {
        propertyTypes.forEach(t => t.classList.remove('active'));
        type.classList.add('active');
        currentType = type.dataset.type;
        loadAnuncios();
    });
});

btnFiltrar.addEventListener('click', () => {
    currentFilters = {
        bairro: filterBairro.value,
        tipo: filterTipo.value,
        quartos: filterQuartos.value,
        preco: filterPreco.value
    };
    loadAnuncios();
});

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    loadAnuncios();
    
    // Preencher filtros (simulado - em produção, busque do Firebase)
    const bairros = ['Centro', 'Jardins', 'Vila Olímpia', 'Moema', 'Pinheiros', 'Vila Mariana'];
    bairros.forEach(bairro => {
        const option = document.createElement('option');
        option.value = bairro;
        option.textContent = bairro;
        filterBairro.appendChild(option);
    });
});

// Função global para SweetAlert
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

// Exportar para uso global
window.loadAnuncios = loadAnuncios;
window.showAlert = showAlert;
