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
    getDocs,
    orderBy,
    limit, 
    addDoc,
    onSnapshot ,
    deleteDoc


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
// Função para verificar todos os favoritos do usuário
async function verificarFavoritos() {
    const user = auth.currentUser;
    if (!user) return [];
    
    try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        return userDoc.data()?.favoritos || [];
    } catch (error) {
        console.error("Erro ao verificar favoritos:", error);
        return [];
    }
}
function criarCardComEvento(dados, isAutomovel = false) {
    const card = document.createElement('div');
    card.className = 'card';
    
    const imagens = dados.imagens || ["images/default.jpg"];
    const carrosselId = `carrossel-${dados.id}`;
    const isFavorito = verificarFavorito(dados.id);
    const isAluguel = dados.negociacao === 'aluguel';
    const visualizacoes = dados.visualizacoes || 0;
    
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
            <div class="visualizacoes-badge">
                <i class="fas fa-eye"></i> ${visualizacoes.toLocaleString()}
            </div>
        </div>
        <div class="card-content">
            <h4>${dados.titulo || 'Sem título'}</h4>
            <p class="negociacao-tipo ${isAluguel ? 'aluguel' : 'venda'}">
                <strong>${isAluguel ? 'Aluguel' : 'Venda'}</strong>
            </p>
            
            ${isAutomovel ? `
                <p><strong>Marca:</strong> ${dados.marca || 'Não informada'}</p>
                <p><strong>Modelo:</strong> ${dados.modelo || 'Não informado'}</p>
                <p><strong>Ano:</strong> ${dados.ano || 'Não informado'}</p>
            ` : `
                <p><strong>Bairro:</strong> ${dados.bairro || 'Não informado'}</p>
                <p><strong>Tipo:</strong> ${dados.tipo || 'Não informado'}</p>
                <p><strong>Quartos:</strong> ${dados.quartos || '0'}</p>
                <p><strong>Área:</strong> ${dados.area || '0'} m²</p>
                
                ${isAluguel ? `
                    <div class="aluguel-detalhes">
                        <p><strong>Fiador:</strong> ${dados.fiador || 'Não informado'}</p>
                        ${dados.calcao ? `<p><strong>Caução:</strong> R$ ${dados.calcao.toLocaleString('pt-BR')}</p>` : ''}
                        ${dados.tipoCaucao ? `<p><strong>Tipo Caução:</strong> ${formatarTipoCaucao(dados.tipoCaucao)}</p>` : ''}
                    </div>
                ` : ''}
            `}
            
            <p class="preco-destaque"><strong>Preço:</strong> R$ ${dados.preco?.toLocaleString('pt-BR') || 'Não informado'}</p>
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

// Função auxiliar para formatar o tipo de caução
function formatarTipoCaucao(tipo) {
    const tipos = {
        'dinheiro': 'Dinheiro',
        'titulo': 'Título de Capitalização',
        'seguro': 'Seguro Fiança'
    };
    return tipos[tipo] || tipo;
}
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

async function toggleFavorito(adData, buttonElement = null) {
    const user = auth.currentUser;
    if (!user) {
        showAlert("Você precisa estar logado para adicionar favoritos", "error");
        return false; // Retorna false quando não está logado
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
            lastUpdated: new Date()
        });
        
        // Atualiza a UI apenas se o botão foi fornecido
        if (buttonElement) {
            buttonElement.classList.toggle('favorited', isFavorito);
        } else {
            // Alternativa: atualiza todos os botões correspondentes
            document.querySelectorAll(`.favorite-btn[data-ad-id="${adId}"]`).forEach(btn => {
                btn.classList.toggle('favorited', isFavorito);
            });
        }
        
        showAlert(message, "success");
        return isFavorito;
        
    } catch (error) {
        console.error("Erro ao atualizar favoritos:", error);
        showAlert("Ocorreu um erro ao atualizar seus favoritos", "error");
        return false;
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

async function buscarImoveis(filtros = {}) {
    const carregando = document.querySelector(".carregando");
    if (carregando) carregando.style.display = "block";

    try {
        // Limpar filtros vazios
        Object.keys(filtros).forEach(key => {
            if (filtros[key] === undefined || filtros[key] === "") {
                delete filtros[key];
            }
        });

        let q = query(collection(db, "imoveis"), where("status", "==", "ativo"));

        // Filtro por cidade (case-insensitive)
        if (filtros.cidade) {
            q = query(q, where("cidadeNormalizada", "==", filtros.cidade.toLowerCase().trim()));
            console.log("Filtrando por cidade:", filtros.cidade.toLowerCase().trim());
        }

        // Outros filtros (mantenha os existentes)
        if (filtros.bairro) {
            q = query(q, where("bairroNormalizado", "==", filtros.bairro.toLowerCase().trim()));
        }
        // ... (seus outros filtros aqui)

        const querySnapshot = await getDocs(q);
        const listaResultados = document.getElementById("lista-resultados");
        listaResultados.innerHTML = "";

        if (querySnapshot.empty) {
            listaResultados.innerHTML = `
                <div class="alert alert-info">
                    <p>Nenhum imóvel encontrado em ${filtros.cidade || 'todas as cidades'}.</p>
                    <small>Experimente ajustar os critérios de busca.</small>
                </div>
            `;
            return;
        }

        // Processar resultados
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            data.id = doc.id;
            console.log("Documento encontrado:", data); // Log para depuração
            listaResultados.appendChild(criarCardImovel(data));
        });

    } catch (error) {
        console.error("Erro na busca:", error);
        document.getElementById("lista-resultados").innerHTML = `
            <div class="alert alert-danger">
                <p>Erro ao buscar imóveis.</p>
                <small>${error.message}</small>
            </div>
        `;
    } finally {
        if (carregando) carregando.style.display = "none";
    }
}
async function buscarCarros(params = {}) {
    const carregando = document.querySelector(".carregando");
    const resultadosContainer = document.getElementById("resultados");
    const listaResultados = document.getElementById("lista-resultados");
    
    if (carregando) carregando.style.display = "block";
    if (listaResultados) listaResultados.innerHTML = "";
    if (resultadosContainer) resultadosContainer.innerHTML = "";

    try {
        const carrosRef = collection(db, "automoveis");
        let q = query(carrosRef);
        
        // Aplicar filtros
        if (params.cidade && params.cidade.trim() !== "") {
            q = query(q, where("cidadeNormalizada", "==", params.cidade.toLowerCase()));
        }
        if (params.marca && params.marca.trim() !== "") {
            q = query(q, where("marca", "==", params.marca.trim()));
        }
        if (params.modelo && params.modelo.trim() !== "") {
            q = query(q, where("modelo", "==", params.modelo.trim()));
        }
        if (params.ano && params.ano.trim() !== "") {
            q = query(q, where("ano", "==", parseInt(params.ano)));
        }
        if (params.precoMin && params.precoMin > 0) {
            q = query(q, where("preco", ">=", params.precoMin));
        }
        if (params.precoMax && params.precoMax > 0) {
            q = query(q, where("preco", "<=", params.precoMax));
        }

        const querySnapshot = await getDocs(q);
        
        // Verificar se há resultados
        if (querySnapshot.empty) {
            if (listaResultados) {
                listaResultados.innerHTML = `
                    <div class="alert alert-info">
                        <p>Nenhum veículo encontrado com os filtros selecionados.</p>
                        <small>Tente ajustar os critérios de busca.</small>
                    </div>
                `;
            }
            return;
        }
        
        // Criar container para os cards
        const cardsContainer = document.createElement("div");
        cardsContainer.className = "row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4";
        
        // Processar cada documento
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            data.id = doc.id;
            cardsContainer.appendChild(criarCardComEvento(data, true));
        });
        
        // Montar estrutura de resultados
        if (resultadosContainer) {
            resultadosContainer.innerHTML = "<h3 class='resultados-titulo'>Veículos encontrados:</h3>";
            resultadosContainer.appendChild(cardsContainer);
            
            // Adicionar contador de resultados
            const contador = document.createElement("p");
            contador.className = "text-muted mt-3";
            contador.textContent = `${querySnapshot.size} veículo(s) encontrado(s)`;
            resultadosContainer.appendChild(contador);
        } else if (listaResultados) {
            listaResultados.appendChild(cardsContainer);
        }
        
    } catch (error) {
        console.error("Erro ao buscar carros:", error);
        const errorContainer = resultadosContainer || listaResultados;
        if (errorContainer) {
            errorContainer.innerHTML = `
                <div class="alert alert-danger">
                    <p>Erro ao buscar veículos. Por favor, tente novamente.</p>
                    ${error.message ? `<small>${error.message}</small>` : ''}
                </div>
            `;
        }
    } finally {
        if (carregando) carregando.style.display = "none";
    }
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
    // Manter o campo cidade visível para ambos os tipos
    const cidadeField = document.getElementById("cidade").parentElement;
    cidadeField.style.display = "block";

    
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
function criarCardDestaque(dados, isAutomovel = false) {
    const card = document.createElement('div');
    card.className = 'destaque-card';
    
    const imagens = dados.imagens || ["images/default.jpg"];
    const isAluguel = dados.negociacao === 'aluguel';
    const visualizacoes = dados.visualizacoes || 0;
    
    card.innerHTML = `
        <div class="destaque-imagem-container">
            <img src="${imagens[0]}" alt="${dados.titulo}" class="destaque-imagem" loading="lazy">
            <div class="destaque-badge">
                <span class="destaque-tag">Destaque</span>
                <span class="visualizacoes-badge">
                    <i class="fas fa-eye"></i> ${visualizacoes.toLocaleString()}
                </span>
            </div>
            <button class="favorite-btn" data-ad-id="${dados.id}">
                <i class="fas fa-heart"></i>
            </button>
        </div>
        <div class="destaque-info">
            <h3>${dados.titulo || 'Sem título'}</h3>
            <p class="negociacao-tipo ${isAluguel ? 'aluguel' : 'venda'}">
                ${isAluguel ? 'Aluguel' : 'Venda'}
            </p>
            
            ${isAutomovel ? `
                <p><i class="fas fa-car"></i> ${dados.marca || 'Não informada'} ${dados.modelo || ''}</p>
                <p><i class="fas fa-calendar-alt"></i> ${dados.ano || 'Não informado'}</p>
            ` : `
                <p><i class="fas fa-map-marker-alt"></i> ${dados.bairro || 'Não informado'}</p>
                <p><i class="fas fa-expand"></i> ${dados.area || '0'} m²</p>
                
                ${isAluguel ? `
                    <div class="aluguel-info">
                        <p><i class="fas fa-user-shield"></i> ${dados.fiador || 'Fiador não informado'}</p>
                        ${dados.calcao ? `<p><i class="fas fa-money-bill-wave"></i> Caução: R$ ${dados.calcao.toLocaleString('pt-BR')}</p>` : ''}
                    </div>
                ` : ''}
            `}
            
            <div class="destaque-preco">
                <span>R$ ${dados.preco?.toLocaleString('pt-BR') || 'Não informado'}</span>
                <a href="detalhes.html?id=${dados.id}&tipo=${isAutomovel ? 'carro' : 'imovel'}" class="destaque-btn">
                    Ver detalhes <i class="fas fa-arrow-right"></i>
                </a>
            </div>
        </div>
    `;
    
     // Configura o evento de favorito
    const favoriteBtn = card.querySelector('.favorite-btn');
    
    // Verifica o estado inicial do favorito
    verificarFavorito(dados.id).then(isFavorito => {
        if (isFavorito) {
            favoriteBtn.classList.add('favorited');
        }
    });
    
    favoriteBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        e.stopPropagation();
        await toggleFavorito(dados, this); // Passa o botão como argumento
    });
    
    return card;
}

