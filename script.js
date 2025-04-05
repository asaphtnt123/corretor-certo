// ============== CONFIGURAÇÃO DO FIREBASE ==============
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore,
    doc,
    getDoc,
    updateDoc,
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";import { getAuth, setPersistence, browserLocalPersistence, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
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

function mudarImagem(carrosselId, direcao) {
    const carrossel = document.getElementById(carrosselId);
    if (!carrossel) return;
    
    const imagens = carrossel.querySelectorAll('.carrossel-img');
    let indexAtivo = -1;

    // Encontrar a imagem atualmente visível
    imagens.forEach((imagem, index) => {
        if (imagem.style.display === 'block') {
            indexAtivo = index;
        }
    });

    if (indexAtivo !== -1) {
        // Calcular novo índice
        let novoIndex = indexAtivo + direcao;
        
        // Verificar limites
        if (novoIndex < 0) {
            novoIndex = imagens.length - 1;
        } else if (novoIndex >= imagens.length) {
            novoIndex = 0;
        }

        // Esconder todas as imagens
        imagens.forEach(img => {
            img.style.display = 'none';
        });
        
        // Mostrar a nova imagem
        imagens[novoIndex].style.display = 'block';
    }
}

function criarCardComEvento(dados, isAutomovel = false) {
    const card = document.createElement('div');
    card.className = 'card';
    
    const imagens = dados.imagens || ["images/default.jpg"];
    const carrosselId = `carrossel-${dados.id}`;
    const isFavorito = verificarFavorito(dados.id);
    
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
            <button class="favorite-btn ${isFavorito ? 'favorited' : ''}" data-ad-id="${dados.id}">
                <i class="fas fa-heart"></i>
            </button>
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
            <a href="detalhes.html?id=${dados.id}&tipo=${isAutomovel ? 'carro' : 'imovel'}" class="btn-view-more">Ver Mais</a>
        </div>
    `;
    
    // Eventos do carrossel
    card.querySelector('.carrossel-seta-esquerda').addEventListener('click', (e) => {
        e.stopPropagation();
        mudarImagem(carrosselId, -1);
    });
    
    card.querySelector('.carrossel-seta-direita').addEventListener('click', (e) => {
        e.stopPropagation();
        mudarImagem(carrosselId, 1);
    });
    
    // Evento do botão de favoritos
    card.querySelector('.favorite-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        toggleFavorito(dados);
    });
    
    // Evento de clique no card (exceto nos botões)
    card.addEventListener('click', (e) => {
        if (!e.target.closest('button') && !e.target.closest('a')) {
            window.location.href = `detalhes.html?id=${dados.id}&tipo=${isAutomovel ? 'carro' : 'imovel'}`;
        }
    });
    
    return card;
}
// Verifica se um anúncio já está nos favoritos do usuário
async function verificarFavorito(adId) {
    const user = auth.currentUser;
    if (!user) return false;
    
    try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const favoritos = userDoc.data()?.favoritos || [];
        return favoritos.includes(adId);
    } catch (error) {
        console.error("Erro ao verificar favorito:", error);
        return false;
    }
}

async function toggleFavorito(adData) {
    const user = auth.currentUser;
    if (!user) {
        showAlert("Você precisa estar logado para adicionar favoritos", "error");
        return;
    }
    
    try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        const favoritos = userDoc.data()?.favoritos || [];
        const adId = adData.id;
        
        let novosFavoritos;
        let isFavorito;
        let message;
        
        if (favoritos.includes(adId)) {
            // Remove dos favoritos
            novosFavoritos = favoritos.filter(id => id !== adId);
            isFavorito = false;
            message = "Anúncio removido dos favoritos";
        } else {
            // Adiciona aos favoritos
            novosFavoritos = [...favoritos, adId];
            isFavorito = true;
            message = "Anúncio adicionado aos favoritos";
        }
        
        // Atualiza no Firestore
        await updateDoc(userDocRef, {
            favoritos: novosFavoritos,
            lastUpdated: new Date()  // Adiciona timestamp de atualização
        });
        
        // Atualiza a UI
        const favoriteBtns = document.querySelectorAll(`.favorite-btn[data-ad-id="${adId}"]`);
        favoriteBtns.forEach(btn => {
            btn.classList.toggle('favorited', isFavorito);
            btn.innerHTML = `<i class="fas fa-heart"></i>`;
        });
        
        showAlert(message, "success");
        
    } catch (error) {
        console.error("Erro ao atualizar favoritos:", error);
        showAlert("Ocorreu um erro ao atualizar seus favoritos", "error");
        
        // Log adicional para depuração
        if (error instanceof FirebaseError) {
            console.error("Código de erro Firebase:", error.code);
            console.error("Mensagem detalhada:", error.message);
        }
    }
}

function openDetailsModal(adData, isAutomovel = false) {
    currentAdData = adData;
    const modal = document.getElementById('detalhesModal');
    const modalContent = document.getElementById('modalContent');
    const isFavorito = verificarFavorito(adData.id);
    
    // Fechar modal se já estiver aberto
    if (modal.style.display === 'block') {
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
            <button class="favorite-btn ${isFavorito ? 'favorited' : ''}" data-ad-id="${adData.id}">
                <i class="fas fa-heart"></i>
            </button>
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
    
    // Adicionar evento do botão de favoritos no modal
    document.querySelector('.modal-carrossel .favorite-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorito(adData);
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

async function buscarImoveis(filtros = {}) {
    try {
        // Limpar filtros vazios ou undefined
        Object.keys(filtros).forEach(key => {
            if (filtros[key] === undefined || filtros[key] === "") {
                delete filtros[key];
            }
        });

        const imoveisRef = collection(db, "imoveis");
        let q = query(imoveisRef);
        
        // Aplicar filtros dinamicamente
        for (const [key, value] of Object.entries(filtros)) {
            if (value !== undefined && value !== "") {
                if (key === "precoMin" || key === "precoMax" || 
                    key === "quartos" || key === "banheiros" || 
                    key === "garagem" || key === "areaMin") {
                    // Para campos numéricos
                    const op = key === "precoMin" ? ">=" : 
                              key === "precoMax" ? "<=" : ">=";
                    q = query(q, where(
                        key === "precoMin" || key === "precoMax" ? "preco" : key,
                        op, 
                        value
                    ));
                } else {
                    // Para campos textuais/booleanos
                    q = query(q, where(key, "==", value));
                }
            }
        }
        
        // Restante da função permanece igual...
        const querySnapshot = await getDocs(q);
        const resultadosContainer = document.getElementById("resultados");
        
        resultadosContainer.innerHTML = querySnapshot.empty 
            ? "<p>Nenhum imóvel encontrado com os filtros selecionados.</p>" 
            : "<h3>Resultados da Busca:</h3>";
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            data.id = doc.id;
            resultadosContainer.appendChild(criarCardImovel(data));
        });
        
    } catch (error) {
        console.error("Erro ao buscar imóveis:", error);
        document.getElementById("resultados").innerHTML = `
            <div class="alert alert-danger">
                <p>Erro ao buscar imóveis. Por favor, tente novamente.</p>
                ${error.message ? `<small>${error.message}</small>` : ''}
            </div>
        `;
    }
}
// Adicione esta função em algum lugar do seu arquivo JS (de preferência perto de outras funções utilitárias)
function validarFiltrosImoveis(filtros) {
    // Verifica se pelo menos um campo relevante foi preenchido
    const camposRelevantes = ['bairro', 'tipo', 'negociacao', 'quartos', 'banheiros', 'garagem', 'areaMin'];
    const algumCampoPreenchido = camposRelevantes.some(campo => 
        filtros[campo] !== undefined && filtros[campo] !== "" && filtros[campo] !== 0
    );

    if (!algumCampoPreenchido && filtros.precoMin === undefined && filtros.precoMax === undefined) {
        showAlert("Preencha pelo menos um filtro para buscar imóveis", "error");
        return false;
    }

    // Validação de preços
    if (filtros.precoMin !== undefined && filtros.precoMax !== undefined && filtros.precoMin > filtros.precoMax) {
        showAlert("O preço mínimo não pode ser maior que o preço máximo", "error");
        return false;
    }

    // Validação para área mínima
    if (filtros.areaMin !== undefined && filtros.areaMin < 0) {
        showAlert("A área mínima não pode ser negativa", "error");
        return false;
    }

    return true;
}
function criarCardImovel(imovel) {
    const card = document.createElement('div');
    card.className = 'card';
    
    const imagens = imovel.imagens || ["images/default.jpg"];
    const carrosselId = `carrossel-${imovel.id}`;
    const isFavorito = verificarFavorito(imovel.id);
    
    // Características do imóvel
    const caracteristicas = [];
    if (imovel.mobiliado) caracteristicas.push('Mobiliado');
    if (imovel.aceitaAnimais) caracteristicas.push('Aceita animais');
    
    card.innerHTML = `
        <div class="carrossel" id="${carrosselId}">
            <div class="carrossel-imagens">
                ${imagens.map((imagem, index) => `
                    <img src="${imagem}" alt="${imovel.titulo}" class="carrossel-img" 
                         style="display: ${index === 0 ? 'block' : 'none'}" loading="lazy">
                `).join('')}
            </div>
            <button class="carrossel-seta carrossel-seta-esquerda">&#10094;</button>
            <button class="carrossel-seta carrossel-seta-direita">&#10095;</button>
            <button class="favorite-btn ${isFavorito ? 'favorited' : ''}" data-ad-id="${imovel.id}">
                <i class="fas fa-heart"></i>
            </button>
        </div>
        <div class="card-content">
            <h4>${imovel.titulo || 'Sem título'}</h4>
            <p><strong>Bairro:</strong> ${imovel.bairro || 'Não informado'}</p>
            <p><strong>Tipo:</strong> ${imovel.titulo || 'Não informado'}</p>
            <p><strong>Preço:</strong> R$ ${imovel.preco?.toLocaleString('pt-BR') || 'Não informado'}</p>
            <div class="card-features">
                <span><i class="fas fa-bed"></i> ${imovel.quartos || 0} quarto(s)</span>
                <span><i class="fas fa-bath"></i> ${imovel.banheiros || 0} banheiro(s)</span>
                <span><i class="fas fa-car"></i> ${imovel.garagem || 0} vaga(s)</span>
                ${imovel.area ? `<span><i class="fas fa-ruler-combined"></i> ${imovel.area}m²</span>` : ''}
            </div>
            ${caracteristicas.length > 0 ? `
                <div class="card-tags">
                    ${caracteristicas.map(c => `<span class="tag">${c}</span>`).join('')}
                </div>
            ` : ''}
            <a href="detalhes.html?id=${imovel.id}&tipo=imovel" class="btn-view-more">Ver Mais</a>
        </div>
    `;
    
    // Eventos do carrossel
    card.querySelector('.carrossel-seta-esquerda').addEventListener('click', (e) => {
        e.stopPropagation();
        mudarImagem(carrosselId, -1);
    });
    
    card.querySelector('.carrossel-seta-direita').addEventListener('click', (e) => {
        e.stopPropagation();
        mudarImagem(carrosselId, 1);
    });
    
    // Evento do botão de favoritos
    card.querySelector('.favorite-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        toggleFavorito(imovel);
    });
    
    // Evento de clique no card (exceto nos botões)
    card.addEventListener('click', (e) => {
        if (!e.target.closest('button') && !e.target.closest('a')) {
            window.location.href = `detalhes.html?id=${imovel.id}&tipo=imovel`;
        }
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
    // 1. Verificar e limpar resultados
    const resultados = document.getElementById("resultados");
    if (resultados) resultados.innerHTML = "";

    // 2. Alternar visibilidade dos campos de imóvel
    const camposImovel = document.getElementById("campos-imovel");
    if (camposImovel) {
        camposImovel.style.display = tipo === "imovel" ? "block" : "none";
    } else {
        console.error("Elemento 'campos-imovel' não encontrado");
    }

    // 3. Alternar visibilidade dos campos de automóvel
    const camposCarro = document.getElementById("campos-carro");
    if (camposCarro) {
        camposCarro.style.display = tipo === "carro" ? "block" : "none";
    } else {
        console.error("Elemento 'campos-carro' não encontrado");
    }

    // 4. Resetar formulário se necessário
    const formPesquisa = document.getElementById("form-pesquisa");
    if (formPesquisa && tipo === "imovel") {
        formPesquisa.reset();
    }
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

  document.getElementById("form-pesquisa")?.addEventListener("submit", function(e) {
    e.preventDefault();
    
    // Verifica se o elemento tipo existe
    const tipoInput = document.getElementById("tipo");
    if (!tipoInput) {
        console.error("Elemento 'tipo' não encontrado");
        showAlert("Erro no formulário. Recarregue a página e tente novamente.", "error");
        return;
    }
    
    const tipo = tipoInput.value;
    
    if (!tipo) {
        showAlert("Selecione o tipo de anúncio (imóvel ou automóvel)", "error");
        return;
    }

    if (tipo === "imovel") {
        // Elementos do formulário de imóvel
        const bairroInput = document.getElementById("bairro");
        const tipoImovelInput = document.getElementById("tipo-imovel");
        const precoMinInput = document.getElementById("preco-min");
        const precoMaxInput = document.getElementById("preco-max");
        const quartosInput = document.getElementById("quartos");
        const banheirosInput = document.getElementById("banheiros");
        const garagemInput = document.getElementById("garagem");
        const areaMinInput = document.getElementById("area-min");
        const aceitaAnimaisInput = document.getElementById("aceita-animais");
        const mobiliadoInput = document.getElementById("mobiliado");
        const negociacaoInput = document.querySelector('input[name="negociacao"]:checked');

        // Verifica se os elementos principais existem
        if (!bairroInput || !tipoImovelInput || !precoMinInput || !precoMaxInput) {
            console.error("Elementos do formulário de imóvel não encontrados");
            showAlert("Erro no formulário. Recarregue a página e tente novamente.", "error");
            return;
        }

        // Prepara os filtros
        const filtros = {
            bairro: bairroInput.value.trim(),
            precoMin: parseFloat(precoMinInput.value) || undefined,
            precoMax: parseFloat(precoMaxInput.value) || undefined,
            tipo: tipoImovelInput.value,
            negociacao: negociacaoInput?.value,
            quartos: quartosInput ? parseInt(quartosInput.value) || undefined : undefined,
            banheiros: banheirosInput ? parseInt(banheirosInput.value) || undefined : undefined,
            garagem: garagemInput ? parseInt(garagemInput.value) || undefined : undefined,
            areaMin: areaMinInput ? parseFloat(areaMinInput.value) || undefined : undefined,
            aceitaAnimais: aceitaAnimaisInput?.checked || undefined,
            mobiliado: mobiliadoInput?.checked || undefined
        };
        
        // Valida e executa a busca
        if (validarFiltrosImoveis(filtros)) {
            buscarImoveis(filtros);
        }
    } else if (tipo === "carro") {
        // Elementos do formulário de automóvel
        const marcaInput = document.getElementById("marca");
        const modeloInput = document.getElementById("modelo");
        const anoInput = document.getElementById("ano");
        const precoMinInput = document.getElementById("preco-min");
        const precoMaxInput = document.getElementById("preco-max");

        // Verifica se os elementos principais existem
        if (!marcaInput || !modeloInput || !anoInput || !precoMinInput || !precoMaxInput) {
            console.error("Elementos do formulário de automóvel não encontrados");
            showAlert("Erro no formulário. Recarregue a página e tente novamente.", "error");
            return;
        }

        // Prepara os parâmetros
        const marca = marcaInput.value.trim();
        const modelo = modeloInput.value.trim();
        const ano = anoInput.value.trim();
        const precoMin = parseFloat(precoMinInput.value) || 0;
        const precoMax = parseFloat(precoMaxInput.value) || 0;

        // Validação básica para carros
        if (!marca && !modelo && !ano) {
            showAlert("Preencha pelo menos um filtro para buscar automóveis", "error");
            return;
        }

        buscarCarros(precoMin, precoMax, marca, modelo, ano);
    }
});
    // Configuração dos botões de tipo
   // Configuração dos botões de tipo - versão segura
    const tipoOptions = document.querySelectorAll(".tipo-option");
    const tipoInput = document.getElementById("tipo");
    
    if (tipoOptions.length > 0 && tipoInput) {
        tipoOptions.forEach((option) => {
            option.addEventListener("click", function() {
                // Verificar se é um elemento válido
                if (!this.getAttribute) return;
                
                tipoOptions.forEach((opt) => {
                    if (opt.classList) opt.classList.remove("active");
                });
                
                if (this.classList) this.classList.add("active");
                
                const novoTipo = this.getAttribute("data-tipo");
                if (novoTipo) {
                    tipoInput.value = novoTipo;
                    toggleFields(novoTipo);
                }
            });
        });
        
        // Inicializar com o primeiro botão ativo (se existir)
        if (tipoOptions[0] && tipoOptions[0].classList) {
            tipoOptions[0].classList.add("active");
            const tipoInicial = tipoOptions[0].getAttribute("data-tipo");
            if (tipoInicial) {
                tipoInput.value = tipoInicial;
                toggleFields(tipoInicial);
            }
        }
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


// Adicione esta função no início do seu arquivo JavaScript
function showAlert(message, type = 'success') {
    // Verifica se SweetAlert2 está disponível
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: type === 'error' ? 'Erro!' : 'Sucesso!',
            text: message,
            icon: type,
            confirmButtonText: 'OK'
        });
    } else {
        // Fallback para alert padrão se SweetAlert2 não estiver disponível
        alert(`${type.toUpperCase()}: ${message}`);
    }
}



// Variáveis globais para paginação
let currentImoveisPage = 1;
let currentAutomoveisPage = 1;
const itemsPerPage = 12; // Ajuste conforme necessário

// Função para carregar todos os anúncios com paginação
async function carregarTodosAnunciosPaginados() {
    try {
        // Carregar imóveis
        const imoveisRef = collection(db, "imoveis");
        const imoveisSnapshot = await getDocs(imoveisRef);
        
        const allImoveis = [];
        imoveisSnapshot.forEach(doc => {
            const data = doc.data();
            data.id = doc.id;
            allImoveis.push(data);
        });
        
        exibirAnunciosPaginados(allImoveis, 'imoveis', currentImoveisPage);
        
        // Carregar automóveis
        const automoveisRef = collection(db, "automoveis");
        const automoveisSnapshot = await getDocs(automoveisRef);
        
        const allAutomoveis = [];
        automoveisSnapshot.forEach(doc => {
            const data = doc.data();
            data.id = doc.id;
            allAutomoveis.push(data);
        });
        
        exibirAnunciosPaginados(allAutomoveis, 'automoveis', currentAutomoveisPage);
        
        // Iniciar efeitos visuais
        iniciarEfeitosVisuais();
        
    } catch (error) {
        console.error("Erro ao carregar anúncios:", error);
        showAlert("Erro ao carregar os anúncios", "error");   // Mostrar estado de erro nas grids
        document.querySelectorAll('.metal-grid').forEach(grid => {
            grid.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Não foi possível carregar os anúncios</p>
                    <button class="retry-btn">Tentar novamente</button>
                </div>
            `;
        });
        
        // Configurar botão de tentar novamente
        document.querySelectorAll('.retry-btn').forEach(btn => {
            btn.addEventListener('click', carregarTodosAnunciosPaginados);
        });
    }
}

