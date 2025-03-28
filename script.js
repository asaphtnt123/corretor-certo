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

// ============== VARIÁVEIS GLOBAIS ==============
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
    
    card.querySelector('.carrossel-seta-esquerda').addEventListener('click', () => mudarImagem(carrosselId, -1));
    card.querySelector('.carrossel-seta-direita').addEventListener('click', () => mudarImagem(carrosselId, 1));
    card.querySelector('.btn-view-more').addEventListener('click', (e) => {
        e.preventDefault();
        openDetailsModal(dados, isAutomovel);
    });
    
    return card;
}

function openDetailsModal(adData, isAutomovel = false) {
    currentAdData = adData;
    const modal = document.getElementById('detalhesModal');
    const modalContent = document.getElementById('modalContent');
    
    // Fechar modal se já estiver aberto
    if(modal.style.display === 'block') {
        closeDetailsModal();
        return;
    }

    // Criar conteúdo do modal
    modalContent.innerHTML = `
        <span class="close-modal">&times;</span>
        <div class="modal-carrossel" id="modalCarrossel">
            ${(adData.imagens || ["images/default.jpg"]).map((img, index) => `
                <img src="${img}" alt="${adData.titulo}" class="modal-img" 
                     style="display: ${index === 0 ? 'block' : 'none'}">
            `).join('')}
        </div>
        <div class="modal-details">
            <h2>${adData.titulo || 'Sem título'}</h2>
            <div class="details-grid">
                ${isAutomovel ? `
                    <div class="detail-item">
                        <span class="detail-label">Marca</span>
                        <span class="detail-value">${adData.marca || 'Não informada'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Modelo</span>
                        <span class="detail-value">${adData.modelo || 'Não informado'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Ano</span>
                        <span class="detail-value">${adData.ano || 'Não informado'}</span>
                    </div>
                ` : `
                    <div class="detail-item">
                        <span class="detail-label">Bairro</span>
                        <span class="detail-value">${adData.bairro || 'Não informado'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Tipo</span>
                        <span class="detail-value">${adData.tipo || 'Não informado'}</span>
                    </div>
                `}
                <div class="detail-item price">
                    <span class="detail-label">Preço</span>
                    <span class="detail-value">R$ ${adData.preco?.toLocaleString('pt-BR') || 'Não informado'}</span>
                </div>
            </div>
            <div class="description-section">
                <h3 class="details-title">Descrição</h3>
                <p class="description-text">${adData.descricao || 'Nenhuma descrição fornecida.'}</p>
            </div>
            <button id="btnContato" class="btn-contato">Entrar em Contato</button>
        </div>
    `;

    // Adicionar eventos após criar o conteúdo
    document.querySelector('.close-modal').addEventListener('click', closeDetailsModal);
    document.getElementById('btnContato').addEventListener('click', () => {
        if (adData.userId) {
            alert('Redirecionando para o chat...');
        }
    });

    // Mostrar modal com animação
    document.body.style.overflow = 'hidden';
    modal.style.display = 'block';
    modal.classList.add('show');
}

function closeDetailsModal() {
    const modal = document.getElementById('detalhesModal');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }, 300); // Tempo da animação de fadeOut
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
        console.error("Erro ao buscar imóveis:", error);
        document.getElementById("resultados").innerHTML = `
            <div class="error-message">
                <p>Erro ao buscar imóveis.</p>
                <p>${error.message}</p>
            </div>
        `;
    }
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
            destaqueContainer.appendChild(criarCardComEvento(data, false));
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

// ============== FORMULÁRIOS ==============
document.getElementById("form-imovel")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const titulo = document.getElementById("titulo").value;
    const descricao = document.getElementById("descricao").value;
    const tipo = document.getElementById("tipo").value;
    const preco = parseFloat(document.getElementById("preco").value);
    const quartos = parseInt(document.getElementById("quartos").value);
    const banheiros = parseInt(document.getElementById("banheiros").value);
    const bairro = document.getElementById("bairro").value;
    const imagens = document.getElementById("imagens").files;

    if (imagens.length === 0) {
        alert("Por favor, selecione pelo menos uma imagem.");
        return;
    }

    const imagensURLs = await uploadImagens(imagens, "imoveis");

    if (imagensURLs.length === 0) {
        alert("Erro ao enviar imagens. Verifique sua conexão e tente novamente.");
        return;
    }

    try {
        await addDoc(collection(db, "imoveis"), {
            titulo,
            descricao,
            tipo,
            preco,
            quartos,
            banheiros,
            bairro,
            imagens: imagensURLs,
            userId: auth.currentUser.uid,
            data: new Date()
        });
        alert("Imóvel anunciado com sucesso!");
        window.location.href = "index.html";
    } catch (error) {
        console.error("Erro ao anunciar imóvel:", error);
        alert("Erro ao anunciar imóvel. Tente novamente.");
    }
});