// Função principal para carregar anúncios recomendados
async function carregarAnunciosRecomendados() {
    const user = auth.currentUser;
    if (!user) return carregarDestaques(); // Se não logado, mostra destaques gerais

    try {
        // 1. Obter dados do usuário
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) return carregarDestaques();
        
        const userData = userDoc.data();
        
        // 2. Determinar tipo de usuário (comprador/vendedor)
        if (userData.userRole === "buyer") {
            // Usuário é comprador - mostrar anúncios relevantes
            await carregarAnunciosParaComprador(userData);
        } else if (userData.userRole === "seller") {
            // Usuário é vendedor - mostrar insights/dicas
            await carregarInsightsParaVendedor(userData);
        } else {
            // Tipo não definido - mostrar destaques
            carregarDestaques();
        }
        
    } catch (error) {
        console.error("Erro ao carregar anúncios recomendados:", error);
        carregarDestaques(); // Fallback para destaques em caso de erro
    }
}

async function carregarAnunciosParaComprador(userData) {
    const buyerProfile = userData.buyerProfile || {};
    const interesses = buyerProfile.interests || [];
    const localizacaoPref = buyerProfile.preferenceLocation;
    const faixaPreco = buyerProfile.budgetRange;
    
    // Verificar container de resultados
    const container = document.getElementById('destaqueContainer');
    if (!container) return;
    
    container.innerHTML = '<div class="highlight-loading">Carregando recomendações para você...</div>';
    
    try {
        // 1. Construir queries baseadas nos interesses
        let queries = [];
        
        if (interesses.includes("imoveis-comprar")) {
            queries.push(criarQueryImoveis("venda", localizacaoPref, faixaPreco));
        }
        if (interesses.includes("imoveis-alugar")) {
            queries.push(criarQueryImoveis("aluguel", localizacaoPref, faixaPreco));
        }
        if (interesses.includes("automoveis-comprar")) {
            queries.push(criarQueryAutomoveis("venda", localizacaoPref, faixaPreco));
        }
        if (interesses.includes("automoveis-alugar")) {
            queries.push(criarQueryAutomoveis("aluguel", localizacaoPref, faixaPreco));
        }
        
        // 2. Executar todas as queries em paralelo
        const snapshots = await Promise.all(queries.map(q => getDocs(q)));
        
        // 3. Processar resultados
        container.innerHTML = '';
        let encontrouResultados = false;
        
        snapshots.forEach((snapshot, index) => {
            if (!snapshot.empty) {
                encontrouResultados = true;
                const tipo = queries[index]._query.collection === "imoveis" ? "imóvel" : "automóvel";
                const negocio = queries[index]._query.filters.find(f => f.field === "negociacao")?.value || "";
                
                // Adicionar seção de título
                const sectionTitle = document.createElement('h3');
                sectionTitle.className = 'recommendation-title';
                sectionTitle.textContent = `${tipo.charAt(0).toUpperCase() + tipo.slice(1)} para ${negocio}`;
                container.appendChild(sectionTitle);
                
                // Adicionar cards
                snapshot.forEach(doc => {
                    const data = doc.data();
                    data.id = doc.id;
                    const card = criarCardDestaque(data, tipo === "automóvel");
                    container.appendChild(card);
                });
            }
        });
        
        // 4. Mensagem se não houver resultados
        if (!encontrouResultados) {
            container.innerHTML = `
                <div class="highlight-empty">
                    <i class="fas fa-info-circle"></i>
                    <p>Nenhum anúncio encontrado que corresponda aos seus critérios</p>
                    <button class="btn-show-all" onclick="carregarDestaques()">Mostrar todos os destaques</button>
                </div>
            `;
        }
        
    } catch (error) {
        console.error("Erro ao carregar anúncios para comprador:", error);
        container.innerHTML = `
            <div class="highlight-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Erro ao carregar recomendações</p>
                <button class="retry-btn" onclick="carregarAnunciosRecomendados()">Tentar novamente</button>
            </div>
        `;
    }
}

function criarQueryImoveis(negociacao, localizacao, faixaPreco) {
    let q = query(collection(db, "imoveis"), 
        where("negociacao", "==", negociacao),
        where("status", "==", "ativo")
    );
    
    // Filtro por localização
    if (localizacao) {
        q = query(q, where("bairro", "==", localizacao));
    }
    
    // Filtro por faixa de preço
    if (faixaPreco) {
        q = query(q, where("preco", "<=", faixaPreco));
    }
    
    // Ordenar por destaque e depois por data (mais recentes primeiro)
    q = query(q, orderBy("destaque", "desc"), orderBy("createdAt", "desc"));
    
    return q;
}