// Função para iniciar efeitos visuais
function iniciarEfeitosVisuais() {
    // Efeito de brilho aleatório
    const cards = document.querySelectorAll('.anuncio-card');
    
    // Aplicar brilho inicial
    cards.forEach(card => {
        const delay = Math.random() * 3000;
        setTimeout(() => {
            card.classList.add('glow');
            setTimeout(() => card.classList.remove('glow'), 2000);
        }, delay);
    });
    
    // Continuar com brilho aleatório
    setInterval(() => {
        const randomIndex = Math.floor(Math.random() * cards.length);
        const randomCard = cards[randomIndex];
        
        randomCard.classList.add('glow');
        setTimeout(() => {
            randomCard.classList.remove('glow');
        }, 2000);
    }, 1000);
}

function exibirAnunciosPaginados(anuncios, tipo, pagina) {
    const grid = document.getElementById(`grid-${tipo}`);
    
    // Mostrar estado de carregamento
    grid.innerHTML = `
        <div class="grid-placeholder">
            <div class="spinner"></div>
            <p>Carregando anúncios...</p>
        </div>
    `;
    
    // Usar setTimeout para permitir que a UI atualize antes do processamento pesado
    setTimeout(() => {
        grid.innerHTML = '';
        
        if (!anuncios || anuncios.length === 0) {
            grid.innerHTML = '<div class="no-results">Nenhum anúncio disponível</div>';
            return;
        }
        
        const totalPages = Math.ceil(anuncios.length / itemsPerPage);
        const startIndex = (pagina - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, anuncios.length);
        
        for (let i = startIndex; i < endIndex; i++) {
            const anuncio = anuncios[i];
            try {
                const card = criarCardAnuncio(anuncio, tipo === 'automoveis');
                grid.appendChild(card);
            } catch (error) {
                console.error("Erro ao criar card:", error);
            }
        }
        
        // Atualizar controles de paginação
        updatePaginationControls(pagina, totalPages, tipo);
        
    }, 100);
}