document.getElementById("form-automovel")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const titulo = document.getElementById("titulo").value;
    const descricao = document.getElementById("descricao").value;
    const marca = document.getElementById("marca").value;
    const modelo = document.getElementById("modelo").value;
    const ano = parseInt(document.getElementById("ano").value); // Faltava este parêntese de fechamento
    const preco = parseFloat(document.getElementById("preco").value);
    const imagens = document.getElementById("imagens").files;

    const imagensURLs = await uploadImagens(imagens, "automoveis");

    try {
        await addDoc(collection(db, "automoveis"), {
            titulo,
            descricao,
            marca,
            modelo,
            ano,
            preco,
            imagens: imagensURLs,
            userId: auth.currentUser.uid,
            data: new Date()
        });
        alert("Automóvel anunciado com sucesso!");
        window.location.href = "index.html";
    } catch (error) {
        console.error("Erro ao anunciar automóvel:", error);
        alert("Erro ao anunciar automóvel. Tente novamente.");
    }
});

// ============== INTERFACE ==============
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

function toggleFields(tipo) {
    document.getElementById("resultados").innerHTML = "";
    document.getElementById("campo-imovel").style.display = tipo === "imovel" ? "block" : "none";
    document.getElementById("campo-carro").style.display = tipo === "carro" ? "block" : "none";
}

// ============== INICIALIZAÇÃO ==============
document.addEventListener("DOMContentLoaded", function() {
    // Configuração inicial
    setPersistence(auth, browserLocalPersistence)
        .then(() => console.log("Persistência ativada!"))
        .catch((error) => console.error("Erro na persistência:", error));

    // Carregar dados iniciais
    carregarImoveisDestaque();
    carregarLogo();
    preencherBairros();

    // Configuração do menu mobile
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            menuToggle.innerHTML = navMenu.classList.contains('active') ? '✕' : '☰';
        });
    }

    // Configuração do botão de login
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

    // Configuração do modal
    document.querySelector('.close-modal')?.addEventListener('click', closeDetailsModal);
    document.getElementById('detalhesModal')?.addEventListener('click', (e) => {
        if (e.target === document.getElementById('detalhesModal')) {
            closeDetailsModal();
        }
    });

    // Configuração da pesquisa
    document.getElementById("form-pesquisa")?.addEventListener("submit", function(e) {
        e.preventDefault();
        const tipo = document.getElementById("tipo").value;
        const precoMin = parseInt(document.getElementById("preco-min").value) || 0;
        const precoMax = parseInt(document.getElementById("preco-max").value) || 0;

        if (tipo === "imovel") {
            const bairro = document.getElementById("bairro").value;
            buscarCasas(precoMin, precoMax, bairro);
        } else if (tipo === "carro") {
            const marca = document.getElementById("marca").value;
            const modelo = document.getElementById("modelo").value;
            const ano = document.getElementById("ano").value;
            buscarCarros(precoMin, precoMax, marca, modelo, ano);
        }
    });

    // Configuração dos botões de tipo
    const tipoOptions = document.querySelectorAll(".tipo-option");
    const tipoInput = document.getElementById("tipo");
    if (tipoOptions.length > 0) {
        tipoOptions.forEach((option) => {
            option.addEventListener("click", function() {
                tipoOptions.forEach((opt) => opt.classList.remove("active"));
                this.classList.add("active");
                tipoInput.value = this.getAttribute("data-tipo");
                toggleFields(tipoInput.value);
            });
        });
        tipoOptions[0].classList.add("active");
        toggleFields("imovel");
    }

    // Configuração do botão de anunciar
    document.getElementById("btn-anunciar")?.addEventListener("click", () => {
        window.location.href = "anunciar.html";
    });

    // Configuração do formulário de seleção de tipo
    document.getElementById('form-anuncio')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const tipo = document.getElementById('tipo-anuncio').value;
        window.location.href = "anunciar.html?tipo=" + encodeURIComponent(tipo);
    });
});

// ============== EXPORTAÇÕES GLOBAIS ==============
window.mudarImagem = mudarImagem;
window.openDetailsModal = openDetailsModal;
window.closeDetailsModal = closeDetailsModal;
window.buscarCarros = buscarCarros;
window.buscarCasas = buscarCasas;
window.carregarImoveisDestaque = carregarImoveisDestaque;
window.preencherBairros = preencherBairros;
