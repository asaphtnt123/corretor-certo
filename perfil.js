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



document.getElementById("perfil-tab").addEventListener("shown.bs.tab", function () {
    const user = auth.currentUser;
    if (user) {
        carregarInformacoesUsuario(user);
    } else {
        console.log("Usuário não autenticado.");
    }
});

async function carregarInformacoesUsuario(user) {
    try {
        console.log('[DEBUG] Iniciando carregamento do perfil para:', user.uid);
        
        // 1. Verificar se os elementos DOM existem
        const elementos = {
            cardNome: document.getElementById("card-nome"),
            cardTelefone: document.getElementById("card-telefone"),
            cardEmail: document.getElementById("card-email"),
            cardCpfCnpj: document.getElementById("card-cpf-cnpj"),
            cardTipoUsuario: document.getElementById("card-tipo-usuario"),
            cardComum: document.getElementById("card-comum"),
            cardTipoInteresse: document.getElementById("card-tipo-interesse"),
            cardImoveis: document.getElementById("card-imoveis"),
            cardLocalizacaoImovel: document.getElementById("card-localizacao-imovel"),
            cardFaixaPrecoImovel: document.getElementById("card-faixa-preco-imovel"),
            cardAutomoveis: document.getElementById("card-automoveis"),
            cardMarcaAutomovel: document.getElementById("card-marca-automovel"),
            cardFaixaPrecoAutomovel: document.getElementById("card-faixa-preco-automovel"),
            cardComercial: document.getElementById("card-comercial"),
            cardCreci: document.getElementById("card-creci"),
            cardCnpj: document.getElementById("card-cnpj"),
            cardAreaAtuacao: document.getElementById("card-area-atuacao"),
            cardDescricaoEmpresa: document.getElementById("card-descricao-empresa"),
            userCard: document.getElementById("user-card")
        };

        // Verificar se todos os elementos existem
        for (const [key, element] of Object.entries(elementos)) {
            if (!element) {
                throw new Error(`Elemento não encontrado: ${key}`);
            }
        }

        // 2. Buscar dados no Firestore
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
            console.warn("Nenhum documento de usuário encontrado para:", user.uid);
            elementos.userCard.classList.add("hidden");
            showAlert("Perfil não encontrado. Complete seu cadastro.", "warning");
            return;
        }

        const userData = userDoc.data();
        console.log('[DEBUG] Dados do usuário:', userData);

        // 3. Preencher informações básicas (com fallbacks)
        elementos.cardNome.textContent = userData.nome || "Não informado";
        elementos.cardTelefone.textContent = userData.telefone || "Não informado";
        elementos.cardEmail.textContent = user.email || userData.email || "Não informado"; // Prioriza email do auth
        elementos.cardCpfCnpj.textContent = userData.cpfCnpj || "Não informado";
        
        // 4. Determinar tipo de usuário
        const tipoUsuario = userData.tipoUsuario || "comum";
        elementos.cardTipoUsuario.textContent = tipoUsuario === "comum" ? "Usuário Comum" : "Usuário Comercial";

        // 5. Preencher seções específicas
        if (tipoUsuario === "comum") {
            elementos.cardComum.classList.remove("hidden");
            elementos.cardComercial.classList.add("hidden");
            
            const comumData = userData.comum || {};
            elementos.cardTipoInteresse.textContent = comumData.tipoInteresse || "Não informado";

            // Seção de imóveis
            if (comumData.tipoInteresse === "imoveis") {
                elementos.cardImoveis.classList.remove("hidden");
                elementos.cardAutomoveis.classList.add("hidden");
                
                const imoveisData = comumData.imoveis || {};
                elementos.cardLocalizacaoImovel.textContent = imoveisData.localizacao || "Não informado";
                elementos.cardFaixaPrecoImovel.textContent = imoveisData.faixaPreco || "Não informado";
            } 
            // Seção de automóveis
            else if (comumData.tipoInteresse === "automoveis") {
                elementos.cardAutomoveis.classList.remove("hidden");
                elementos.cardImoveis.classList.add("hidden");
                
                const automoveisData = comumData.automoveis || {};
                elementos.cardMarcaAutomovel.textContent = automoveisData.marca || "Não informado";
                elementos.cardFaixaPrecoAutomovel.textContent = automoveisData.faixaPreco || "Não informado";
            }
        } 
        // Usuário comercial
        else if (tipoUsuario === "comercial") {
            elementos.cardComercial.classList.remove("hidden");
            elementos.cardComum.classList.add("hidden");
            
            const comercialData = userData.comercial || {};
            elementos.cardCreci.textContent = comercialData.creci || "Não informado";
            elementos.cardCnpj.textContent = comercialData.cnpj || "Não informado";
            elementos.cardAreaAtuacao.textContent = comercialData.areaAtuacao || "Não informado";
            elementos.cardDescricaoEmpresa.textContent = comercialData.descricaoEmpresa || "Não informado";
        }

        // Exibir o card
        elementos.userCard.classList.remove("hidden");
        console.log('[DEBUG] Perfil carregado com sucesso');

    } catch (error) {
        console.error("Erro detalhado ao carregar informações:", {
            error: error,
            message: error.message,
            stack: error.stack
        });
        
        // Mostrar mensagem amigável sem detalhes técnicos
        showAlert("Erro ao carregar informações do perfil. Tente novamente mais tarde.", "error");
        
        // Opcional: Esconder o card em caso de erro
        const userCard = document.getElementById("user-card");
        if (userCard) userCard.classList.add("hidden");
    }
}