function updatePaginationControls(currentPage, totalPages, tipo) {
    const currentPageElement = document.querySelector(`.grid-pagination .current-page`);
    const totalPagesElement = document.querySelector(`.grid-pagination .total-pages`);
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    
    if (currentPageElement) currentPageElement.textContent = currentPage;
    if (totalPagesElement) totalPagesElement.textContent = totalPages;
    
    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
    
    // Armazenar a página atual para o tipo ativo
    if (tipo === 'imoveis') {
        currentImoveisPage = currentPage;
    } else {
        currentAutomoveisPage = currentPage;
    }
}

// Configurar eventos
function setupAnunciosControls() {
    // Controles de paginação
    document.querySelector('.prev-btn').addEventListener('click', () => {
        const activeTab = document.querySelector('.tab-btn.active').getAttribute('data-tab');
        if (activeTab === 'imoveis' && currentImoveisPage > 1) {
            currentImoveisPage--;
            carregarTodosAnunciosPaginados();
        } else if (activeTab === 'automoveis' && currentAutomoveisPage > 1) {
            currentAutomoveisPage--;
            carregarTodosAnunciosPaginados();
        }
    });
    
    document.querySelector('.next-btn').addEventListener('click', () => {
        const activeTab = document.querySelector('.tab-btn.active').getAttribute('data-tab');
        const totalPages = parseInt(document.querySelector('.total-pages').textContent);
        
        if (activeTab === 'imoveis' && currentImoveisPage < totalPages) {
            currentImoveisPage++;
            carregarTodosAnunciosPaginados();
        } else if (activeTab === 'automoveis' && currentAutomoveisPage < totalPages) {
            currentAutomoveisPage++;
            carregarTodosAnunciosPaginados();
        }
    });
    
    // Tabs
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            document.querySelectorAll('.metal-grid').forEach(grid => {
                grid.classList.remove('active');
            });
            
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(`grid-${tabId}`).classList.add('active');
        });
    });
}