function criarQueryAutomoveis(negociacao, localizacao, faixaPreco) {
    let q = query(collection(db, "automoveis"), 
        where("negociacao", "==", negociacao),
        where("status", "==", "ativo")
    );
    
    // Filtro por localização (se aplicável)
    if (localizacao) {
        q = query(q, where("localizacao", "==", localizacao));
    }
    
    // Filtro por faixa de preço
    if (faixaPreco) {
        q = query(q, where("preco", "<=", faixaPreco));
    }
    
    // Ordenar por destaque e depois por data
    q = query(q, orderBy("destaque", "desc"), orderBy("createdAt", "desc"));
    
    return q;
}

async function carregarInsightsParaVendedor(userData) {
    const container = document.getElementById('destaqueContainer');
    if (!container) return;
    
    container.innerHTML = '<div class="highlight-loading">Carregando insights para seu negócio...</div>';
    
    try {
        // 1. Obter dados específicos do vendedor
        const sellerProfile = userData.sellerProfile || {};
        const isProfessional = sellerProfile.sellerType === "professional";
        const areaAtuacao = isProfessional ? sellerProfile.professional?.area : null;
        
        // 2. Carregar estatísticas/dicas relevantes
        let stats = {};
        if (areaAtuacao) {
            if (areaAtuacao.includes("imoveis")) {
                stats = await carregarEstatisticasImoveis();
            } else if (areaAtuacao.includes("automoveis")) {
                stats = await carregarEstatisticasAutomoveis();
            }
        }
        
        // 3. Exibir cards de insights
        container.innerHTML = '';
        
        // Card de desempenho
        const performanceCard = document.createElement('div');
        performanceCard.className = 'insight-card performance';
        performanceCard.innerHTML = `
            <h3><i class="fas fa-chart-line"></i> Seu Desempenho</h3>
            <div class="insight-metrics">
                <div class="metric">
                    <span class="value">${stats.views || '--'}</span>
                    <span class="label">Visualizações</span>
                </div>
                <div class="metric">
                    <span class="value">${stats.contacts || '--'}</span>
                    <span class="label">Contatos</span>
                </div>
                <div class="metric">
                    <span class="value">${stats.conversion || '--'}%</span>
                    <span class="label">Conversão</span>
                </div>
            </div>
            <button class="btn-insight" onclick="location.href='perfil.html#anuncios'">
                Gerenciar Anúncios
            </button>
        `;
        container.appendChild(performanceCard);
        
        // Card de dicas
        const tipsCard = document.createElement('div');
        tipsCard.className = 'insight-card tips';
        tipsCard.innerHTML = `
            <h3><i class="fas fa-lightbulb"></i> Dicas para Você</h3>
            <ul class="tips-list">
                <li>${getRandomTip(areaAtuacao)}</li>
                <li>${getRandomTip(areaAtuacao)}</li>
                <li>${getRandomTip(areaAtuacao)}</li>
            </ul>
            <button class="btn-insight" onclick="location.href='dicas.html'">
                Ver Mais Dicas
            </button>
        `;
        container.appendChild(tipsCard);
        
        // Card de destaques (se for profissional)
        if (isProfessional) {
            const highlightCard = document.createElement('div');
            highlightCard.className = 'insight-card highlight';
            highlightCard.innerHTML = `
                <h3><i class="fas fa-star"></i> Seus Destaques</h3>
                <p>Você tem ${stats.highlights || 0} anúncios em destaque</p>
                <p class="small">Destaques aumentam em 3x a visibilidade</p>
                <button class="btn-insight" onclick="location.href='perfil.html#anuncios'">
                    ${stats.highlights ? 'Gerenciar' : 'Adicionar'} Destaques
                </button>
            `;
            container.appendChild(highlightCard);
        }
        
    } catch (error) {
        console.error("Erro ao carregar insights:", error);
        container.innerHTML = `
            <div class="highlight-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Erro ao carregar insights</p>
                <button class="retry-btn" onclick="carregarInsightsParaVendedor()">Tentar novamente</button>
            </div>
        `;
    }
}

// Funções para carregar estatísticas (exemplos)
async function carregarEstatisticasImoveis() {
    // Implementação real buscaria dados do Firestore
    return {
        views: 245,
        contacts: 12,
        conversion: 4.9,
        highlights: 2
    };
}

async function carregarEstatisticasAutomoveis() {
    return {
        views: 180,
        contacts: 8,
        conversion: 4.4,
        highlights: 1
    };
}

