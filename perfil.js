 // Importar funções do Firebase corretamente (versão consolidada)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

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
const db = getFirestore(app);  // Adicionei esta linha que estava faltando
const auth = getAuth(app);
const storage = getStorage(app);

// Ativar persistência da autenticação
setPersistence(auth, browserLocalPersistence)
  .then(() => console.log("Persistência ativada!"))
  .catch((error) => console.error("Erro na persistência:", error));

console.log("Firebase inicializado com sucesso!");

export { app, db, auth, storage };


// Elementos do formulário e do card
const perfilForm = document.getElementById("perfil-form");
const userCard = document.getElementById("user-card");
const cardNome = document.getElementById("card-nome");
const cardTelefone = document.getElementById("card-telefone");
const cardEmail = document.getElementById("card-email");
const cardCpfCnpj = document.getElementById("card-cpf-cnpj");
const cardTipoUsuario = document.getElementById("card-tipo-usuario");
const cardComum = document.getElementById("card-comum");
const cardTipoInteresse = document.getElementById("card-tipo-interesse");
const cardImoveis = document.getElementById("card-imoveis");
const cardLocalizacaoImovel = document.getElementById("card-localizacao-imovel");
const cardFaixaPrecoImovel = document.getElementById("card-faixa-preco-imovel");
const cardAutomoveis = document.getElementById("card-automoveis");
const cardMarcaAutomovel = document.getElementById("card-marca-automovel");
const cardFaixaPrecoAutomovel = document.getElementById("card-faixa-preco-automovel");
const cardComercial = document.getElementById("card-comercial");
const cardCreci = document.getElementById("card-creci");
const cardCnpj = document.getElementById("card-cnpj");
const cardAreaAtuacao = document.getElementById("card-area-atuacao");
const cardDescricaoEmpresa = document.getElementById("card-descricao-empresa");

// Seleciona os elementos do DOM para alternar entre formulários
const tipoUsuarioInput = document.getElementById("tipo-usuario");
const formComum = document.getElementById("form-comum");
const formComercial = document.getElementById("form-comercial");
const tipoInteresseInput = document.getElementById("tipo-interesse");
const formImoveis = document.getElementById("form-imoveis");
const formAutomoveis = document.getElementById("form-automoveis");




async function carregarMeusAnuncios() {
    try {
        console.log("[INÍCIO] Carregando anúncios...");
        
        const user = auth.currentUser;
        if (!user) {
            showAlert('Você precisa estar logado para ver seus anúncios', 'error');
            return;
        }

        // Elementos
        const elements = {
            todos: document.getElementById("count-todos"),
            ativos: document.getElementById("count-ativos"),
            inativos: document.getElementById("count-inativos"),
            destaques: document.getElementById("count-destaques"),
            container: document.getElementById("anuncios-container"),
            noAnuncios: document.getElementById("no-anuncios"),
            buscaInput: document.getElementById("busca-anuncios"),
            filterButtons: document.querySelectorAll('[data-filter-status]'),
            typeButtons: document.querySelectorAll('[data-filter]')
        };

        // Busca dos anúncios
        console.log("[1] Buscando anúncios no Firestore...");
        const [imoveisSnapshot, automoveisSnapshot] = await Promise.all([
            getDocs(query(collection(db, "imoveis"), where("userId", "==", user.uid))),
            getDocs(query(collection(db, "automoveis"), where("userId", "==", user.uid)))
        ]);

        // Processamento dos anúncios
        let todosAnuncios = [];
        const counters = { todos: 0, ativos: 0, inativos: 0, destaques: 0 };

        const processarAnuncio = (doc, tipo) => {
            const data = doc.data();
            const anuncio = {
                ...data,
                id: doc.id,
                tipo: tipo.toLowerCase(),
                status: (data.status || 'ativo').toLowerCase(),
                destaque: data.destaque === true
            };
            
            // Atualiza contadores
            counters.todos++;
            if (anuncio.status === 'ativo') counters.ativos++;
            if (anuncio.status === 'inativo') counters.inativos++;
            if (anuncio.destaque) counters.destaques++;
            
            todosAnuncios.push(anuncio);
        };

        imoveisSnapshot.forEach(doc => processarAnuncio(doc, "imovel"));
        automoveisSnapshot.forEach(doc => processarAnuncio(doc, "automovel"));

        // Atualiza contadores na UI
        if (elements.todos) elements.todos.textContent = counters.todos;
        if (elements.ativos) elements.ativos.textContent = counters.ativos;
        if (elements.inativos) elements.inativos.textContent = counters.inativos;
        if (elements.destaques) elements.destaques.textContent = counters.destaques;

        function renderizarAnuncios(filtroStatus = 'todos', filtroTipo = 'todos', termoBusca = '') {
    const anunciosFiltrados = todosAnuncios.filter(anuncio => {
        // Padroniza o status para minúsculas
        const statusAnuncio = anuncio.status.toLowerCase();
        
        // Filtro por status
        const statusMatch = 
            filtroStatus === 'todos' || 
            (filtroStatus === 'ativos' && statusAnuncio === 'ativo') ||
            (filtroStatus === 'inativos' && statusAnuncio === 'inativo') ||
            (filtroStatus === 'destaques' && anuncio.destaque);
        
        // Filtro por tipo
        const tipoMatch = 
            filtroTipo === 'todos' || 
            anuncio.tipo === filtroTipo;
        
        // Filtro por busca
        const buscaMatch = 
            termoBusca === '' ||
            (anuncio.titulo && anuncio.titulo.toLowerCase().includes(termoBusca)) ||
            (anuncio.descricao && anuncio.descricao.toLowerCase().includes(termoBusca));
        
        return statusMatch && tipoMatch && buscaMatch;
    });

    // Renderiza os anúncios filtrados
    if (elements.container) {
        elements.container.innerHTML = anunciosFiltrados
            .map(anuncio => criarCardAnuncio(anuncio, anuncio.tipo, anuncio.id))
            .join('');
    }

    // Mostra mensagem se não houver anúncios
    if (elements.noAnuncios) {
        elements.noAnuncios.classList.toggle("d-none", anunciosFiltrados.length > 0);
    }
}


     console.log("Todos anúncios carregados:", todosAnuncios.map(a => ({
    id: a.id,
    tipo: a.tipo,
    status: a.status,
    destaque: a.destaque,
    titulo: a.titulo
})));
        // Configuração dos filtros
        function configurarFiltros() {
            // Filtro por status (ativos/inativos/destaques)
            elements.filterButtons?.forEach(button => {
                button.addEventListener('click', function() {
                    const status = this.getAttribute('data-filter-status');
                    renderizarAnuncios(status, 'todos', elements.buscaInput?.value.toLowerCase() || '');
                    
                    // Atualiza UI dos botões
                    elements.filterButtons?.forEach(btn => 
                        btn.classList.toggle('active', btn === this)
                    );
                });
            });

            // Filtro por tipo (imóvel/automóvel)
            elements.typeButtons?.forEach(button => {
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    const tipo = this.getAttribute('data-filter');
                    renderizarAnuncios('todos', tipo, elements.buscaInput?.value.toLowerCase() || '');
                    
                    // Atualiza UI dos botões
                    elements.typeButtons?.forEach(btn => 
                        btn.classList.toggle('active', btn === this)
                    );
                });
            });

            // Filtro por busca
            elements.buscaInput?.addEventListener('input', function() {
                renderizarAnuncios('todos', 'todos', this.value.toLowerCase());
            });
        }

        // Renderiza todos os anúncios inicialmente
        renderizarAnuncios();
        configurarFiltros();

        console.log("[FIM] Anúncios carregados com sucesso");

    } catch (error) {
        console.error("[ERRO] Falha ao carregar anúncios:", error);
        showAlert("Erro ao carregar anúncios", "error");
    }
}