function criarCardAnuncio(anuncio, isAutomovel) {
    const card = document.createElement('div');
    card.className = 'anuncio-card';
    
    // Define a imagem padrão baseada no tipo de anúncio
    const imagemPadrao = isAutomovel ? 'carro.png' : 'casa.png';
    const imagemPrincipal = anuncio.imagens && anuncio.imagens.length > 0 ? 
        anuncio.imagens[0] : imagemPadrao;
    
    // Formata o preço
    const precoFormatado = anuncio.preco ? 
        `R$ ${anuncio.preco.toLocaleString('pt-BR')}` : 'Preço sob consulta';
    
    // Cria o conteúdo do card
    card.innerHTML = `
        <div class="card-metal-effect"></div>
        <img src="${imagemPrincipal}" alt="${anuncio.titulo || 'Anúncio'}" class="anuncio-img">
        <div class="anuncio-info">
            <h4 class="anuncio-titulo">${anuncio.titulo || 'Sem título'}</h4>
            <p class="anuncio-preco">${precoFormatado}</p>
            ${isAutomovel ? 
                `<p class="anuncio-detalhe"><i class="fas fa-car"></i> ${anuncio.marca || ''} ${anuncio.modelo || ''}</p>` : 
                `<p class="anuncio-detalhe"><i class="fas fa-map-marker-alt"></i> ${anuncio.bairro || 'Local não informado'}</p>`
            }
        </div>
        <div class="card-badge">${isAutomovel ? 'Carro' : 'Imóvel'}</div>
    `;
    
    // Adiciona evento de clique
    card.addEventListener('click', () => {
        window.location.href = `detalhes.html?id=${anuncio.id}&tipo=${isAutomovel ? 'carro' : 'imovel'}`;
    });
    
    return card;
}