// Banco de dicas contextualizadas
function getRandomTip(area) {
    const allTips = {
        imoveis: [
            "Fotos profissionais aumentam em 70% o interesse nos anúncios",
            "Anúncios com preços competitivos recebem 3x mais contatos",
            "Descrições detalhadas melhoram a conversão em 40%",
            "Atualizar anúncios semanalmente mantém eles relevantes"
        ],
        automoveis: [
            "Fotos em ângulo de 3/4 aumentam o interesse no veículo",
            "Incluir histórico de manutenção pode acelerar a venda",
            "Anúncios com vídeo recebem 50% mais visualizações",
            "Responder rapidamente a perguntas aumenta as chances de venda"
        ],
        default: [
            "Manter contato com clientes anteriores gera indicações",
            "Anúncios ativos nos fins de semana recebem mais visualizações",
            "Usar palavras-chave relevantes melhora a busca",
            "Promover anúncios em redes sociais aumenta o alcance"
        ]
    };
    
    let tips = allTips.default;
    if (area?.includes("imoveis")) tips = [...tips, ...allTips.imoveis];
    if (area?.includes("automoveis")) tips = [...tips, ...allTips.automoveis];
    
    return tips[Math.floor(Math.random() * tips.length)];
}
// Inicializar quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", function() {
    if (document.querySelector('.highlights')) {
        carregarAnunciosRecomendados();
    }
});
// ============== INICIALIZAÇÃO ==============
document.addEventListener("DOMContentLoaded", function() {
    // Configuração inicial
    setPersistence(auth, browserLocalPersistence)
        .then(() => console.log("Persistência ativada!"))
        .catch((error) => console.error("Erro na persistência:", error));

    // Carregar dados iniciais
             carregarAnunciosRecomendados();

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
    console.log("[DEBUG] Formulário submetido - Início");

    try {
        const tipoInput = document.getElementById("tipo");
        console.log("[DEBUG] Tipo input:", tipoInput);
        
        if (!tipoInput) {
            console.error("[ERRO] Elemento 'tipo' não encontrado");
            showAlert("Erro no formulário. Recarregue a página e tente novamente.", "error");
            return;
        }

        const tipo = tipoInput.value;
        console.log("[DEBUG] Tipo selecionado:", tipo);
        
        if (!tipo) {
            console.warn("[AVISO] Nenhum tipo selecionado");
            showAlert("Selecione o tipo de anúncio (imóvel ou automóvel)", "error");
            return;
        }

        const cidade = document.getElementById("cidade")?.value;
        console.log("[DEBUG] Cidade selecionada:", cidade);

        // Mostrar loading
        const carregando = document.querySelector(".carregando");
        if (carregando) {
            console.log("[DEBUG] Mostrando spinner de carregamento");
            carregando.style.display = "block";
        }

        if (tipo === "imovel") {
            console.log("[DEBUG] Iniciando busca por imóveis");
            
            const filtros = {
                  cidade: cidade,
                bairro: document.getElementById("bairro")?.value.trim() || undefined,
                tipo: document.getElementById("tipo-imovel")?.value || undefined,
                negociacao: document.querySelector('input[name="negociacao"]:checked')?.value || undefined,
                precoMin: parseFloat(document.getElementById("preco-min")?.value) || undefined,
                precoMax: parseFloat(document.getElementById("preco-max")?.value) || undefined,
                quartos: parseInt(document.getElementById("quartos")?.value) || undefined,
                banheiros: parseInt(document.getElementById("banheiros")?.value) || undefined,
                garagem: parseInt(document.getElementById("garagem")?.value) || undefined,
                areaMin: parseFloat(document.getElementById("area-min")?.value) || undefined
            };

            console.log("[DEBUG] Filtros aplicados:", JSON.stringify(filtros));
            
            if (validarFiltrosImoveis(filtros)) {
                console.log("[DEBUG] Filtros válidos, iniciando busca...");
                buscarImoveis(filtros).finally(() => {
                    console.log("[DEBUG] Busca por imóveis concluída");
                    if (carregando) carregando.style.display = "none";
                });
            } else {
                console.log("[DEBUG] Filtros inválidos");
                if (carregando) carregando.style.display = "none";
            }

        } else if (tipo === "carro") {
            console.log("[DEBUG] Iniciando busca por automóveis");
            
            const params = {
                cidade: cidade || undefined,
                marca: document.getElementById("marca")?.value.trim() || undefined,
                modelo: document.getElementById("modelo")?.value.trim() || undefined,
                ano: document.getElementById("ano")?.value || undefined,
                precoMin: parseFloat(document.getElementById("preco-min")?.value) || 0,
                precoMax: parseFloat(document.getElementById("preco-max")?.value) || 0
            };

            console.log("[DEBUG] Parâmetros aplicados:", JSON.stringify(params));
            
            if (!params.marca && !params.modelo && !params.ano && !params.cidade) {
                console.warn("[AVISO] Nenhum filtro preenchido para carros");
                showAlert("Preencha pelo menos um filtro para buscar automóveis", "error");
                if (carregando) carregando.style.display = "none";
                return;
            }

            console.log("[DEBUG] Filtros válidos, iniciando busca...");
            buscarCarros(params).finally(() => {
                console.log("[DEBUG] Busca por carros concluída");
                if (carregando) carregando.style.display = "none";
            });
        }
        
    } catch (error) {
        console.error("[ERRO CRÍTICO] No handler do formulário:", error);
        showAlert("Ocorreu um erro inesperado. Verifique o console para detalhes.", "error");
    } finally {
        console.log("[DEBUG] Finalizando handler do formulário");
    }
});
// Função de validação atualizada
function validarFiltrosImoveis(filtros) {
    // Verifica se pelo menos um campo relevante foi preenchido
    const camposRelevantes = ['cidade', 'bairro', 'tipo', 'negociacao', 'quartos', 'banheiros', 'garagem', 'areaMin'];
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



// Variáveis globais
let currentTab = 'imoveis';

// Função para carregar miniaturas
async function carregarMiniAnuncios() {
    try {
        // Mostrar estado de carregamento
        document.getElementById(`mini-grid-${currentTab}`).innerHTML = `
            <div class="grid-placeholder">
                <div class="spinner"></div>
                <p>Carregando ${currentTab === 'imoveis' ? 'imóveis' : 'automóveis'}...</p>
            </div>
        `;

        // Carregar dados do Firebase
        const collectionRef = collection(db, currentTab);
        const snapshot = await getDocs(collectionRef);
        
        const allItems = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            data.id = doc.id;
            allItems.push(data);
        });
        
        exibirMiniAnuncios(allItems);
        iniciarEfeitoLuzAleatoria();
        
    } catch (error) {
        console.error("Erro ao carregar anúncios:", error);
        document.getElementById(`mini-grid-${currentTab}`).innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Erro ao carregar</p>
                <button class="retry-btn">Tentar novamente</button>
            </div>
        `;
        
        document.querySelector('.retry-btn')?.addEventListener('click', carregarMiniAnuncios);
    }
}

// Função para exibir miniaturas
function exibirMiniAnuncios(anuncios) {
    const grid = document.getElementById(`mini-grid-${currentTab}`);
    
    if (!grid) {
        console.error(`Elemento mini-grid-${currentTab} não encontrado`);
        return;
    }

    // Limpar a grade
    grid.innerHTML = '';
    
    if (!anuncios || anuncios.length === 0) {
        grid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-info-circle"></i>
                <p>Nenhum anúncio encontrado</p>
            </div>
        `;
        return;
    }
    
    // Criar fragmento para melhor performance
    const fragment = document.createDocumentFragment();
    
    anuncios.forEach((anuncio, index) => {
        const miniCard = criarMiniCard(anuncio, currentTab === 'automoveis');
        if (miniCard) {
            // Delay para animação de entrada
            miniCard.style.animationDelay = `${index * 0.05}s`;
            fragment.appendChild(miniCard);
        }
    });
    
    grid.appendChild(fragment);
}

// Função para criar mini cards
function criarMiniCard(anuncio, isAutomovel) {
    const miniCard = document.createElement('div');
    miniCard.className = 'mini-card';
    
    // Imagem principal ou padrão
    const imagemPadrao = isAutomovel ? 'images/car-mini.jpg' : 'images/home-mini.jpg';
    const imagemPrincipal = anuncio.imagens && anuncio.imagens.length > 0 ? 
        anuncio.imagens[0] : imagemPadrao;
    
    // Criar conteúdo do card
    miniCard.innerHTML = `
        <img src="${imagemPrincipal}" alt="${anuncio.titulo || 'Anúncio'}" class="mini-image" loading="lazy">
        <div class="mini-badge">${isAutomovel ? 'C' : 'I'}</div>
    `;
    
    // Tooltip com informações básicas
    miniCard.title = `${anuncio.titulo || 'Sem título'}\n${isAutomovel ? 
        `${anuncio.marca || ''} ${anuncio.modelo || ''}` : 
        `${anuncio.bairro || 'Local não informado'}`}`;
    
    // Evento de clique
    miniCard.addEventListener('click', () => {
        window.location.href = `detalhes.html?id=${anuncio.id}&tipo=${isAutomovel ? 'automovel' : 'imovel'}`;
    });
    
    return miniCard;
}

// Efeito de luz aleatória
function iniciarEfeitoLuzAleatoria() {
    const cards = document.querySelectorAll('.mini-card');
    
    setInterval(() => {
        const randomIndex = Math.floor(Math.random() * cards.length);
        const randomCard = cards[randomIndex];
        
        if (randomCard) {
            randomCard.style.animation = 'randomGlow 2s ease';
            setTimeout(() => {
                randomCard.style.animation = '';
            }, 2000);
        }
    }, 3000);
}

// Configurar abas
function setupMiniTabs() {
    const tabs = document.querySelectorAll('.anuncios-tabs .tab-btn');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Ativar aba clicada
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Atualizar tab atual
            currentTab = tab.getAttribute('data-tab');
            
            // Mostrar grade correspondente
            document.querySelectorAll('.mini-grid').forEach(g => g.classList.remove('active'));
            document.getElementById(`mini-grid-${currentTab}`).classList.add('active');
            
            // Carregar anúncios
            carregarMiniAnuncios();
        });
    });
}



// Inicialização
document.addEventListener("DOMContentLoaded", function() {
    if (document.querySelector('.mini-anuncios')) {
        setupMiniTabs();
        carregarMiniAnuncios();
    }
});


document.addEventListener("DOMContentLoaded", function() {
    const btnBusca = document.getElementById('btn-ativar-busca');
    
    if (btnBusca) {
        console.log("Botão de busca encontrado no DOM");
        btnBusca.style.display = 'flex'; // Força exibição
        
        // Teste visual - remove após confirmar que funciona
        btnBusca.style.border = '2px solid red';
        
        btnBusca.addEventListener('click', function() {
            console.log("Botão de busca clicado");
            document.querySelector('.search-overlay').style.right = '0';
        });
    } else {
        console.error("Botão de busca NÃO encontrado no DOM");
    }
});