// Inicialização
document.getElementById('anuncios-tab')?.addEventListener('shown.bs.tab', carregarMeusAnuncios);
// SOLUÇÃO ADICIONAL PARA TABS DO BOOTSTRAP
document.getElementById('anuncios-tab')?.addEventListener('shown.bs.tab', () => {
    console.log("Tab de anúncios ativada - recarregando contadores");
    setTimeout(carregarMeusAnuncios, 50);
});

// SOLUÇÃO NUCLEAR (remove e recria os elementos)
setTimeout(() => {
    const replaceCounter = (id) => {
        const el = document.getElementById(id);
        if (el) {
            const newEl = el.cloneNode(true);
            el.parentNode.replaceChild(newEl, el);
        }
    };
    
    replaceCounter("count-todos");
    replaceCounter("count-ativos");
    replaceCounter("count-inativos");
    replaceCounter("count-destaques");
}, 200);

document.addEventListener("DOMContentLoaded", function () {
    console.log('[DEBUG] Iniciando inicializarEventosAnuncios()');
    console.log('Eventos de anúncio inicializados');

    // Configuração dos eventos de filtro
    const filtroTipo = document.getElementById("filtro-tipo");
    if (filtroTipo) {
        filtroTipo.addEventListener("change", function() {
            // Código de filtragem aqui
        });
    }

    // Configuração dos eventos de busca
    const buscaInput = document.getElementById("busca-anuncios");
    if (buscaInput) {
        buscaInput.addEventListener("input", function() {
            // Código de busca aqui
        });
    }

    // Eventos de clique corrigidos
    document.addEventListener("click", async function(e) {
        console.log('[DEBUG] Clique detectado no elemento:', e.target);

        const btnStatus = e.target.closest(".btn-status-toggle");
        const btnDestaque = e.target.closest(".btn-destaque-toggle");
        const btnEditar = e.target.closest(".btn-editar");
        const btnExcluir = e.target.closest(".btn-excluir");

        if (!btnStatus && !btnDestaque && !btnEditar && !btnExcluir) return;

        const card = e.target.closest(".anuncio-card");
        if (!card) {
            console.error('[ERRO] Não encontrou o card pai');
            return;
        }

        const id = card.dataset.id;
        const tipo = card.dataset.tipo;
        const collectionName = tipo === "imovel" ? "imoveis" : "automoveis";
        console.log(`[DEBUG] ID: ${id}, Tipo: ${tipo}, Coleção: ${collectionName}`);

        try {
            if (btnStatus) {
                await handleStatusToggle(btnStatus, id, collectionName);
            }
            if (btnDestaque) {
                await handleDestaqueToggle(btnDestaque, id, collectionName);
            }
            if (btnEditar) {
                window.location.href = `editar-anuncio.html?id=${id}&tipo=${tipo}`;
                return;
            }
            if (btnExcluir) {
                confirmarExclusaoAnuncio(id, tipo);
                return;
            }
            setTimeout(carregarMeusAnuncios, 1000);
        } catch (error) {
            console.error('[ERRO] Falha na operação:', error);
            showAlert("Erro ao processar sua solicitação", "error");
        }
    });

    console.log('[DEBUG] Eventos configurados com sucesso');
});