async function carregarMeusAnuncios() {
    try {
        console.log("[INÍCIO] Carregando anúncios...");
        
        const user = auth.currentUser;
        if (!user) {
            showAlert('Você precisa estar logado para ver seus anúncios', 'error');
            return;
        }

        // 1. VERIFICAÇÃO DOS ELEMENTOS
        const getElement = (id) => {
            const el = document.getElementById(id);
            if (!el) console.error(`Elemento ${id} não encontrado`);
            return el;
        };

        const elements = {
            todos: getElement("count-todos"),
            ativos: getElement("count-ativos"),
            inativos: getElement("count-inativos"),
            destaques: getElement("count-destaques"),
            containerTodos: getElement("anuncios-container"),
            containerAtivos: getElement("anuncios-ativos"),
            containerInativos: getElement("anuncios-inativos"),
            containerDestaques: getElement("anuncios-destaques"),
            noAnuncios: getElement("no-anuncios")
        };

        // 2. BUSCA DOS ANÚNCIOS
        console.log("[1] Buscando anúncios no Firestore...");
        const [imoveisSnapshot, automoveisSnapshot] = await Promise.all([
            getDocs(query(collection(db, "imoveis"), where("userId", "==", user.uid))),
            getDocs(query(collection(db, "automoveis"), where("userId", "==", user.uid)))
        ]);

        console.log(`[2] Total de documentos: ${imoveisSnapshot.size + automoveisSnapshot.size}`);

        // 3. PROCESSAMENTO DOS ANÚNCIOS
        const todosAnuncios = [];
        const counters = {
            todos: 0,
            ativos: 0,
            inativos: 0,
            destaques: 0
        };

        // Função para processar cada anúncio
        const processarAnuncio = (doc, tipo) => {
            const data = doc.data();
            const anuncio = {
                ...data,
                id: doc.id,
                tipo: tipo
            };
            
            // Verificação do status
            const status = (typeof data.status === 'string') ? data.status.toLowerCase() : 'ativo';
            anuncio.status = status; // Garante que o status está padronizado
            
            // Atualiza contadores
            counters.todos++;
            if (status === 'ativo') counters.ativos++;
            if (status === 'inativo') counters.inativos++;
            if (data.destaque === true) counters.destaques++;
            
            todosAnuncios.push(anuncio);
            console.log(`[3] Processado: ${doc.id}`, {status, destaque: data.destaque});
        };

        // Processa todos os documentos
        imoveisSnapshot.forEach(doc => processarAnuncio(doc, "Imóvel"));
        automoveisSnapshot.forEach(doc => processarAnuncio(doc, "Automóvel"));

        console.log("[4] Contagens calculadas:", counters);
        console.log("[5] Total de anúncios processados:", todosAnuncios.length);

        // 4. ATUALIZAÇÃO DOS CONTADORES
        const updateCounters = () => {
            if (elements.todos) elements.todos.textContent = counters.todos;
            if (elements.ativos) elements.ativos.textContent = counters.ativos;
            if (elements.inativos) elements.inativos.textContent = counters.inativos;
            if (elements.destaques) elements.destaques.textContent = counters.destaques;
            
            // Força redraw para navegadores problemáticos
            requestAnimationFrame(() => {
                if (elements.todos) {
                    elements.todos.style.display = 'none';
                    elements.todos.offsetHeight;
                    elements.todos.style.display = '';
                }
            });
        };

        updateCounters();

        // 5. EXIBIÇÃO DOS ANÚNCIOS
        const exibirAnuncios = (anuncios, container) => {
            if (!container) return;
            
            container.innerHTML = ""; // Limpa o container
            
            if (anuncios.length === 0) {
                if (container === elements.containerTodos && elements.noAnuncios) {
                    elements.noAnuncios.classList.remove("d-none");
                }
                return;
            }
            
            if (elements.noAnuncios) {
                elements.noAnuncios.classList.add("d-none");
            }
            
            anuncios.forEach(anuncio => {
                const cardHTML = criarCardAnuncio(anuncio, anuncio.tipo, anuncio.id);
                container.innerHTML += cardHTML;
            });
        };

        // Exibe todos os anúncios inicialmente
        exibirAnuncios(todosAnuncios, elements.containerTodos);
        
        // Prepara os anúncios filtrados
        const anunciosAtivos = todosAnuncios.filter(a => a.status === 'ativo');
        const anunciosInativos = todosAnuncios.filter(a => a.status === 'inativo');
        const anunciosDestaques = todosAnuncios.filter(a => a.destaque === true);
        
        // Exibe os anúncios filtrados em seus containers
        exibirAnuncios(anunciosAtivos, elements.containerAtivos);
        exibirAnuncios(anunciosInativos, elements.containerInativos);
        exibirAnuncios(anunciosDestaques, elements.containerDestaques);

        // 6. CONFIGURAÇÃO DOS EVENTOS DE FILTRO
        const configurarFiltros = () => {
            const tabs = {
                "todos-tab": "todos",
                "ativos-tab": "ativos",
                "inativos-tab": "inativos",
                "destaques-tab": "destaques"
            };
            
            // Mostra a tab ativa quando clicada
            Object.entries(tabs).forEach(([tabId, tipo]) => {
                const tab = document.getElementById(tabId);
                if (tab) {
                    tab.addEventListener("click", () => {
                        const containerMap = {
                            "todos": elements.containerTodos,
                            "ativos": elements.containerAtivos,
                            "inativos": elements.containerInativos,
                            "destaques": elements.containerDestaques
                        };
                        
                        const container = containerMap[tipo];
                        if (container) {
                            // Esconde todos os containers
                            Object.values(containerMap).forEach(c => {
                                if (c) c.style.display = 'none';
                            });
                            
                            // Mostra o container selecionado
                            container.style.display = '';
                        }
                    });
                }
            });
        };

        configurarFiltros();

        // 7. VERIFICAÇÃO FINAL
        setTimeout(() => {
            console.log("[6] Estado final:", {
                todos: elements.todos?.textContent,
                ativos: elements.ativos?.textContent,
                inativos: elements.inativos?.textContent,
                destaques: elements.destaques?.textContent,
                anunciosAtivos: anunciosAtivos.length,
                anunciosInativos: anunciosInativos.length,
                anunciosDestaques: anunciosDestaques.length
            });
        }, 100);

    } catch (error) {
        console.error("[ERRO] Falha crítica:", error);
        showAlert("Erro ao carregar anúncios", "error");
    }
}

