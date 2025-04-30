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
const vehicleTypes = document.querySelectorAll('.vehicle-type');
const filterMarca = document.getElementById('filter-marca');
const filterModelo = document.getElementById('filter-modelo');
const filterAno = document.getElementById('filter-ano');
const filterPreco = document.getElementById('filter-preco');

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
// Modifique a função loadAnuncios para lidar melhor com os filtros
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
        
        // Aplicar filtro de tipo
        if (currentType !== 'todos') {
            q = query(q, where("tipo", "==", currentType));
        }
        
        // Aplicar filtro de marca (com tratamento de string)
        if (currentFilters.marca && currentFilters.marca.trim() !== '') {
            q = query(q, where("marca", "==", currentFilters.marca.trim()));
        }
        
        // Aplicar filtro de modelo (com tratamento de string)
        if (currentFilters.modelo && currentFilters.modelo.trim() !== '') {
            q = query(q, where("modelo", "==", currentFilters.modelo.trim()));
        }
        
        // Aplicar filtro de ano
        if (currentFilters.ano && currentFilters.ano.trim() !== '') {
            // Converter para número se necessário
            const ano = isNaN(currentFilters.ano) ? currentFilters.ano : Number(currentFilters.ano);
            q = query(q, where("ano", "==", ano));
        }
        
        // Aplicar filtro de preço
        if (currentFilters.preco && currentFilters.preco.trim() !== '') {
            let precoMin = 0;
            let precoMax = Infinity;
            
            switch(currentFilters.preco) {
                case 'Até R$ 20.000':
                    precoMax = 20000;
                    break;
                case 'R$ 20.000 - 50.000':
                    precoMin = 20000;
                    precoMax = 50000;
                    break;
                case 'R$ 50.000 - 100.000':
                    precoMin = 50000;
                    precoMax = 100000;
                    break;
                case 'Acima de R$ 100.000':
                    precoMin = 100000;
                    break;
            }
            
            q = query(q, where("preco", ">=", precoMin));
            if (precoMax !== Infinity) {
                q = query(q, where("preco", "<=", precoMax));
            }
        }

        const querySnapshot = await getDocs(q);
        console.log('Documentos encontrados:', querySnapshot.docs.map(doc => doc.data())); // Adicione este log

        // Limpar container
        anunciosContainer.innerHTML = '';
        
        if (querySnapshot.empty) {
            anunciosContainer.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-car fa-3x mb-3 text-muted"></i>
                    <h4>Nenhum anúncio encontrado</h4>
                    <p class="text-muted">Tente ajustar seus filtros de busca</p>
                    <button class="btn btn-primary mt-3" onclick="loadAnuncios()">
                        <i class="fas fa-sync-alt me-2"></i>Tentar novamente
                    </button>
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
// Adicione esta função para aplicar filtros automaticamente
// Modifique a função applyFilters para usar debounce
const applyFilters = debounce(() => {
    currentFilters = {
        marca: filterMarca.value,
        modelo: filterModelo.value,
        ano: filterAno.value,
        preco: filterPreco.value
    };
    loadAnuncios();
});


// Adicione esta função para carregar os modelos disponíveis
async function loadModelos() {
    try {
         filterModelo.innerHTML = '<option value="">Carregando modelos...</option>';
        filterModelo.disabled = true;
        
        const modelosSnapshot = await getDocs(collection(db, "automoveis"));
        const modelosSet = new Set();
        
        modelosSnapshot.forEach((doc) => {
            const modelo = doc.data().modelo;
            if (modelo) modelosSet.add(modelo);
        });

        // Reativar o dropdown
        filterModelo.disabled = false;
        // Ordenar modelos alfabeticamente
        const modelosOrdenados = Array.from(modelosSet).sort((a, b) => a.localeCompare(b));
        
        // Limpar e preencher o dropdown de modelos
        filterModelo.innerHTML = '<option value="">Modelo</option>';
        
        modelosOrdenados.forEach(modelo => {
            const option = document.createElement('option');
            option.value = modelo;
            option.textContent = modelo;
            filterModelo.appendChild(option);
        });
        
    } catch (error) {
        console.error("Erro ao carregar modelos:", error);
          filterModelo.innerHTML = '<option value="">Erro ao carregar modelos</option>';
        filterModelo.disabled = false;
    }
}

// Adicione esta função para carregar os anos disponíveis
async function loadAnos() {
    try {
        const anosSnapshot = await getDocs(collection(db, "automoveis"));
        const anosSet = new Set();
        
        anosSnapshot.forEach((doc) => {
            const ano = doc.data().ano;
            if (ano) anosSet.add(ano);
        });
        
        // Ordenar anos em ordem decrescente
        const anosOrdenados = Array.from(anosSet).sort((a, b) => b - a);
        
        // Limpar e preencher o dropdown de anos
        filterAno.innerHTML = '<option value="">Ano</option>';
        
        anosOrdenados.forEach(ano => {
            const option = document.createElement('option');
            option.value = ano;
            option.textContent = ano;
            filterAno.appendChild(option);
        });
        
    } catch (error) {
        console.error("Erro ao carregar anos:", error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadAnuncios();
    loadModelos();
    loadAnos();
    
    // Configurar eventos de change para todos os filtros
    filterMarca.addEventListener('change', () => {
        applyFilters();
        
        // Atualizar modelos quando a marca for alterada
        if (!filterMarca.value) {
            loadModelos();
            return;
        }
        
        try {
            const q = query(collection(db, "automoveis"), where("marca", "==", filterMarca.value));
            const querySnapshot = await getDocs(q);
            const modelosSet = new Set();
            
            querySnapshot.forEach((doc) => {
                const modelo = doc.data().modelo;
                if (modelo) modelosSet.add(modelo);
            });
            
            const modelosOrdenados = Array.from(modelosSet).sort((a, b) => a.localeCompare(b));
            
            filterModelo.innerHTML = '<option value="">Modelo</option>';
            
            modelosOrdenados.forEach(modelo => {
                const option = document.createElement('option');
                option.value = modelo;
                option.textContent = modelo;
                filterModelo.appendChild(option);
            });
            
            // Aplicar filtros após atualizar modelos
            applyFilters();
            
        } catch (error) {
            console.error("Erro ao filtrar modelos por marca:", error);
        }
    });
    
    // Adicionar event listeners para os outros filtros
    filterModelo.addEventListener('change', applyFilters);
    filterAno.addEventListener('change', applyFilters);
    filterPreco.addEventListener('change', applyFilters);
});

// Adicione um debounce para evitar muitas chamadas ao Firebase
function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}


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

// E adicione este código no seu JavaScript
document.getElementById('btn-limpar').addEventListener('click', () => {
    // Resetar filtros
    filterMarca.value = '';
    filterModelo.value = '';
    filterAno.value = '';
    filterPreco.value = '';
    
    // Resetar estado
    currentFilters = {
        marca: '',
        modelo: '',
        ano: '',
        preco: ''
    };
    
    // Recarregar modelos completos
    loadModelos();
    
    // Recarregar anúncios
    loadAnuncios();
});

// Exportar para uso global
window.loadAnuncios = loadAnuncios;
window.showAlert = showAlert;