// Função auxiliar para alternar status (transação segura)
async function toggleStatusAnuncio(id, tipo) {
    const collectionName = tipo === "imovel" ? "imoveis" : "automoveis";
    const docRef = doc(db, collectionName, id);

    try {
        return await runTransaction(db, async (transaction) => {
            const docSnap = await transaction.get(docRef);
            if (!docSnap.exists()) throw new Error("Documento não existe");

            const current = docSnap.data().status || "ativo";
            const novoStatus = current === "ativo" ? "inativo" : "ativo";

            transaction.update(docRef, { status: novoStatus });
            return novoStatus;
        });
    } catch (error) {
        console.error("[ERRO] Na transação de status:", error);
        throw error;
    }
}

// Uso com tratamento de erro completo
btn.addEventListener("click", async () => {
  try {
    const novoStatus = await toggleStatusAnuncio(id, tipo);
    
    // Atualização otimista da UI
    btn.dataset.status = novoStatus;
    btn.textContent = novoStatus === "ativo" ? "Desativar" : "Ativar";
    
    showAlert(`Status atualizado para ${novoStatus}`, "success");
    
    // Atualiza contadores após 1s
    setTimeout(carregarMeusAnuncios, 1000);
    
  } catch (error) {
    console.error("Falha na transação:", error);
    showAlert("Erro ao atualizar status. Recarregue a página.", "error");
    
    // Reverte a UI em caso de erro
    btn.textContent = btn.dataset.status === "ativo" ? "Desativar" : "Ativar";
  }
});

// Função para confirmar exclusão
async function confirmarExclusaoAnuncio(id, tipo) {
    Swal.fire({
        title: "Tem certeza?",
        text: "Você não poderá reverter isso!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sim, excluir!",
        cancelButtonText: "Cancelar"
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const collectionName = tipo === "imovel" ? "imoveis" : "automoveis";
                await deleteDoc(doc(db, collectionName, id));
                
                // Remove imagens do Storage (se aplicável)
                // ... código para deletar imagens ...
                
                showAlert("Anúncio excluído com sucesso!", "success");
                carregarMeusAnuncios(); // Recarrega a lista
            } catch (error) {
                console.error("Erro ao excluir anúncio:", error);
                showAlert("Erro ao excluir anúncio", "error");
            }
        }
    });
}

// Função para excluir anúncio
async function excluirAnuncio(id, tipo) {
    try {
        await deleteDoc(doc(db, tipo === 'imovel' ? 'imoveis' : 'automoveis', id));
        showAlert('Anúncio excluído com sucesso!', 'success');
        carregarMeusAnuncios(); // Recarrega a lista
    } catch (error) {
        console.error("Erro ao excluir anúncio:", error);
        showAlert('Erro ao excluir anúncio. Tente novamente.', 'error');
    }
}


async function handleStatusToggle(btn, id, collectionName) {
    const currentStatus = btn.dataset.status;
    const novoStatus = currentStatus === "ativo" ? "inativo" : "ativo";
    console.log(`[DEBUG] Alterando status para: ${novoStatus}`);

    try {
        await updateDoc(doc(db, collectionName, id), { status: novoStatus });
        console.log(`[DEBUG] Documento atualizado com sucesso!`);
        btn.dataset.status = novoStatus;
        btn.classList.toggle("active", novoStatus === "ativo");
        showAlert(`Status alterado para ${novoStatus}`, "success");
    } catch (error) {
        console.error("[ERRO] Falha ao atualizar documento:", error);
        showAlert("Erro ao alterar status", "error");
    }
}


async function handleDestaqueToggle(btn, id, collectionName) {
    const currentDestaque = btn.dataset.destaque === "true";
    const novoDestaque = !currentDestaque;
    console.log(`[DEBUG] Alterando destaque para: ${novoDestaque}`);

    try {
        await updateDoc(doc(db, collectionName, id), { destaque: novoDestaque });
        btn.dataset.destaque = novoDestaque;
        btn.classList.toggle("active", novoDestaque);
        showAlert(`Destaque ${novoDestaque ? "ativado" : "removido"}`, "success");
    } catch (error) {
        console.error("Erro ao alterar destaque:", error);
        showAlert("Erro ao alterar destaque", "error");
    }
}


