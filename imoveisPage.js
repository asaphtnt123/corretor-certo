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
const btnLimpar = document.getElementById('btn-limpar');
const filterNegociacao = document.getElementById('filter-negociacao');

// Variáveis globais
let currentType = 'todos';
let currentFilters = {
    bairro: '',
    tipo: '',
    quartos: '',
    preco: '',
    negociacao: ''
};

// Função debounce para evitar múltiplas chamadas
function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}

const applyFilters = debounce(() => {
    currentFilters = {
        bairro: filterBairro.value,
        tipo: filterTipo.value,
        quartos: filterQuartos.value,
        preco: filterPreco.value,
        negociacao: filterNegociacao.value
    };
    loadAnuncios();
});

// Configurar eventos de clique nos cards
function setupCardClickEvents() {
    document.querySelectorAll('.property-card').forEach(card => {
        card.addEventListener('click', function(e) {
            if (e.target.closest('button') || e.target.tagName === 'A') {
                return;
            }
            
            const adId = this.closest('[data-ad-id]')?.dataset.adId;
            if (adId) {
                window.location.href = `detalhes.html?id=${adId}&tipo=imovel`;
            }
        });
    });
}

// Carregar anúncios com filtros
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
        
        // Aplicar filtro de tipo
        if (currentType !== 'todos') {
            q = query(q, where("tipo", "==", currentType));
        }
        if (currentFilters.negociacao && currentFilters.negociacao.trim() !== '' && currentFilters.negociacao !== 'Negociação') {
    q = query(q, where("negociacao", "==", currentFilters.negociacao.trim()));
}
        // Aplicar filtro de bairro
        if (currentFilters.bairro && currentFilters.bairro.trim() !== '' && currentFilters.bairro !== 'Bairro') {
            q = query(q, where("bairro", "==", currentFilters.bairro.trim()));
        }
        
        // Aplicar filtro de tipo de imóvel
        if (currentFilters.tipo && currentFilters.tipo.trim() !== '' && currentFilters.tipo !== 'Tipo') {
            q = query(q, where("tipo", "==", currentFilters.tipo.trim()));
        }
        
        // Aplicar filtro de quartos
        if (currentFilters.quartos && currentFilters.quartos.trim() !== '' && currentFilters.quartos !== 'Quartos') {
            const minQuartos = parseInt(currentFilters.quartos);
            if (!isNaN(minQuartos)) {
                q = query(q, where("quartos", ">=", minQuartos));
            }
        }
        
        // Aplicar filtro de preço
        if (currentFilters.preco && currentFilters.preco.trim() !== '' && currentFilters.preco !== 'Preço') {
            let precoMin = 0;
            let precoMax = Infinity;
            
            switch(currentFilters.preco) {
                case 'Até R$ 300.000':
                    precoMax = 300000;
                    break;
                case 'R$ 300.000 - 600.000':
                    precoMin = 300000;
                    precoMax = 600000;
                    break;
                case 'R$ 600.000 - 1.000.000':
                    precoMin = 600000;
                    precoMax = 1000000;
                    break;
                case 'Acima de R$ 1.000.000':
                    precoMin = 1000000;
                    break;
            }
            
            q = query(q, where("preco", ">=", precoMin));
            if (precoMax !== Infinity) {
                q = query(q, where("preco", "<=", precoMax));
            }
        }

        const querySnapshot = await getDocs(q);
        console.log('Documentos encontrados:', querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })));

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
                     alt="${property.titulo || 'Imóvel'}" class="card-image">
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
    
    const btn = col.querySelector('.btn-view-more');
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = `detalhes.html?id=${property.id}&tipo=imovel`;
    });
    
    return col;
}

// Carregar todos os bairros disponíveis
async function loadBairros() {
    try {
        filterBairro.innerHTML = '<option value="">Bairro</option>';
        
        const bairrosSnapshot = await getDocs(collection(db, "imoveis"));
        const bairrosSet = new Set();
        
        bairrosSnapshot.forEach((doc) => {
            const bairro = doc.data().bairro;
            if (bairro) bairrosSet.add(bairro);
        });

        const bairrosOrdenados = Array.from(bairrosSet).sort((a, b) => a.localeCompare(b));
        
        bairrosOrdenados.forEach(bairro => {
            const option = document.createElement('option');
            option.value = bairro;
            option.textContent = bairro;
            filterBairro.appendChild(option);
        });
        
    } catch (error) {
        console.error("Erro ao carregar bairros:", error);
        filterBairro.innerHTML = '<option value="">Erro ao carregar</option>';
    }
}

// Carregar todos os tipos de imóvel disponíveis
async function loadTiposImovel() {
    try {
        filterTipo.innerHTML = '<option value="">Tipo</option>';
        
        const tiposSnapshot = await getDocs(collection(db, "imoveis"));
        const tiposSet = new Set();
        
        tiposSnapshot.forEach((doc) => {
            const tipo = doc.data().tipo;
            if (tipo) tiposSet.add(tipo);
        });

        const tiposOrdenados = Array.from(tiposSet).sort((a, b) => a.localeCompare(b));
        
        tiposOrdenados.forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo;
            option.textContent = tipo;
            filterTipo.appendChild(option);
        });
        
    } catch (error) {
        console.error("Erro ao carregar tipos:", error);
        filterTipo.innerHTML = '<option value="">Erro ao carregar</option>';
    }
}

// Event Listeners para tipos de imóvel
propertyTypes.forEach(type => {
    type.addEventListener('click', () => {
        propertyTypes.forEach(t => t.classList.remove('active'));
        type.classList.add('active');
        currentType = type.dataset.type;
        applyFilters();
    });
});

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    loadBairros();
    loadTiposImovel();
    loadAnuncios();
    
    // Eventos para os filtros
    filterBairro.addEventListener('change', applyFilters);
    filterTipo.addEventListener('change', applyFilters);
    filterQuartos.addEventListener('change', applyFilters);
    filterPreco.addEventListener('change', applyFilters);
    filterNegociacao.addEventListener('change', applyFilters);
});

// Função para limpar filtros
btnLimpar?.addEventListener('click', () => {
    // Resetar seleções
    filterBairro.value = '';
    filterTipo.value = '';
    filterQuartos.value = '';
    filterPreco.value = '';
    filterNegociacao.value = '';
    
    // Resetar tipo para 'todos'
    propertyTypes.forEach(t => t.classList.remove('active'));
    document.querySelector('.property-type[data-type="todos"]').classList.add('active');
    currentType = 'todos';
    
    // Recarregar anúncios sem filtros
    loadAnuncios();
});

// Adicione o event listener para o novo filtro


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
