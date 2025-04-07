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

// Elementos da página
const anunciosContainer = document.getElementById('anuncios-container');
const vehicleTypes = document.querySelectorAll('.vehicle-type');
const filterMarca = document.getElementById('filter-marca');
const filterModelo = document.getElementById('filter-modelo');
const filterAno = document.getElementById('filter-ano');
const filterPreco = document.getElementById('filter-preco');
const btnFiltrar = document.getElementById('btn-filtrar');

// Variáveis globais
let currentType = 'todos';
let currentFilters = {
    marca: '',
    modelo: '',
    ano: '',
    preco: ''
};



// Adicione esta função no seu arquivo automoveis.js
function setupCardClickEvents() {
    document.querySelectorAll('.vehicle-card').forEach(card => {
        card.addEventListener('click', function(e) {
            // Evitar abrir detalhes se clicar em botões dentro do card
            if (e.target.closest('button') || e.target.tagName === 'A') {
                return;
            }
            
            // Encontrar o ID do anúncio
            const adId = this.closest('[data-ad-id]')?.dataset.adId;
            if (adId) {
                window.location.href = `detalhes.html?id=${adId}&tipo=carro`;
            }
        });
    });
}
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
        let q = query(collection(db, "automoveis"));
        
        if (currentType !== 'todos') {
            q = query(q, where("tipo", "==", currentType));
        }
        
        if (currentFilters.marca) {
            q = query(q, where("marca", "==", currentFilters.marca));
        }
        
        // Adicione outros filtros conforme necessário...

        const querySnapshot = await getDocs(q);
        
        // Limpar container
        anunciosContainer.innerHTML = '';
        
        if (querySnapshot.empty) {
            anunciosContainer.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-car fa-3x mb-3 text-muted"></i>
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
            anunciosContainer.appendChild(createVehicleCard(data));
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

function createVehicleCard(vehicle) {
    const col = document.createElement('div');
    col.className = 'col-lg-4 col-md-6 mb-4';
    col.dataset.adId = vehicle.id; // Adiciona o ID do anúncio
    
    col.innerHTML = `
        <div class="vehicle-card metal-card">
            ${vehicle.destaque ? '<div class="card-badge">Destaque</div>' : ''}
            <div class="card-image-container">
                <img src="${vehicle.imagens?.[0] || 'https://via.placeholder.com/800x600'}" 
                     alt="${vehicle.titulo}" class="card-image">
                <div class="image-overlay"></div>
            </div>
            <div class="card-content">
                <h3 class="card-title">${vehicle.titulo || 'Veículo sem título'}</h3>
                <p class="card-price">R$ ${vehicle.preco?.toLocaleString('pt-BR') || 'Sob consulta'}</p>
                <div class="card-details">
                    <span><i class="fas fa-calendar-alt"></i> ${vehicle.ano || 'Ano não informado'}</span>
                    <span><i class="fas fa-tachometer-alt"></i> ${vehicle.km ? vehicle.km.toLocaleString('pt-BR') + ' km' : 'KM não informada'}</span>
                    <span><i class="fas fa-gas-pump"></i> ${vehicle.combustivel || 'Combustível não informado'}</span>
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
        window.location.href = `detalhes.html?id=${vehicle.id}&tipo=carro`;
    });
    
    return col;
}
// Event Listeners
vehicleTypes.forEach(type => {
    type.addEventListener('click', () => {
        vehicleTypes.forEach(t => t.classList.remove('active'));
        type.classList.add('active');
        currentType = type.dataset.type;
        loadAnuncios();
    });
});

btnFiltrar.addEventListener('click', () => {
    currentFilters = {
        marca: filterMarca.value,
        modelo: filterModelo.value,
        ano: filterAno.value,
        preco: filterPreco.value
    };
    loadAnuncios();
});

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    loadAnuncios();
    
    // Preencher filtros (simulado - em produção, busque do Firebase)
    const marcas = ['Chevrolet', 'Ford', 'Volkswagen', 'Fiat', 'Toyota', 'Hyundai', 'Renault'];
    marcas.forEach(marca => {
        const option = document.createElement('option');
        option.value = marca;
        option.textContent = marca;
        filterMarca.appendChild(option);
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