// Inicializa quando a tab de anúncios é mostrada
document.getElementById('anuncios-tab')?.addEventListener('shown.bs.tab', () => {
    setTimeout(carregarMeusAnuncios, 50);
});
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
// Função para carregar os favoritos do usuário
async function carregarFavoritos(userId) {
    const favoritosRef = collection(db, "favoritos");
    const q = query(favoritosRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    const favoritosContainer = document.getElementById("favoritos-container");
    favoritosContainer.innerHTML = ""; // Limpa o conteúdo anterior

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const favoritoHTML = `
            <div class="col-md-4 mb-4">
                <div class="card">
                    <img src="${data.imagens[0]}" class="card-img-top" alt="Imagem do Anúncio">
                    <div class="card-body">
                        <h5 class="card-title">${data.titulo}</h5>
                        <p class="card-text">${data.descricao}</p>
                        <p><strong>Preço:</strong> R$ ${data.preco}</p>
                        <a href="#" class="btn btn-primary">Ver Detalhes</a>
                    </div>
                </div>
            </div>
        `;
        favoritosContainer.innerHTML += favoritoHTML;
    });
}

// Verifica o estado de autenticação
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Usuário logado:", user.uid);

        // Carrega as informações do usuário no card
        carregarInformacoesUsuario(user);

        // Carrega os anúncios e favoritos do usuário
        carregarAnuncios(user.uid);
        carregarFavoritos(user.uid);
    } else {
        // Usuário não está logado, redireciona para a página de login
        window.location.href = "login.html";
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

// Salva os dados do perfil no Firestore
perfilForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (user) {
        const userData = {
            nome: document.getElementById("nome").value,
            telefone: document.getElementById("telefone").value,
            email: document.getElementById("email").value,
            cpfCnpj: document.getElementById("cpf-cnpj").value,
            dataNascimento: document.getElementById("data-nascimento").value,
            tipoUsuario: tipoUsuarioInput.value,
        };

        // Adiciona dados específicos com base no tipo de usuário
        if (tipoUsuarioInput.value === "comum") {
            userData.comum = {
                tipoInteresse: tipoInteresseInput.value,
                imoveis: {
                    localizacao: document.getElementById("localizacao-imovel").value,
                    faixaPreco: document.getElementById("faixa-preco-imovel").value,
                },
                automoveis: {
                    marca: document.getElementById("marca-automovel").value,
                    faixaPreco: document.getElementById("faixa-preco-automovel").value,
                }
            };
        } else if (tipoUsuarioInput.value === "comercial") {
            userData.comercial = {
                creci: document.getElementById("creci").value,
                cnpj: document.getElementById("cnpj").value,
                areaAtuacao: document.getElementById("area-atuacao").value,
                descricaoEmpresa: document.getElementById("descricao-empresa").value,
            };
        }

        try {
            // Salva os dados no Firestore
            await setDoc(doc(db, "users", user.uid), userData);
            alert("Perfil salvo com sucesso!");

            // Atualiza o card com as novas informações
            await carregarInformacoesUsuario(user);

            // Exibe o card
            userCard.classList.remove("hidden");
        } catch (error) {
            console.error("Erro ao salvar perfil:", error);
            alert("Erro ao salvar perfil. Tente novamente.");
        }
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

// Inicialização quando o usuário está logado
onAuthStateChanged(auth, (user) => {
    if (user) {
        loadProfileData(user);
    }
});

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
