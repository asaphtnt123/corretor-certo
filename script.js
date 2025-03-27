// ============== CONFIGURAÇÃO DO FIREBASE ==============
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, setPersistence, browserLocalPersistence, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyA-7HOp-Ycvyf3b_03ev__8aJEwAbWSQZY",
  authDomain: "connectfamilia-312dc.firebaseapp.com",
  projectId: "connectfamilia-312dc",
  storageBucket: "connectfamilia-312dc.appspot.com",
  messagingSenderId: "797817838649",
  appId: "1:797817838649:web:1aa7c54abd97661f8d81e8",
  measurementId: "G-QKN9NFXZZQ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// ============== FUNÇÕES GLOBAIS ==============
let currentAdData = null;

function mudarImagem(carrosselId, direcao) {
    const carrossel = document.getElementById(carrosselId);
    const imagens = carrossel.querySelectorAll('.carrossel-img');
    let indexAtivo = -1;

    imagens.forEach((imagem, index) => {
        if (imagem.style.display === 'block') indexAtivo = index;
    });

    if (indexAtivo !== -1) {
        let novoIndex = indexAtivo + direcao;
        if (novoIndex < 0) novoIndex = imagens.length - 1;
        if (novoIndex >= imagens.length) novoIndex = 0;

        imagens[indexAtivo].style.display = 'none';
        imagens[novoIndex].style.display = 'block';
    }
}

function criarCardComEvento(dados, isAutomovel = false) {
    const card = document.createElement('div');
    card.className = 'card';
    
    const imagens = dados.imagens || ["images/default.jpg"];
    const carrosselId = `carrossel-${dados.id}`;
    
    card.innerHTML = `
        <div class="carrossel" id="${carrosselId}">
            <div class="carrossel-imagens">
                ${imagens.map((imagem, index) => `
                    <img src="${imagem}" alt="${dados.titulo}" class="carrossel-img" 
                         style="display: ${index === 0 ? 'block' : 'none'}" loading="lazy">
                `).join('')}
            </div>
            <button class="carrossel-seta carrossel-seta-esquerda">&#10094;</button>
            <button class="carrossel-seta carrossel-seta-direita">&#10095;</button>
        </div>
        <div class="card-content">
            <h4>${dados.titulo || 'Sem título'}</h4>
            ${isAutomovel ? `
                <p><strong>Marca:</strong> ${dados.marca || 'Não informada'}</p>
                <p><strong>Modelo:</strong> ${dados.modelo || 'Não informado'}</p>
                <p><strong>Ano:</strong> ${dados.ano || 'Não informado'}</p>
            ` : `
                <p><strong>Bairro:</strong> ${dados.bairro || 'Não informado'}</p>
                <p><strong>Tipo:</strong> ${dados.tipo || 'Não informado'}</p>
            `}
            <p><strong>Preço:</strong> R$ ${dados.preco?.toLocaleString('pt-BR') || 'Não informado'}</p>
            <a href="#" class="btn-view-more">Ver Mais</a>
        </div>
    `;
    
    // Event listeners
    card.querySelector('.carrossel-seta-esquerda').addEventListener('click', () => mudarImagem(carrosselId, -1));
    card.querySelector('.carrossel-seta-direita').addEventListener('click', () => mudarImagem(carrosselId, 1));
    card.querySelector('.btn-view-more').addEventListener('click', (e) => {
        e.preventDefault();
        openDetailsModal(dados, isAutomovel);
    });
    
    return card;
}

// ============== FUNÇÕES DE BUSCA ==============
async function buscarCarros(precoMin, precoMax, marca, modelo, ano) {
    try {
        const carrosRef = collection(db, "automoveis");
        let q = query(carrosRef);

        if (marca) q = query(q, where("marca", "==", marca));
        if (modelo) q = query(q, where("modelo", "==", modelo));
        if (ano) q = query(q, where("ano", "==", parseInt(ano)));
        if (precoMin) q = query(q, where("preco", ">=", precoMin));
        if (precoMax) q = query(q, where("preco", "<=", precoMax));

        const querySnapshot = await getDocs(q);
        const resultadosContainer = document.getElementById("resultados");
        resultadosContainer.innerHTML = querySnapshot.empty 
            ? "<p>Nenhum carro encontrado.</p>" 
            : "<h3>Resultados da Busca:</h3>";

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            data.id = doc.id;
            resultadosContainer.appendChild(criarCardComEvento(data, true));
        });

    } catch (error) {
        console.error("Erro ao buscar carros:", error);
        document.getElementById("resultados").innerHTML = `
            <div class="error-message">
                <p>Erro ao buscar carros.</p>
                <p>${error.message}</p>
            </div>
        `;
    }
}

