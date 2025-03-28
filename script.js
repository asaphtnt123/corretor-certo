// Importar funções do Firebase corretamente
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, setPersistence, browserLocalPersistence, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

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
const storage = getStorage(app);

// Ativar persistência da autenticação
setPersistence(auth, browserLocalPersistence)
  .then(() => console.log("Persistência ativada!"))
  .catch((error) => console.error("Erro na persistência:", error));

console.log("Firebase inicializado com sucesso!");

// Variável global para armazenar dados do anúncio atual
let currentAdData = null;

// ============== FUNÇÕES GLOBAIS ==============
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

function openDetailsModal(adData, isAutomovel = false) {
    currentAdData = adData;
    const modal = document.getElementById('detalhesModal');
    const modalContent = document.getElementById('modalContent');
    
    modalContent.innerHTML = `
        <div class="modal-carrossel" id="modalCarrossel">
            ${(adData.imagens || ["images/default.jpg"]).map((img, index) => `
                <img src="${img}" alt="${adData.titulo}" class="modal-img" style="display: ${index === 0 ? 'block' : 'none'}">
            `).join('')}
            ${(adData.imagens?.length > 1) ? `
                <button class="carrossel-seta carrossel-seta-esquerda" onclick="mudarImagem('modalCarrossel', -1)">&#10094;</button>
                <button class="carrossel-seta carrossel-seta-direita" onclick="mudarImagem('modalCarrossel', 1)">&#10095;</button>
            ` : ''}
        </div>
        <div class="modal-details">
            <h2>${adData.titulo || 'Sem título'}</h2>
            ${isAutomovel ? `
                <p><strong>Marca:</strong> ${adData.marca || 'Não informada'}</p>
                <p><strong>Modelo:</strong> ${adData.modelo || 'Não informado'}</p>
                <p><strong>Ano:</strong> ${adData.ano || 'Não informado'}</p>
                <p><strong>Quilometragem:</strong> ${adData.quilometragem || 'Não informada'} km</p>
                <p><strong>Combustível:</strong> ${adData.combustivel || 'Não informado'}</p>
            ` : `
                <p><strong>Bairro:</strong> ${adData.bairro || 'Não informado'}</p>
                <p><strong>Tipo:</strong> ${adData.tipo || 'Não informado'}</p>
                <p><strong>Área:</strong> ${adData.area || 'Não informada'} m²</p>
                <p><strong>Quartos:</strong> ${adData.quartos || 'Não informados'}</p>
                <p><strong>Banheiros:</strong> ${adData.banheiros || 'Não informados'}</p>
            `}
            <p><strong>Preço:</strong> R$ ${adData.preco?.toLocaleString('pt-BR') || 'Não informado'}</p>
            <p><strong>Descrição:</strong></p>
            <p>${adData.descricao || 'Nenhuma descrição fornecida.'}</p>
            <button id="btnContato" class="btn-contato">Entrar em Contato</button>
        </div>
    `;

    document.getElementById('btnContato')?.addEventListener('click', () => {
        if (adData.userId) {
            alert('Redirecionando para o chat com o vendedor...');
        }
    });

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeDetailsModal() {
    document.getElementById('detalhesModal').style.display = 'none';
    document.body.style.overflow = 'auto';
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
            const card = criarCardComEvento(data, true);
            resultadosContainer.appendChild(card);
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
            const card = criarCardComEvento(data, false);
            resultadosContainer.appendChild(card);
        });

    } catch (error) {
        console.error("Erro ao buscar imóveis:", error);
        document.getElementById("resultados").innerHTML = `
            <div class="error-message">
                <p>Erro ao buscar imóveis.</p>
                <p>${error.message}</p>
            </div>
        `;
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

// ============== FUNÇÕES DE CARREGAMENTO ==============
async function carregarImoveisDestaque() {
    try {
        const destaqueRef = collection(db, "imoveis");
        const destaqueQuery = query(destaqueRef, where("destaque", "==", true));
        const querySnapshot = await getDocs(destaqueQuery);

        const destaqueContainer = document.getElementById("destaqueContainer");
        destaqueContainer.innerHTML = '';

        if (querySnapshot.empty) {
            console.log("Nenhum imóvel em destaque encontrado.");
            return;
        }

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

async function carregarLogo() {
    try {
        const logoCollection = collection(db, "LOGO");
        const querySnapshot = await getDocs(logoCollection);

        if (!querySnapshot.empty) {
            const primeiroLogo = querySnapshot.docs[0].data();
            document.getElementById('logoContainer').innerHTML = `
                <img src="${primeiroLogo.imgLogo}" alt="Logo" class="logo-img">
            `;
        }
    } catch (error) {
        console.error("Erro ao carregar logo:", error);
    }
}

// ============== FUNÇÕES DE UPLOAD ==============
async function uploadImagens(imagens, tipo) {
    if (!auth.currentUser) {
        alert("Você precisa estar logado para fazer upload de imagens.");
        return [];
    }

    const userId = auth.currentUser.uid;
    const urls = [];

    for (let file of imagens) {
        try {
            const fileName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
            const storageRef = ref(storage, `${tipo}/${userId}/${fileName}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            urls.push(downloadURL);
        } catch (error) {
            console.error("Erro ao fazer upload da imagem:", error);
            alert("Erro ao enviar a imagem. Verifique as permissões do Firebase Storage.");
        }
    }

    return urls;
}

// ============== EVENT LISTENERS ==============
document.addEventListener("DOMContentLoaded", function() {
    // Carregar dados iniciais
    carregarImoveisDestaque();
    carregarLogo();
    preencherBairros();

    // Event Listeners do modal
    document.querySelector('.close-modal')?.addEventListener('click', closeDetailsModal);
    document.getElementById('detalhesModal')?.addEventListener('click', (e) => {
        if (e.target === document.getElementById('detalhesModal')) {
            closeDetailsModal();
        }
    });

    // Event Listeners de formulários
    document.getElementById('form-pesquisa')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const tipo = document.getElementById('tipo').value;
        const precoMin = parseInt(document.getElementById('preco-min').value) || 0;
        const precoMax = parseInt(document.getElementById('preco-max').value) || 0;

        if (tipo === 'imovel') {
            const bairro = document.getElementById('bairro').value;
            buscarCasas(precoMin, precoMax, bairro);
        } else if (tipo === 'carro') {
            const marca = document.getElementById('marca').value;
            const modelo = document.getElementById('modelo').value;
            const ano = document.getElementById('ano').value;
            buscarCarros(precoMin, precoMax, marca, modelo, ano);
        }
    });

    // Outros listeners...
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            menuToggle.innerHTML = navMenu.classList.contains('active') ? '✕' : '☰';
        });
    }

    // Login button
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        onAuthStateChanged(auth, (user) => {
            loginBtn.innerHTML = user 
                ? `<p>${user.displayName || "Meu Perfil"}</p>`
                : `<p>Login / Cadastro</p>`;
            loginBtn.href = user ? "perfil.html" : "login.html";
        });

        loginBtn.addEventListener('click', (e) => {
            if (!auth.currentUser) {
                e.preventDefault();
                window.location.href = "login.html";
            }
        });
    }
});

// ============== FUNÇÕES AUXILIARES ==============
function preencherBairros() {
    const bairros = [
        'Boa Vista', 'Centro', 'Chácara Freitas', 'Chácara Santa Fé',
        // ... lista completa de bairros ...
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

// ============== EXPORTAÇÕES GLOBAIS ==============
window.mudarImagem = mudarImagem;
window.openDetailsModal = openDetailsModal;
window.closeDetailsModal = closeDetailsModal;
window.buscarCarros = buscarCarros;
window.buscarCasas = buscarCasas;
window.carregarImoveisDestaque = carregarImoveisDestaque;
window.preencherBairros = preencherBairros;