// Função para criar o card do anúncio
function criarCardAnuncio(data, tipo, id) {
    const status = data.status || 'ativo';
    const destaque = data.destaque || false;
    const dataFormatada = data.data?.toDate ? data.data.toDate().toLocaleDateString('pt-BR') : 'Data não disponível';
    const precoFormatado = data.preco?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'Preço não informado';

    return `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="anuncio-card" data-id="${id}" data-tipo="${tipo.toLowerCase()}">
                <div class="anuncio-header">
                    <img src="${data.imagens?.[0] || 'img/sem-imagem.jpg'}" alt="${data.titulo}" class="anuncio-imagem-principal">
                    <span class="anuncio-badge">${tipo}</span>
                    
                    <div class="anuncio-controls">
                        <!-- Botão Status -->
                        <button class="btn-status-toggle ${status === 'ativo' ? 'active' : ''}" 
                                data-status="${status}">
                            <span class="toggle-handle"></span>
                        </button>
                        
                        <!-- Botão Destaque -->
                        <button class="btn-destaque-toggle ${destaque ? 'active' : ''}"
                                data-destaque="${destaque}">
                            <i class="fas fa-star"></i>
                        </button>
                    </div>
                </div>
                
                <div class="anuncio-body">
                    <h3 class="anuncio-titulo">${data.titulo || 'Sem título'}</h3>
                    <div class="anuncio-preco">${precoFormatado}</div>
                    
                    <div class="anuncio-detalhes">
                        ${tipo === 'Imóvel' ? gerarDetalhesImovel(data) : gerarDetalhesAutomovel(data)}
                    </div>
                    
                    <p class="anuncio-descricao">${data.descricao || 'Nenhuma descrição fornecida'}</p>
                </div>
                
                <div class="anuncio-footer">
                    <span class="anuncio-data">${dataFormatada}</span>
                    <div class="anuncio-acoes">
                        <button class="btn-editar" data-id="${id}" data-tipo="${tipo.toLowerCase()}">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn-excluir" data-id="${id}" data-tipo="${tipo.toLowerCase()}">
                            <i class="fas fa-trash"></i> Excluir
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Configuração dos eventos
function configurarEventosAnuncios() {
    document.addEventListener('click', async (e) => {
        // Botão de Status
        if (e.target.closest('.btn-status-toggle')) {
            const btn = e.target.closest('.btn-status-toggle');
            const card = btn.closest('.anuncio-card');
            if (!card) return;

            const id = card.dataset.id;
            const tipo = card.dataset.tipo;
            const currentStatus = btn.dataset.status;
            const novoStatus = currentStatus === 'ativo' ? 'inativo' : 'ativo';

            try {
                const collectionName = tipo === 'imovel' ? 'imoveis' : 'automoveis';
                await updateDoc(doc(db, collectionName, id), { status: novoStatus });
                
                btn.dataset.status = novoStatus;
                btn.classList.toggle('active', novoStatus === 'ativo');
                showAlert(`Status alterado para ${novoStatus}`, 'success');
                setTimeout(carregarMeusAnuncios, 1000);
            } catch (error) {
                console.error('Erro ao alterar status:', error);
                showAlert('Erro ao alterar status', 'error');
            }
        }

        // Botão de Destaque
        if (e.target.closest('.btn-destaque-toggle')) {
            const btn = e.target.closest('.btn-destaque-toggle');
            const card = btn.closest('.anuncio-card');
            if (!card) return;

            const id = card.dataset.id;
            const tipo = card.dataset.tipo;
            const currentDestaque = btn.dataset.destaque === 'true';
            const novoDestaque = !currentDestaque;

            try {
                const collectionName = tipo === 'imovel' ? 'imoveis' : 'automoveis';
                await updateDoc(doc(db, collectionName, id), { destaque: novoDestaque });
                
                btn.dataset.destaque = novoDestaque;
                btn.classList.toggle('active', novoDestaque);
                showAlert(`Destaque ${novoDestaque ? 'ativado' : 'removido'}`, 'success');
                setTimeout(carregarMeusAnuncios, 1000);
            } catch (error) {
                console.error('Erro ao alterar destaque:', error);
                showAlert('Erro ao alterar destaque', 'error');
            }
        }

        // Botão Editar
        if (e.target.closest('.btn-editar')) {
            const btn = e.target.closest('.btn-editar');
            const id = btn.dataset.id;
            const tipo = btn.dataset.tipo;
            window.location.href = `editar-anuncio.html?id=${id}&tipo=${tipo}`;
        }

        // Botão Excluir
        if (e.target.closest('.btn-excluir')) {
            const btn = e.target.closest('.btn-excluir');
            const id = btn.dataset.id;
            const tipo = btn.dataset.tipo;
            confirmarExclusaoAnuncio(id, tipo);
        }
    });
}

// Inicialização quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', configurarEventosAnuncios);
} else {
    configurarEventosAnuncios();
}

// Inicializa os eventos quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    configurarEventosAnuncios();
    console.log('Eventos de anúncio configurados com sucesso');
});


// Função para gerar detalhes de imóvel
function gerarDetalhesImovel(data) {
    return `
        <div class="detalhes-grid">
            <div><i class="fas fa-bed"></i> ${data.quartos || 0} Quartos</div>
            <div><i class="fas fa-bath"></i> ${data.banheiros || 0} Banheiros</div>
            <div><i class="fas fa-car"></i> ${data.garagem || 0} Vagas</div>
            <div><i class="fas fa-ruler-combined"></i> ${data.area || 0}m²</div>
            <div><i class="fas fa-map-marker-alt"></i> ${data.bairro || 'Localização não informada'}</div>
        </div>
    `;
}


// Função para gerar detalhes de automóvel
function gerarDetalhesAutomovel(data) {
    return `
        <div class="detalhes-grid">
            <div><i class="fas fa-car"></i> ${data.marca || 'Marca não informada'}</div>
            <div><i class="fas fa-tag"></i> ${data.modelo || 'Modelo não informado'}</div>
            <div><i class="fas fa-calendar-alt"></i> ${data.ano || 'Ano não informado'}</div>
            <div><i class="fas fa-tachometer-alt"></i> ${data.km ? data.km.toLocaleString() + ' km' : 'KM não informada'}</div>
            <div><i class="fas fa-palette"></i> ${data.cor || 'Cor não informada'}</div>
        </div>
    `;
}
async function carregarFavoritos(userId) {
    try {
        // Mostrar loader
        document.getElementById('profile-loader').classList.remove('hidden');
        
        // 1. Obter a lista de IDs dos favoritos do usuário
        const userDoc = await getDoc(doc(db, "users", userId));
        const favoritosIds = userDoc.data()?.favoritos || [];
        
        console.log("IDs dos favoritos encontrados:", favoritosIds); // DEBUG
        
        // Se não houver favoritos
        if (favoritosIds.length === 0) {
            document.getElementById('no-favoritos').classList.remove('d-none');
            document.getElementById('favoritos-container').innerHTML = '';
            return;
        }
        
        // 2. Buscar os anúncios correspondentes
        const anunciosPromises = favoritosIds.map(async (adId) => {
            console.log(`Buscando anúncio ${adId}`); // DEBUG
            
            // Primeiro tenta encontrar em imóveis
            const imovelRef = doc(db, "imoveis", adId);
            const imovelSnap = await getDoc(imovelRef);
            
            if (imovelSnap.exists()) {
                console.log(`Encontrado imóvel ${adId}`); // DEBUG
                return { ...imovelSnap.data(), id: imovelSnap.id, tipo: 'imovel' };
            }
            
            // Se não encontrou em imóveis, tenta automóveis
            const automovelRef = doc(db, "automoveis", adId);
            const automovelSnap = await getDoc(automovelRef);
            
            if (automovelSnap.exists()) {
                console.log(`Encontrado automóvel ${adId}`); // DEBUG
                return { ...automovelSnap.data(), id: automovelSnap.id, tipo: 'automovel' };
            }
            
            console.log(`Anúncio ${adId} não encontrado em nenhuma coleção`); // DEBUG
            return null;
        });
        
        // Espera todas as buscas e filtra os nulos
        const anuncios = (await Promise.all(anunciosPromises)).filter(Boolean);
        console.log("Anúncios encontrados:", anuncios); // DEBUG
        
        // 3. Renderizar os favoritos
        const favoritosContainer = document.getElementById('favoritos-container');
        favoritosContainer.innerHTML = '';
        
        if (anuncios.length === 0) {
            document.getElementById('no-favoritos').classList.remove('d-none');
        } else {
            document.getElementById('no-favoritos').classList.add('d-none');
            anuncios.forEach(anuncio => {
                const isAutomovel = anuncio.tipo === 'automovel';
                favoritosContainer.innerHTML += criarCardFavorito(anuncio, isAutomovel);
            });
            
            // Configurar eventos dos botões
            setupFavoritosEvents();
        }
        
    } catch (error) {
        console.error("Erro ao carregar favoritos:", error);
        showAlert("Erro ao carregar anúncios favoritos", "error");
    } finally {
        // Esconder loader
        document.getElementById('profile-loader').classList.add('hidden');
    }
}


function criarCardFavorito(anuncio, isAutomovel) {
    const primeiraImagem = anuncio.imagens?.[0] || 'images/default.jpg';
    const precoFormatado = anuncio.preco?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'Preço não informado';
    
    return `
        <div class="col-md-6 col-lg-4 mb-4" data-ad-id="${anuncio.id}">
            <div class="anuncio-card">
                <div class="anuncio-header">
                    <img src="${primeiraImagem}" alt="${anuncio.titulo}" class="anuncio-imagem-principal">
                    <span class="anuncio-badge">${isAutomovel ? 'Automóvel' : 'Imóvel'}</span>
                    <button class="btn-remover-favorito" data-ad-id="${anuncio.id}">
                        <i class="fas fa-trash"></i> Remover
                    </button>
                </div>
                <div class="anuncio-body">
                    <h3 class="anuncio-titulo">${anuncio.titulo || 'Sem título'}</h3>
                    <div class="anuncio-preco">${precoFormatado}</div>
                    <div class="detalhes-grid">
                        ${isAutomovel ? getAutomovelDetails(anuncio) : getImovelDetails(anuncio)}
                    </div>
                    <p class="anuncio-descricao">${anuncio.descricao || 'Nenhuma descrição fornecida'}</p>
                </div>
                <div class="anuncio-footer">
                    <button class="btn-ver-detalhes" data-ad-id="${anuncio.id}" data-tipo="${isAutomovel ? 'automovel' : 'imovel'}">
                        <i class="fas fa-eye"></i> Ver Detalhes
                    </button>
                </div>
            </div>
        </div>
    `;
}

function setupFavoritosEvents() {
    // Botão de remover dos favoritos
    document.querySelectorAll('.btn-remover-favorito').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const adId = btn.getAttribute('data-ad-id');
            
            try {
                const user = auth.currentUser;
                if (!user) return;
                
                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userDocRef);
                const favoritos = userDoc.data()?.favoritos || [];
                
                // Remove o ID do array de favoritos
                const novosFavoritos = favoritos.filter(id => id !== adId);
                
                // Atualiza no Firestore
                await updateDoc(userDocRef, {
                    favoritos: novosFavoritos
                });
                
                // Remove o card da UI
                document.querySelector(`[data-ad-id="${adId}"]`).remove();
                
                // Mostra mensagem se não houver mais favoritos
                if (novosFavoritos.length === 0) {
                    document.getElementById('no-favoritos').classList.remove('d-none');
                }
                
                showAlert("Anúncio removido dos favoritos", "success");
                
            } catch (error) {
                console.error("Erro ao remover favorito:", error);
                showAlert("Erro ao remover dos favoritos", "error");
            }
        });
    });
    
    // Botão de ver detalhes
    document.querySelectorAll('.btn-ver-detalhes').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const adId = btn.getAttribute('data-ad-id');
            const tipo = btn.getAttribute('data-tipo');
            
            try {
                const docRef = doc(db, `${tipo}s`, adId);
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists()) {
                    openDetailsModal(docSnap.data(), tipo === 'automovel');
                } else {
                    showAlert("Anúncio não encontrado", "error");
                }
            } catch (error) {
                console.error("Erro ao carregar detalhes:", error);
                showAlert("Erro ao carregar detalhes do anúncio", "error");
            }
        });
    });
}
// Verifica o estado de autenticação
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("Usuário logado:", user.uid);
        
        try {
            // Mostra o loader enquanto carrega os dados
            document.getElementById('profile-loader').classList.remove('hidden');
            
            // Carrega os dados do perfil primeiro
            await loadProfileData(user);
            
            // Configura os listeners das abas
            setupTabListeners(user);
            
            // Verifica qual aba está ativa e carrega os dados correspondentes
            const activeTab = document.querySelector('.nav-tabs .nav-link.active');
            if (activeTab) {
                const target = activeTab.getAttribute('data-bs-target');
                
                if (target === '#anuncios') {
                    await carregarMeusAnuncios();
                } else if (target === '#favoritos') {
                    await carregarFavoritos(user.uid);
                }
            }
            
        } catch (error) {
            console.error("Erro ao carregar dados do usuário:", error);
            showAlert("Erro ao carregar seus dados. Por favor, recarregue a página.", "error");
        } finally {
            // Esconde o loader independente de sucesso ou erro
            document.getElementById('profile-loader').classList.add('hidden');
        }
        
    } else {
        // Usuário não está logado, redireciona para a página de login
        window.location.href = "login.html";
    }
});

// Configurar os listeners das abas
function setupTabListeners() {
  const tabs = document.querySelectorAll('.nav-tabs .nav-link');
  
  tabs.forEach(tab => {
    tab.addEventListener('shown.bs.tab', async (event) => {
      const target = event.target.getAttribute('data-bs-target');
      const user = auth.currentUser;
      
      if (!user) return;
      
      try {
        document.getElementById('profile-loader').classList.remove('hidden');
        
        if (target === '#anuncios') {
          await loadUserAds(user.uid);
        } else if (target === '#favoritos') {
          await loadFavorites(user.uid);
        }
        // A aba 'perfil' não precisa carregar dados adicionais
        
      } catch (error) {
        console.error(`Erro ao carregar aba ${target}:`, error);
        showAlert(`Erro ao carregar ${target}. Tente novamente.`, "error");
      } finally {
        document.getElementById('profile-loader').classList.add('hidden');
      }
    });
  });
}


// Configurar o listener para a aba de favoritos
document.getElementById('favoritos-tab').addEventListener('shown.bs.tab', async () => {
    const user = auth.currentUser;
    if (user) {
        await carregarFavoritos(user.uid);
    }
});
async function carregarAnuncios(userId) {

    // Busca em ambas as coleções
    const imoveisRef = collection(db, "imoveis");
    const automoveisRef = collection(db, "automoveis");
    
    const qImoveis = query(imoveisRef, where("userId", "==", userId));
    const qAutomoveis = query(automoveisRef, where("userId", "==", userId));

    const [imoveisSnapshot, automoveisSnapshot] = await Promise.all([
        getDocs(qImoveis),
        getDocs(qAutomoveis)
    ]);

    const anunciosContainer = document.getElementById("anuncios-container");
    const noAnuncios = document.getElementById("no-anuncios");
    
    anunciosContainer.innerHTML = "";
    noAnuncios.classList.add("hidden");

    // Verifica se há resultados
    if (imoveisSnapshot.empty && automoveisSnapshot.empty) {
        noAnuncios.classList.remove("hidden");
        return;
    }

    // Processa imóveis
    imoveisSnapshot.forEach((doc) => {
        const data = doc.data();
        anunciosContainer.innerHTML += criarCardAnuncio(data, "Imóvel", doc.id);
    });

    // Processa automóveis
    automoveisSnapshot.forEach((doc) => {
        const data = doc.data();
        anunciosContainer.innerHTML += criarCardAnuncio(data, "Automóvel", doc.id);
    });
}
// Alternar entre formulários de usuário comum e comercial
tipoUsuarioInput.addEventListener("change", () => {
    const tipoSelecionado = tipoUsuarioInput.value;

    if (tipoSelecionado === "comum") {
        formComum.classList.remove("hidden");
        formComercial.classList.add("hidden");
    } else if (tipoSelecionado === "comercial") {
        formComercial.classList.remove("hidden");
        formComum.classList.add("hidden");
    } else {
        formComum.classList.add("hidden");
        formComercial.classList.add("hidden");
    }
});

// Alternar entre formulários de imóveis e automóveis (para usuário comum)
tipoInteresseInput.addEventListener("change", () => {
    const tipoSelecionado = tipoInteresseInput.value;

    if (tipoSelecionado === "imoveis") {
        formImoveis.classList.remove("hidden");
        formAutomoveis.classList.add("hidden");
    } else if (tipoSelecionado === "automoveis") {
        formAutomoveis.classList.remove("hidden");
        formImoveis.classList.add("hidden");
    } else {
        formImoveis.classList.add("hidden");
        formAutomoveis.classList.add("hidden");
    }
});


// Verificar hash na URL para ativar a aba correta
window.addEventListener('DOMContentLoaded', () => {
    const hash = window.location.hash;
    if (hash === '#meus-anuncios') {
        // Simula clique na aba "Meus Anúncios"
        const tabAnuncios = document.querySelector('a[href="#meus-anuncios"]');
        if (tabAnuncios) {
            tabAnuncios.click();
        }
    }
});


// Função de logout atualizada para Firebase v9+
document.getElementById('logout-btn').addEventListener('click', async () => {
    try {
        await signOut(auth);
        alert('Logout realizado com sucesso!');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
        alert('Erro ao fazer logout. Tente novamente.');
    }
});


// Função auxiliar melhorada para mostrar alertas
function showAlert(message, type) {
    try {
        // Usando SweetAlert2 se disponível, ou fallback para alert nativo
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: type === 'error' ? 'Erro' : 'Aviso',
                text: message,
                icon: type,
                confirmButtonText: 'OK'
            });
        } else {
            alert(`[${type.toUpperCase()}] ${message}`);
        }
    } catch (e) {
        console.error('Erro ao exibir alerta:', e);
        alert(message);
    }
}



// Função para carregar e exibir os dados do perfil
async function loadProfileData(user) {
    try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Preenche o card de visualização
            document.getElementById("profile-name").textContent = userData.nome || "Não informado";
            document.getElementById("profile-email").textContent = userData.email || "Não informado";
            document.getElementById("profile-phone").textContent = userData.telefone || "Não informado";
            document.getElementById("profile-doc").textContent = userData.cpfCnpj || "Não informado";
            
            // Define o tipo de usuário
            if (userData.tipoUsuario === "comum") {
                document.getElementById("profile-type").textContent = "Usuário Comum";
                document.getElementById("profile-common-info").classList.remove("hidden");
                document.getElementById("profile-interest").textContent = userData.comum?.tipoInteresse || "Não informado";
                
                // Adiciona detalhes específicos do interesse
                if (userData.comum?.tipoInteresse === "imoveis") {
                    // Adicione detalhes de imóveis se necessário
                } else if (userData.comum?.tipoInteresse === "automoveis") {
                    // Adicione detalhes de automóveis se necessário
                }
            } else if (userData.tipoUsuario === "comercial") {
                document.getElementById("profile-type").textContent = "Profissional";
                document.getElementById("profile-professional-info").classList.remove("hidden");
                document.getElementById("profile-area").textContent = userData.comercial?.areaAtuacao || "Não informado";
                document.getElementById("profile-creci-cnpj").textContent = 
                    userData.comercial?.creci ? `CRECI ${userData.comercial.creci}` : 
                    userData.comercial?.cnpj ? `CNPJ ${userData.comercial.cnpj}` : "Não informado";
            }
            
            // Preenche o formulário de edição
            fillEditForm(userData);
        }
    } catch (error) {
        console.error("Erro ao carregar perfil:", error);
        showAlert("Erro ao carregar dados do perfil", "error");
    }
}


// Função para preencher o formulário de edição
function fillEditForm(userData) {
    // Preenche campos básicos
    document.getElementById("nome").value = userData.nome || "";
    document.getElementById("telefone").value = userData.telefone || "";
    document.getElementById("email").value = userData.email || "";
    document.getElementById("cpf-cnpj").value = userData.cpfCnpj || "";
    document.getElementById("data-nascimento").value = userData.dataNascimento || "";
    
    // Define o tipo de usuário
    if (userData.tipoUsuario) {
        document.querySelector(`input[name="tipo-usuario"][value="${userData.tipoUsuario}"]`).checked = true;
        toggleUserTypeFields(userData.tipoUsuario);
        
        // Preenche campos específicos
        if (userData.tipoUsuario === "comum" && userData.comum) {
            document.getElementById("tipo-interesse").value = userData.comum.tipoInteresse || "";
            toggleInterestFields(userData.comum.tipoInteresse);
            
            if (userData.comum.tipoInteresse === "imoveis" && userData.comum.imoveis) {
                document.getElementById("localizacao-imovel").value = userData.comum.imoveis.localizacao || "";
                document.getElementById("faixa-preco-imovel").value = userData.comum.imoveis.faixaPreco || "";
            } else if (userData.comum.tipoInteresse === "automoveis" && userData.comum.automoveis) {
                document.getElementById("marca-automovel").value = userData.comum.automoveis.marca || "";
                document.getElementById("faixa-preco-automovel").value = userData.comum.automoveis.faixaPreco || "";
            }
        } else if (userData.tipoUsuario === "comercial" && userData.comercial) {
            document.getElementById("creci").value = userData.comercial.creci || "";
            document.getElementById("cnpj").value = userData.comercial.cnpj || "";
            document.getElementById("area-atuacao").value = userData.comercial.areaAtuacao || "";
            document.getElementById("descricao-empresa").value = userData.comercial.descricaoEmpresa || "";
        }
    }
}

// Funções para alternar entre visualização e edição
function toggleEditMode(showEdit) {
    if (showEdit) {
        document.getElementById("profile-view").classList.add("hidden");
        document.getElementById("profile-edit").classList.remove("hidden");
    } else {
        document.getElementById("profile-view").classList.remove("hidden");
        document.getElementById("profile-edit").classList.add("hidden");
    }
}

// Event Listeners
document.getElementById("edit-profile-btn").addEventListener("click", () => toggleEditMode(true));
document.getElementById("cancel-edit-btn").addEventListener("click", () => toggleEditMode(false));


// Evento de submit do formulário
document.getElementById("perfil-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const user = auth.currentUser;
    if (!user) return;
    
    try {
        // Coleta os dados do formulário
        const userData = {
            nome: document.getElementById("nome").value,
            telefone: document.getElementById("telefone").value,
            email: document.getElementById("email").value,
            cpfCnpj: document.getElementById("cpf-cnpj").value,
            dataNascimento: document.getElementById("data-nascimento").value,
            tipoUsuario: document.querySelector('input[name="tipo-usuario"]:checked').value,
            updatedAt: new Date()
        };
        
        // Adiciona dados específicos do tipo de usuário
        if (userData.tipoUsuario === "comum") {
            userData.comum = {
                tipoInteresse: document.getElementById("tipo-interesse").value
            };
            
            if (userData.comum.tipoInteresse === "imoveis") {
                userData.comum.imoveis = {
                    localizacao: document.getElementById("localizacao-imovel").value,
                    faixaPreco: document.getElementById("faixa-preco-imovel").value
                };
            } else if (userData.comum.tipoInteresse === "automoveis") {
                userData.comum.automoveis = {
                    marca: document.getElementById("marca-automovel").value,
                    faixaPreco: document.getElementById("faixa-preco-automovel").value
                };
            }
        } else if (userData.tipoUsuario === "comercial") {
            userData.comercial = {
                creci: document.getElementById("creci").value,
                cnpj: document.getElementById("cnpj").value,
                areaAtuacao: document.getElementById("area-atuacao").value,
                descricaoEmpresa: document.getElementById("descricao-empresa").value
            };
        }
        
        // Atualiza no Firestore
        await setDoc(doc(db, "users", user.uid), userData, { merge: true });
        
        // Recarrega os dados e volta para o modo de visualização
        await loadProfileData(user);
        toggleEditMode(false);
        showAlert("Perfil atualizado com sucesso!", "success");
    } catch (error) {
        console.error("Erro ao atualizar perfil:", error);
        showAlert("Erro ao atualizar perfil", "error");
    }
});



ocument.addEventListener('DOMContentLoaded', function() {
    // Adicionar event listeners para os filtros
    setupFilterControls();
});

function setupFilterControls() {
    // Filtro por tipo (imóvel/automóvel/todos)
    document.querySelectorAll('[data-filter]').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const filterType = this.getAttribute('data-filter');
            filterAdsByType(filterType);
            
            // Atualizar UI do dropdown
            document.querySelectorAll('[data-filter]').forEach(el => {
                el.classList.remove('active');
            });
            this.classList.add('active');
        });
    });
    
    // Filtro por status (ativos/inativos/destaques/todos)
    document.querySelectorAll('[data-filter-status]').forEach(item => {
        item.addEventListener('click', function() {
            const filterStatus = this.getAttribute('data-filter-status');
            filterAdsByStatus(filterStatus);
            
            // Atualizar UI dos botões
            document.querySelectorAll('[data-filter-status]').forEach(el => {
                el.classList.remove('active');
            });
            this.classList.add('active');
        });
    });
    
    // Filtro por busca
    document.getElementById('busca-anuncios').addEventListener('input', function() {
        filterAdsBySearch(this.value.toLowerCase());
    });
}

// Funções de filtragem
function filterAdsByType(type) {
    const anuncios = document.querySelectorAll('.anuncio-card');
    
    anuncios.forEach(anuncio => {
        const anuncioTipo = anuncio.getAttribute('data-tipo');
        
        if (type === 'todos' || anuncioTipo.includes(type)) {
            anuncio.style.display = '';
        } else {
            anuncio.style.display = 'none';
        }
    });
    
    updateEmptyState();
}

function filterAdsByStatus(status) {
    const anuncios = document.querySelectorAll('.anuncio-card');
    
    anuncios.forEach(anuncio => {
        const btnStatus = anuncio.querySelector('.btn-status-toggle');
        const btnDestaque = anuncio.querySelector('.btn-destaque-toggle');
        const anuncioStatus = btnStatus.getAttribute('data-status');
        const anuncioDestaque = btnDestaque.getAttribute('data-destaque') === 'true';
        
        let shouldShow = false;
        
        switch(status) {
            case 'todos':
                shouldShow = true;
                break;
            case 'ativos':
                shouldShow = anuncioStatus === 'ativo';
                break;
            case 'inativos':
                shouldShow = anuncioStatus === 'inativo';
                break;
            case 'destaques':
                shouldShow = anuncioDestaque;
                break;
        }
        
        anuncio.style.display = shouldShow ? '' : 'none';
    });
    
    updateEmptyState();
}

function filterAdsBySearch(searchTerm) {
    const anuncios = document.querySelectorAll('.anuncio-card');
    
    anuncios.forEach(anuncio => {
        const titulo = anuncio.querySelector('.anuncio-titulo').textContent.toLowerCase();
        const descricao = anuncio.querySelector('.anuncio-descricao').textContent.toLowerCase();
        
        if (titulo.includes(searchTerm) || descricao.includes(searchTerm)) {
            anuncio.style.display = '';
        } else {
            anuncio.style.display = 'none';
        }
    });
    
    updateEmptyState();
}

function updateEmptyState() {
    const anunciosContainer = document.getElementById('anuncios-container');
    const visibleAnuncios = anunciosContainer.querySelectorAll('.anuncio-card[style=""]');
    const noAnunciosMsg = document.getElementById('no-anuncios');
    
    if (visibleAnuncios.length === 0) {
        noAnunciosMsg.classList.remove('d-none');
    } else {
        noAnunciosMsg.classList.add('d-none');
    }
}
async function updateCounters(userId) {
    try {
        const [imoveisSnapshot, automoveisSnapshot] = await Promise.all([
            getDocs(query(collection(db, "imoveis"), where("userId", "==", userId))),
            getDocs(query(collection(db, "automoveis"), where("userId", "==", userId)))
        ]);
        
        let total = 0;
        let ativos = 0;
        let inativos = 0;
        let destaques = 0;
        
        // Contar imóveis
        imoveisSnapshot.forEach(doc => {
            total++;
            const data = doc.data();
            if (data.status === 'ativo') ativos++;
            if (data.status === 'inativo') inativos++;
            if (data.destaque) destaques++;
        });
        
        // Contar automóveis
        automoveisSnapshot.forEach(doc => {
            total++;
            const data = doc.data();
            if (data.status === 'ativo') ativos++;
            if (data.status === 'inativo') inativos++;
            if (data.destaque) destaques++;
        });
        
        // Atualizar UI
        document.getElementById('count-todos').textContent = total;
        document.getElementById('count-ativos').textContent = ativos;
        document.getElementById('count-inativos').textContent = inativos;
        document.getElementById('count-destaques').textContent = destaques;
        
    } catch (error) {
        console.error("Erro ao atualizar contadores:", error);
    }
}