document.addEventListener("DOMContentLoaded", function() {
    // Elementos com verificação de existência
    const btnAbrir = document.getElementById('btn-ativar-busca');
    const btnFechar = document.getElementById('btn-fechar-busca');
    const overlay = document.querySelector('.search-overlay');
    const backdrop = document.querySelector('.overlay-backdrop');
    
    // Verifica se todos os elementos necessários existem
    if (!btnAbrir || !btnFechar || !overlay || !backdrop) {
        console.error('Um ou mais elementos necessários não foram encontrados no DOM');
        return;
    }

    // Elemento que deve receber foco quando o overlay abrir
    const primeiroElementoFocavel = btnFechar;
    
    // Variável para armazenar o último elemento focado antes de abrir o overlay
    let ultimoElementoFocado;

    function abrirBusca() {
        try {
            // Armazena o elemento que tinha foco antes de abrir
            ultimoElementoFocado = document.activeElement;
            
            // Mostra o overlay
            overlay.removeAttribute('hidden');
            
            // Força reflow para garantir que a transição ocorra
            void overlay.offsetWidth;
            
            // Adiciona classe active para animação
            overlay.style.right = '0';
            if (backdrop) {
                backdrop.classList.add('active');
            }
            
            // Move o foco para o primeiro elemento focável
            setTimeout(() => {
                if (primeiroElementoFocavel) {
                    primeiroElementoFocavel.focus();
                }
            }, 100);
            
            // Desabilita scroll na página principal
            document.body.style.overflow = 'hidden';
        } catch (error) {
            console.error('Erro ao abrir a busca:', error);
        }
    }

    function fecharBusca() {
        try {
            // Animação de saída
            overlay.style.right = '-100%';
            if (backdrop) {
                backdrop.classList.remove('active');
            }
            
            // Esconde o overlay após a animação
            setTimeout(() => {
                overlay.setAttribute('hidden', '');
                
                // Restaura o foco para o elemento anterior
                if (ultimoElementoFocado && 'focus' in ultimoElementoFocado) {
                    ultimoElementoFocado.focus();
                }
                
                // Restaura scroll na página principal
                document.body.style.overflow = '';
            }, 400); // Tempo deve corresponder à duração da transição
        } catch (error) {
            console.error('Erro ao fechar a busca:', error);
        }
    }

    // Adiciona event listeners com verificação
    if (btnAbrir) {
        btnAbrir.addEventListener('click', abrirBusca);
    } else {
        console.error('Botão de abrir busca não encontrado');
    }

    if (btnFechar) {
        btnFechar.addEventListener('click', fecharBusca);
    } else {
        console.error('Botão de fechar busca não encontrado');
    }

    if (backdrop) {
        backdrop.addEventListener('click', fecharBusca);
    }

    // Fechar com tecla ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && overlay && !overlay.hasAttribute('hidden')) {
            fecharBusca();
        }
    });
    
    // Trapping focus dentro do overlay quando aberto
    if (overlay) {
        overlay.addEventListener('keydown', function(e) {
            if (e.key === 'Tab' && overlay && !overlay.hasAttribute('hidden')) {
                const focaveis = overlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                if (focaveis.length > 0) {
                    const primeiro = focaveis[0];
                    const ultimo = focaveis[focaveis.length - 1];
                    
                    if (e.shiftKey) {
                        if (document.activeElement === primeiro) {
                            ultimo.focus();
                            e.preventDefault();
                        }
                    } else {
                        if (document.activeElement === ultimo) {
                            primeiro.focus();
                            e.preventDefault();
                        }
                    }
                }
            }
        });
    }
});