async function buscarCasas(precoMin, precoMax, bairro) {
    try {
        bairro = bairro.toLowerCase();
        const casasRef = collection(db, "imoveis");
        let q = query(casasRef, where("bairro", "==", bairro));

        if (precoMin) q = query(q, where("preco", ">=", precoMin));
        if (precoMax) q = query(q, where("preco", "<=", precoMax));

        const querySnapshot = await getDocs(q);
        const resultadosContainer = document.getElementById("resultados");
        resultadosContainer.innerHTML = querySnapshot.empty 
            ? "<p>Nenhum imóvel encontrado.</p>" 
            : "<h3>Resultados da Busca:</h3>";

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            data.id = doc.id;
            resultadosContainer.appendChild(criarCardComEvento(data, false));
        });

    } catch (error) {
        console.error("Erro ao buscar casas:", error);
        document.getElementById("resultados").innerHTML = `
            <div class="error-message">
                <p>Erro ao buscar imóveis.</p>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// ============== MODAL DE DETALHES ==============
function openDetailsModal(adData, isAutomovel = false) {
    currentAdData = adData;
    const modal = document.getElementById('detalhesModal');
    const carrossel = document.getElementById('modalCarrossel');
    
    carrossel.innerHTML = '';
    const imagens = adData.imagens || ["images/default.jpg"];
    
    imagens.forEach((img, index) => {
        const imgElement = document.createElement('img');
        imgElement.src = img;
        imgElement.alt = adData.titulo;
        imgElement.style.display = index === 0 ? 'block' : 'none';
        imgElement.classList.add(index === 0 ? 'active' : '');
        carrossel.appendChild(imgElement);
    });
    
    // Preenchimento dos dados (similar ao anterior)
    // ... (implementação completa do modal) ...
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeDetailsModal() {
    document.getElementById('detalhesModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}



async function carregarImoveisDestaque() {
    try {
        const destaqueRef = collection(db, "imoveis");
        const destaqueQuery = query(destaqueRef, where("destaque", "==", true));
        const querySnapshot = await getDocs(destaqueQuery);

        if (querySnapshot.empty) {
            console.log("Nenhum imóvel em destaque encontrado.");
            return;
        }

        const destaqueContainer = document.getElementById("destaqueContainer");
        destaqueContainer.innerHTML = '';

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            data.id = doc.id;
            const card = criarCardComEvento(data, false);
            destaqueContainer.appendChild(card);
        });

    } catch (error) {
        console.error("Erro ao carregar destaques:", error);
        document.getElementById("destaqueContainer").innerHTML = `
            <p>Erro ao carregar destaques. Verifique suas permissões.</p>
        `;
    }
}


// ============== INICIALIZAÇÃO ==============
document.addEventListener("DOMContentLoaded", function() {
    // Configuração inicial
    setPersistence(auth, browserLocalPersistence)
        .then(() => console.log("Persistência ativada!"))
        .catch((error) => console.error("Erro na persistência:", error));

    // Carregar dados iniciais (agora com verificação)
    if (typeof carregarImoveisDestaque === 'function') {
        carregarImoveisDestaque();
    } else {
        console.error("Função carregarImoveisDestaque não encontrada");
    }

    if (typeof preencherBairros === 'function') {
        preencherBairros();
    }

    // Event Listeners
    document.querySelector('.close-modal').addEventListener('click', closeDetailsModal);
    document.getElementById('detalhesModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('detalhesModal')) {
            closeDetailsModal();
        }
    });

    document.getElementById('btnContato').addEventListener('click', () => {
        if (currentAdData?.userId) {
            alert('Redirecionando para o chat com o corretor...');
        }
    });

    // Outros listeners...
});



function preencherBairros() {
    const bairros = [
        'Boa Vista', 'Centro', 'Chácara Freitas', 
        // ... sua lista completa de bairros ...
    ];

    const datalist = document.getElementById('bairros');
    if (datalist) {
        bairros.forEach(bairro => {
            const option = document.createElement('option');
            option.value = bairro;
            datalist.appendChild(option);
        });
    }
}

// Não esqueça de exportar
window.preencherBairros = preencherBairros;



// ============== EXPORTAÇÕES GLOBAIS ==============
window.mudarImagem = mudarImagem;
window.openDetailsModal = openDetailsModal;
window.buscarCarros = buscarCarros;
window.buscarCasas = buscarCasas;
window.carregarImoveisDestaque = carregarImoveisDestaque;