// Função para animação de brilho aleatório (mantida igual)
function iniciarAnimacaoBrilho() {
    const cards = document.querySelectorAll('.anuncio-card');
    
    cards.forEach(card => {
        const delay = Math.random() * 3000;
        setTimeout(() => {
            card.classList.add('active');
        }, delay);
    });
    
    setInterval(() => {
        const randomIndex = Math.floor(Math.random() * cards.length);
        const randomCard = cards[randomIndex];
        
        randomCard.classList.add('highlight');
        setTimeout(() => {
            randomCard.classList.remove('highlight');
        }, 2000);
    }, 1000);
}

// Configurar tabs (mantida igual)
function setupAnunciosTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const grids = document.querySelectorAll('.metal-grid');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            grids.forEach(g => g.classList.remove('active'));
            
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(`grid-${tabId}`).classList.add('active');
        });
    });
}

// Inicialização (atualizada para carregar todos anúncios)
document.addEventListener("DOMContentLoaded", function() {
    if (document.querySelector('.todos-anuncios')) {
        setupAnunciosTabs();
        carregarTodosAnuncios();
    }
});
// ============== EXPORTAÇÕES GLOBAIS ==============
window.mudarImagem = mudarImagem;
window.openDetailsModal = openDetailsModal;
window.closeDetailsModal = closeDetailsModal;
window.buscarCarros = buscarCarros;
window.buscarImoveis = buscarImoveis;
window.carregarImoveisDestaque = carregarImoveisDestaque;
window.preencherBairros = preencherBairros;
console.log("Elementos no DOM:");
console.log("campos-imovel:", document.getElementById("campos-imovel"));
console.log("campos-carro:", document.getElementById("campos-carro"));
console.log("resultados:", document.getElementById("resultados"));
console.log("form-pesquisa:", document.getElementById("form-pesquisa"));