document.addEventListener("DOMContentLoaded", function() {
    // Criar partículas para o banner
    const banner = document.querySelector('section.banner');
    if (banner) {
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'banner-particles';
        
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Posição e tamanho aleatórios
            const size = Math.random() * 5 + 1;
            const posX = Math.random() * 100;
            const duration = Math.random() * 20 + 10;
            const delay = Math.random() * -20;
            
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${posX}%`;
            particle.style.bottom = `-10px`;
            particle.style.animationDuration = `${duration}s`;
            particle.style.animationDelay = `${delay}s`;
            particle.style.opacity = Math.random() * 0.5 + 0.1;
            
            particlesContainer.appendChild(particle);
        }
        
        banner.appendChild(particlesContainer);
    }
});

document.addEventListener("DOMContentLoaded", function() {
    // Efeito de digitação no placeholder do logo
    const logoPlaceholder = document.querySelector('.logo-placeholder');
    if (logoPlaceholder) {
        const texts = ["Corretor certo", "Sua Casa dos Sonhos", "Conectando Você"];
        let count = 0;
        let index = 0;
        let currentText = '';
        let letter = '';
        
        (function type() {
            if (count === texts.length) {
                count = 0;
            }
            
            currentText = texts[count];
            letter = currentText.slice(0, ++index);
            
            logoPlaceholder.textContent = letter;
            if (letter.length === currentText.length) {
                count++;
                index = 0;
                setTimeout(type, 2000);
            } else {
                setTimeout(type, 100);
            }
        })();
    }

    // Efeito de scroll no header
    const header = document.querySelector('.header');
    let lastScroll = 0;
    
    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll <= 0) {
            header.style.transform = 'translateY(0)';
            header.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.3)';
        } 
        
        if (currentScroll > lastScroll && currentScroll > 100) {
            header.style.transform = 'translateY(-100%)';
        } else if (currentScroll < lastScroll) {
            header.style.transform = 'translateY(0)';
            header.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.4)';
        }
        
        lastScroll = currentScroll;
    });
});


async function carregarDestaques() {
    try {
        const destaqueContainer = document.getElementById('destaqueContainer');
        if (!destaqueContainer) return;
        
        // Mostrar estado de carregamento
        destaqueContainer.innerHTML = '<div class="highlight-loading">Carregando recomendações para você...</div>';
        
        const user = auth.currentUser;
        
        // Se não estiver logado, mostrar destaques gerais
        if (!user) {
            return carregarDestaquesGerais();
        }
        
        // Obter dados do usuário
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
            return carregarDestaquesGerais();
        }
        
        const userData = userDoc.data();
        const isBuyer = userData.userRole === "buyer";
        
        // Se não for comprador, mostrar destaques gerais
        if (!isBuyer) {
            return carregarDestaquesGerais();
        }
        
        const buyerProfile = userData.buyerProfile || {};
        const interesses = buyerProfile.interests || [];
        const localizacao = buyerProfile.preferenceLocation || null;
        const faixaPreco = buyerProfile.budgetRange || null;
        
        // Verificar se há interesses definidos
        if (!interesses || interesses.length === 0) {
            destaqueContainer.innerHTML = `
                <div class="highlight-empty">
                    <i class="fas fa-info-circle"></i>
                    <p>Você ainda não configurou seus interesses</p>
                    <button class="btn-suggestion" onclick="location.href='perfil.html#perfil-tab'">
                        Configurar Meus Interesses
                    </button>
                </div>
            `;
            return;
        }
        
        // Criar queries baseadas nos interesses
        const queries = [];
        
        // Verificar interesse em imóveis
        if (interesses.some(i => i.includes("imoveis"))) {
            const negociacao = interesses.includes("imoveis-alugar") ? "aluguel" : "venda";
            let imoveisQuery = query(
                collection(db, "imoveis"),
                where("destaque", "==", true),
                where("status", "==", "ativo"),
                where("negociacao", "==", negociacao)
            );
            
            // Adicionar filtros adicionais se existirem
            if (localizacao) {
                imoveisQuery = query(imoveisQuery, where("bairro", "==", localizacao));
            }
            if (faixaPreco) {
                imoveisQuery = query(imoveisQuery, where("preco", "<=", faixaPreco));
            }
            
            queries.push(imoveisQuery);
        }
        
        // Verificar interesse em automóveis
        if (interesses.some(i => i.includes("automoveis"))) {
            const negociacao = interesses.includes("automoveis-alugar") ? "aluguel" : "venda";
            let automoveisQuery = query(
                collection(db, "automoveis"),
                where("destaque", "==", true),
                where("status", "==", "ativo"),
                where("negociacao", "==", negociacao)
            );
            
            // Adicionar filtros adicionais se existirem
            if (localizacao) {
                automoveisQuery = query(automoveisQuery, where("localizacao", "==", localizacao));
            }
            if (faixaPreco) {
                automoveisQuery = query(automoveisQuery, where("preco", "<=", faixaPreco));
            }
            
            queries.push(automoveisQuery);
        }
        
        // Se não houver queries válidas, mostrar mensagem
        if (queries.length === 0) {
            destaqueContainer.innerHTML = `
                <div class="highlight-empty">
                    <i class="fas fa-info-circle"></i>
                    <p>Nenhum interesse válido configurado</p>
                    <button class="btn-suggestion" onclick="location.href='perfil.html#perfil-tab'">
                        Configurar Meus Interesses
                    </button>
                </div>
            `;
            return;
        }
        
        // Executar todas as queries em paralelo
        const snapshots = await Promise.all(queries.map(q => getDocs(q)));
        
        // Processar resultados
        destaqueContainer.innerHTML = '';
        let encontrouResultados = false;
        
        snapshots.forEach((snapshot, index) => {
            if (!snapshot.empty) {
    encontrouResultados = true;
    const tipo = queries[index]._query.collection === "imoveis" ? "imóvel" : "automóvel";
    const negocio = queries[index]._query.filters.find(f => f.field === "negociacao")?.value || "";
    
    // Criar container da seção
    const sectionContainer = document.createElement('div');
    sectionContainer.className = 'destaque-container';
    
    // Adicionar título
    const sectionTitle = document.createElement('h2');
    sectionTitle.className = 'section-title';
    sectionTitle.innerHTML = `<i class="fas ${tipo === 'imóvel' ? 'fa-home' : 'fa-car'}"></i> ${tipo === 'imóvel' ? 'Imóveis' : 'Veículos'} para ${negocio}`;
    
    // Adicionar container de scroll
    const scrollContainer = document.createElement('div');
    scrollContainer.className = 'highlight-scroll';
    
    // Adicionar cards
    snapshot.forEach(doc => {
        const data = doc.data();
        data.id = doc.id;
        scrollContainer.appendChild(criarCardDestaque(data, tipo === 'automóvel'));
    });
    
    // Montar a estrutura
    sectionContainer.appendChild(sectionTitle);
    sectionContainer.appendChild(scrollContainer);
    destaqueContainer.appendChild(sectionContainer);
}
        });
        
        // Se não encontrou resultados, mostrar mensagem
        if (!encontrouResultados) {
            destaqueContainer.innerHTML = `
                <div class="highlight-empty">
                    <i class="fas fa-info-circle"></i>
                    <p>Nenhum anúncio encontrado para seus critérios atuais</p>
                    <div class="suggestion-buttons">
                        <button class="btn-suggestion" onclick="location.href='perfil.html#perfil-tab'">
                            Ajustar Minhas Preferências
                        </button>
                        <button class="btn-suggestion" onclick="carregarDestaquesGerais()">
                            Ver Todos os Destaques
                        </button>
                    </div>
                </div>
            `;
        }
        
    } catch (error) {
        console.error("Erro ao carregar destaques:", error);
        mostrarMensagemErro();
    }
}

// Função para carregar destaques com filtro mais amplo

async function carregarDestaquesGerais() {
    try {
        const destaqueContainer = document.getElementById('destaqueContainer');
        if (!destaqueContainer) return;
        
        destaqueContainer.innerHTML = '<div class="highlight-loading">Carregando destaques...</div>';
        
        // Carrega os dados em paralelo
        const [imoveisSnapshot, automoveisSnapshot] = await Promise.all([
            getDocs(query(collection(db, "imoveis"), where("destaque", "==", true), limit(5))),
            getDocs(query(collection(db, "automoveis"), where("destaque", "==", true), limit(5)))
        ]);
        
        // Verifica favoritos apenas se o usuário estiver logado
        let favoritos = [];
        if (auth.currentUser) {
            favoritos = await verificarFavoritos();
        }
        
        destaqueContainer.innerHTML = '';
        
        // Processa imóveis em destaque
        if (!imoveisSnapshot.empty) {
            const sectionContainer = document.createElement('div');
            sectionContainer.className = 'destaque-container';
            
            const sectionTitle = document.createElement('h2');
            sectionTitle.className = 'section-title';
            sectionTitle.innerHTML = '<i class="fas fa-home"></i> Imóveis em destaque';
            sectionContainer.appendChild(sectionTitle);
            
            const scrollContainer = document.createElement('div');
            scrollContainer.className = 'highlight-scroll';
            
            imoveisSnapshot.forEach(doc => {
                const data = doc.data();
                data.id = doc.id;
                const card = criarCardDestaque(data, false);
                
                // Marca como favorito se estiver na lista
                if (favoritos.includes(data.id)) {
                    const btn = card.querySelector('.favorite-btn');
                    if (btn) btn.classList.add('favorited');
                }
                
                scrollContainer.appendChild(card);
            });
            
            sectionContainer.appendChild(scrollContainer);
            destaqueContainer.appendChild(sectionContainer);
        }
        
        // Processa automóveis em destaque
        if (!automoveisSnapshot.empty) {
            const sectionContainer = document.createElement('div');
            sectionContainer.className = 'destaque-container';
            
            const sectionTitle = document.createElement('h2');
            sectionTitle.className = 'section-title';
            sectionTitle.innerHTML = '<i class="fas fa-car"></i> Veículos em destaque';
            sectionContainer.appendChild(sectionTitle);
            
            const scrollContainer = document.createElement('div');
            scrollContainer.className = 'highlight-scroll';
            
            automoveisSnapshot.forEach(doc => {
                const data = doc.data();
                data.id = doc.id;
                const card = criarCardDestaque(data, true);
                
                // Marca como favorito se estiver na lista
                if (favoritos.includes(data.id)) {
                    const btn = card.querySelector('.favorite-btn');
                    if (btn) btn.classList.add('favorited');
                }
                
                scrollContainer.appendChild(card);
            });
            
            sectionContainer.appendChild(scrollContainer);
            destaqueContainer.appendChild(sectionContainer);
        }
        
        // Mensagem se não houver destaques
        if (imoveisSnapshot.empty && automoveisSnapshot.empty) {
            destaqueContainer.innerHTML = `
                <div class="highlight-empty">
                    <i class="fas fa-star"></i>
                    <p>Nenhum anúncio em destaque no momento</p>
                </div>
            `;
        }
        
    } catch (error) {
        console.error("Erro ao carregar destaques gerais:", error);
        mostrarMensagemErro();
    }
}
function mostrarMensagemErro() {
    const destaqueContainer = document.getElementById('destaqueContainer');
    if (!destaqueContainer) return;
    
    destaqueContainer.innerHTML = `
        <div class="highlight-error">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Erro ao carregar destaques</p>
            <button class="retry-btn" onclick="carregarDestaques()">Tentar novamente</button>
        </div>
    `;
}
// Função auxiliar para carregar todos os destaques (ignorando preferências)
async function carregarTodosDestaques() {
    try {
        const destaqueContainer = document.getElementById('destaqueContainer');
        destaqueContainer.innerHTML = '<div class="highlight-loading">Carregando todos os destaques...</div>';
        
        const [imoveisSnapshot, automoveisSnapshot] = await Promise.all([
            getDocs(query(collection(db, "imoveis"), where("destaque", "==", true))),
            getDocs(query(collection(db, "automoveis"), where("destaque", "==", true)))
        ]);
        
        destaqueContainer.innerHTML = '';
        
        imoveisSnapshot.forEach(doc => {
            const data = doc.data();
            data.id = doc.id;
            destaqueContainer.appendChild(criarCardDestaque(data, false));
        });
        
        automoveisSnapshot.forEach(doc => {
            const data = doc.data();
            data.id = doc.id;
            destaqueContainer.appendChild(criarCardDestaque(data, true));
        });
        
        if (imoveisSnapshot.empty && automoveisSnapshot.empty) {
            mostrarMensagemSemResultados(destaqueContainer, null);
        }
        
    } catch (error) {
        console.error("Erro ao carregar todos os destaques:", error);
        mostrarMensagemErro(destaqueContainer);
    }
}

// Função para redirecionar para edição de perfil
function atualizarPreferencias() {
    window.location.href = "perfil.html#perfil-tab";
}






async function loadDynamicCTA() {
    const user = auth.currentUser;
    const ctaContent = document.querySelector('.cta-content');
    
    if (!ctaContent) return;

    // Mostrar estado de carregamento
    ctaContent.innerHTML = `
        <div class="loading-cta">
            <div class="spinner"></div>
        </div>
    `;

    try {
        if (user) {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                renderPersonalizedCTA(userData);
            } else {
                renderDefaultCTA();
            }
        } else {
            renderGuestCTA();
        }
    } catch (error) {
        console.error("Erro ao carregar CTA:", error);
        renderDefaultCTA();
    }
}

function renderPersonalizedCTA(userData) {
    const ctaContent = document.querySelector('.cta-content');
    
    if (userData.userRole === 'seller') {
        renderSellerCTA(userData);
    } else {
        const preferences = getUserPreferences(userData);
        renderBuyerCTA(preferences);
    }
}

function getUserPreferences(userData) {
    const buyerProfile = userData.buyerProfile || {};
    const mainInterest = buyerProfile.interests?.[0] || 'imoveis-comprar';
    const [propertyType, actionType] = mainInterest.split('-');
    
    return {
        propertyType: propertyType || 'imoveis',
        actionType: actionType || 'comprar',
        location: buyerProfile.preferenceLocation || 'sua região',
        budget: buyerProfile.budgetRange,
        lastSearch: buyerProfile.lastSearch || null
    };
}


function renderBuyerCTA(prefs) {
    const propertyNames = {
        'imoveis': { name: 'Imóvel', icon: 'fa-home' },
        'automoveis': { name: 'Veículo', icon: 'fa-car' }
    };
    
    const actionNames = {
        'comprar': { verb: 'Comprar', action: 'encontre para compra' },
        'alugar': { verb: 'Alugar', action: 'descubra para locação' }
    };
    
    const property = propertyNames[prefs.propertyType] || propertyNames['imoveis'];
    const action = actionNames[prefs.actionType] || actionNames['comprar'];
    
    const ctaContent = document.querySelector('.cta-content');
    ctaContent.className = 'cta-content cta-buyer';
    ctaContent.innerHTML = `
        <h2 class="cta-title">${action.verb} o ${property.name} Perfeito</h2>
        <p class="cta-subtitle">${prefs.lastSearch ? 'Baseado em sua última busca' : 'Nós podemos ajudar você a'} <span class="cta-highlight">${action.action}</span> ${prefs.location ? `em ${prefs.location}` : 'nas melhores condições'}</p>
        
        <div class="cta-stats">
            <div class="cta-stat">
                <div class="cta-stat-number">${prefs.budget ? 'R$ ' + prefs.budget.toLocaleString('pt-BR') : 'Melhor'}</div>
                <div class="cta-stat-label">${prefs.budget ? 'Seu orçamento' : 'Preço'}</div>
            </div>
            <div class="cta-stat">
                <div class="cta-stat-number">24h</div>
                <div class="cta-stat-label">Atualizações</div>
            </div>
            <div class="cta-stat">
                <div class="cta-stat-number">100%</div>
                <div class="cta-stat-label">Verificados</div>
            </div>
        </div>
        
        <p>Os usuários que utilizam nossos filtros inteligentes encontram o ${property.name.toLowerCase()} ideal <span class="cta-highlight">47% mais rápido</span></p>
        
        <div class="cta-buttons">
            <a href="buscar.html?type=${prefs.propertyType}&action=${prefs.actionType}${prefs.location ? '&location=' + encodeURIComponent(prefs.location) : ''}${prefs.budget ? '&max_price=' + prefs.budget : ''}" class="cta-button">
                <i class="fas ${property.icon}"></i> ${action.verb} Agora
            </a>
            <a href="perfil.html#preferences" class="cta-button cta-button-secondary">
                <i class="fas fa-sliders-h"></i> Ajustar Preferências
            </a>
        </div>
        
        <p class="cta-note"><i class="fas fa-bell"></i> Ative notificações para ser avisado sobre novos anúncios</p>
    `;
}

function renderGuestCTA() {
    const ctaContent = document.querySelector('.cta-content');
    ctaContent.className = 'cta-content cta-guest';
    ctaContent.innerHTML = `
        <h2 class="cta-title">Sua Jornada Começa Aqui</h2>
        <p class="cta-subtitle">Junte-se a <span class="cta-highlight">50.000+ usuários</span> que já encontraram ou anunciaram com sucesso em nossa plataforma</p>
        
        <div class="cta-stats">
            <div class="cta-stat">
                <div class="cta-stat-number">5.000+</div>
                <div class="cta-stat-label">Anúncios Ativos</div>
            </div>
            <div class="cta-stat">
                <div class="cta-stat-number">98%</div>
                <div class="cta-stat-label">Satisfação</div>
            </div>
            <div class="cta-stat">
                <div class="cta-stat-number">0</div>
                <div class="cta-stat-label">Taxa de Cadastro</div>
            </div>
        </div>
        
        <p>Cadastre-se em <span class="cta-highlight">menos de 1 minuto</span> e tenha acesso completo às melhores oportunidades</p>
        
        <div class="cta-buttons">
            <a href="registro.html?action=buscar" class="cta-button">
                <i class="fas fa-search"></i> Buscar Imóveis/Veículos
            </a>
            <a href="registro.html?action=anunciar" class="cta-button">
                <i class="fas fa-plus"></i> Anunciar Propriedade
            </a>
        </div>
        
        <p class="cta-note"><i class="fas fa-shield-alt"></i> Ambiente 100% seguro e verificado</p>
    `;
}

function renderDefaultCTA() {
    const ctaContent = document.querySelector('.cta-content');
    ctaContent.className = 'cta-content cta-default';
    ctaContent.innerHTML = `
        <h2 class="cta-title">Encontre o que Você Precisa</h2>
        <p class="cta-subtitle">Acesso a <span class="cta-highlight">milhares de oportunidades</span> em imóveis e veículos em um só lugar</p>
        
        <div class="cta-buttons">
            <a href="registro.html" class="cta-button">
                <i class="fas fa-user-plus"></i> Criar Conta Gratuita
            </a>
        </div>
        
        <p class="cta-note"><i class="fas fa-clock"></i> Leva menos de 1 minuto para se cadastrar</p>
    `;
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    loadDynamicCTA();
});

onAuthStateChanged(auth, (user) => {
    loadDynamicCTA();
});

// Adicione esta função para contar anúncios ativos
async function contarAnunciosAtivos(userId) {
    try {
        // Contar imóveis ativos
        const imoveisQuery = query(
            collection(db, "imoveis"),
            where("userId", "==", userId),
            where("status", "==", "ativo")
        );
        
        // Contar automóveis ativos
        const automoveisQuery = query(
            collection(db, "automoveis"),
            where("userId", "==", userId),
            where("status", "==", "ativo")
        );

        const [imoveisSnapshot, automoveisSnapshot] = await Promise.all([
            getDocs(imoveisQuery),
            getDocs(automoveisQuery)
        ]);

        return imoveisSnapshot.size + automoveisSnapshot.size;
    } catch (error) {
        console.error("Erro ao contar anúncios:", error);
        return 0; // Retorna 0 em caso de erro
    }
}

// Nova função para buscar estatísticas reais
async function calcularEstatisticasReais(userId) {
    try {
        const [imoveisSnapshot, automoveisSnapshot] = await Promise.all([
            getDocs(query(collection(db, "imoveis"), where("userId", "==", userId), where("status", "==", "ativo"))),
            getDocs(query(collection(db, "automoveis"), where("userId", "==", userId), where("status", "==", "ativo")))
        ]);

        let totalViews = 0;
        let totalContacts = 0;

        imoveisSnapshot.forEach(doc => {
            const data = doc.data();
            totalViews += data.visualizacoes || 0;
            totalContacts += data.contatos?.length || 0;
        });

        automoveisSnapshot.forEach(doc => {
            const data = doc.data();
            totalViews += data.visualizacoes || 0;
            totalContacts += data.contatos?.length || 0;
        });

        return {
            views: totalViews,
            contacts: totalContacts
        };

    } catch (error) {
        console.error("Erro ao calcular estatísticas:", error);
        return { views: 0, contacts: 0 };
    }
}

async function calcularEstatisticasAnuncios(userId) {
    try {
        const [imoveisSnapshot, automoveisSnapshot] = await Promise.all([
            getDocs(query(collection(db, "imoveis"), where("userId", "==", userId), where("status", "==", "ativo"))),
            getDocs(query(collection(db, "automoveis"), where("userId", "==", userId), where("status", "==", "ativo")))
        ]);

        let totalViews = 0;
        let totalContacts = 0;

        // Processa imóveis
        imoveisSnapshot.forEach(doc => {
            const data = doc.data();
            totalViews += data.visualizacoes || 0;
            totalContacts += data.contatos?.length || 0;
        });

        // Processa automóveis
        automoveisSnapshot.forEach(doc => {
            const data = doc.data();
            totalViews += data.visualizacoes || 0;
            totalContacts += data.contatos?.length || 0;
        });

        return {
            views: totalViews,
            contacts: totalContacts
        };

    } catch (error) {
        console.error("Erro ao calcular estatísticas:", error);
        return { views: 0, contacts: 0 };
    }
}

async function renderSellerCTA(userData) {
    const ctaContent = document.querySelector('.cta-content');
    const userId = auth.currentUser?.uid;
    
    if (!userId) return;
    
    // Mostrar estado de carregamento
    ctaContent.innerHTML = `
        <div class="loading-cta">
            <div class="spinner"></div>
            <p>Carregando seus dados...</p>
        </div>
    `;

    try {
        const [activeListings, stats] = await Promise.all([
            contarAnunciosAtivos(userId),
            calcularEstatisticasReais(userId) // Nova função para buscar dados reais
        ]);

        ctaContent.className = 'cta-content cta-seller';
        ctaContent.innerHTML = `
            <h2 class="cta-title">Potencialize Seus Negócios</h2>
            <p class="cta-subtitle">Você tem <span class="cta-highlight">${activeListings} anúncio(s) ativo(s)</span> gerando oportunidades</p>
            
            <div class="cta-stats">
                <div class="cta-stat">
                    <div class="cta-stat-number">${activeListings}</div>
                    <div class="cta-stat-label">Anúncios Ativos</div>
                </div>
                <div class="cta-stat">
                    <div class="cta-stat-number">${stats.views || 0}</div>
                    <div class="cta-stat-label">Visualizações</div>
                </div>
                <div class="cta-stat">
                    <div class="cta-stat-number">${stats.contacts || 0}</div>
                    <div class="cta-stat-label">Contatos</div>
                </div>
            </div>
            
            <p>Nossos corretores premium conseguem <span class="cta-highlight">3x mais negócios</span> que a média do mercado</p>
            
            <div class="cta-buttons">
                <a href="anunciar.html" class="cta-button">
                    <i class="fas fa-plus-circle"></i> Novo Anúncio
                </a>
                ${activeListings > 0 ? `
                <a href="perfil.html#meus-anuncios" class="cta-button cta-button-secondary" id="btn-meus-anuncios">
                    <i class="fas fa-list"></i> Gerenciar Anúncios
                </a>
                ` : ''}
            </div>
            
            ${activeListings === 0 ? `
            <div class="cta-alert">
                <i class="fas fa-exclamation-circle"></i>
                <p>Você não tem anúncios ativos no momento. Crie seu primeiro anúncio para começar!</p>
            </div>
            ` : ''}
            
            <p class="cta-note"><i class="fas fa-bolt"></i> Anúncios completos recebem até 70% mais contatos</p>
        `;

        // Configura atualização em tempo real (sem alterar o layout)
        configurarAtualizacaoEmTempoReal(userId);

        // Mantém o evento original para abrir a aba
        document.getElementById('btn-meus-anuncios')?.addEventListener('click', function(e) {
            sessionStorage.setItem('openAnunciosTab', 'true');
        });

    } catch (error) {
        console.error("Erro ao renderizar CTA:", error);
        ctaContent.innerHTML = `
            <div class="cta-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Não foi possível carregar seus dados de anúncios</p>
                <button class="cta-retry" onclick="loadDynamicCTA()">Tentar novamente</button>
            </div>
        `;
    }
}

// Função para atualização em tempo real (mantendo o layout)
function configurarAtualizacaoEmTempoReal(userId) {
    const queries = [
        query(collection(db, "imoveis"), where("userId", "==", userId)),
        query(collection(db, "automoveis"), where("userId", "==", userId))
    ];

    const unsubscribeFunctions = queries.map(q => 
        onSnapshot(q, () => {
            calcularEstatisticasReais(userId).then(stats => {
                const viewsElement = document.querySelector('.cta-stat:nth-child(2) .cta-stat-number');
                const contactsElement = document.querySelector('.cta-stat:nth-child(3) .cta-stat-number');
                
                if (viewsElement) viewsElement.textContent = stats.views || 0;
                if (contactsElement) contactsElement.textContent = stats.contacts || 0;
            });
        })
    );

    return () => unsubscribeFunctions.forEach(fn => fn());
}


// Função de atualização em tempo real corrigida
function configurarAtualizacaoTempoReal(userId) {
    const imoveisQuery = query(
        collection(db, "imoveis"), 
        where("userId", "==", userId),
        where("status", "==", "ativo")
    );
    
    const automoveisQuery = query(
        collection(db, "automoveis"), 
        where("userId", "==", userId),
        where("status", "==", "ativo")
    );

    const unsubscribeImoveis = onSnapshot(imoveisQuery, () => {
        atualizarEstatisticas(userId);
    });

    const unsubscribeAutomoveis = onSnapshot(automoveisQuery, () => {
        atualizarEstatisticas(userId);
    });

    return () => {
        unsubscribeImoveis();
        unsubscribeAutomoveis();
    };
}

// Função auxiliar para atualizar estatísticas
async function atualizarEstatisticas(userId) {
    const stats = await calcularEstatisticasAnuncios(userId);
    document.getElementById('stat-views').textContent = stats.views;
    document.getElementById('stat-contacts').textContent = stats.contacts;
}

// Atualiza os números na tela com animação
function atualizarDisplayStats(stats) {
    const elements = {
        active: document.getElementById('stat-active'),
        views: document.getElementById('stat-views'),
        contacts: document.getElementById('stat-contacts')
    };

    // Animação de atualização
    for (const [key, element] of Object.entries(elements)) {
        if (element) {
            element.classList.add('stat-updating');
            setTimeout(() => {
                element.textContent = stats[key] || 0;
                element.classList.remove('stat-updating');
                element.classList.add('stat-pulse');
                setTimeout(() => element.classList.remove('stat-pulse'), 500);
            }, 300);
        }
    }
}
onAuthStateChanged(auth, (user) => {
    if (user) {
        renderSellerCTA(user);
    }
});
async function getSellerStats(userId) {
    try {
        // Busca todos os anúncios do usuário
        const [imoveisSnapshot, automoveisSnapshot] = await Promise.all([
            getDocs(query(collection(db, "imoveis"), where("userId", "==", userId))),
            getDocs(query(collection(db, "automoveis"), where("userId", "==", userId)))
        ]);

        let totalViews = 0;
        let totalContacts = 0;

        // Processa imóveis
        imoveisSnapshot.forEach(doc => {
            const data = doc.data();
            totalViews += data.visualizacoes || 0;
            totalContacts += data.contatos?.length || 0;
        });

        // Processa automóveis
        automoveisSnapshot.forEach(doc => {
            const data = doc.data();
            totalViews += data.visualizacoes || 0;
            totalContacts += data.contatos?.length || 0;
        });

        return {
            views: totalViews,
            contacts: totalContacts
        };

    } catch (error) {
        console.error("Erro ao buscar estatísticas:", error);
        return { views: 0, contacts: 0 };
    }
}

// ============== EXPORTAÇÕES GLOBAIS ==============
window.mudarImagem = mudarImagem;
window.openDetailsModal = openDetailsModal;
window.closeDetailsModal = closeDetailsModal;
window.buscarCarros = buscarCarros;
window.buscarImoveis = buscarImoveis;
window.carregarDestaques =         carregarDestaques;
window.preencherBairros = preencherBairros;
console.log("Elementos no DOM:");
console.log("campos-imovel:", document.getElementById("campos-imovel"));
console.log("campos-carro:", document.getElementById("campos-carro"));
console.log("resultados:", document.getElementById("resultados"));
console.log("form-pesquisa:", document.getElementById("form-pesquisa"));
