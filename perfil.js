// Importações do Firebase
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
  updateDoc,
  deleteDoc,
  runTransaction
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

// Inicialização do Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Ativar persistência da autenticação
setPersistence(auth, browserLocalPersistence)
  .then(() => console.log("Persistência ativada!"))
  .catch((error) => console.error("Erro na persistência:", error));

// ==============================================
// ELEMENTOS E FUNÇÕES DA TAB DE PERFIL
// ==============================================

// Elementos do DOM para o perfil
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

// Elementos para alternar entre formulários
const tipoUsuarioInput = document.getElementById("tipo-usuario");
const formComum = document.getElementById("form-comum");
const formComercial = document.getElementById("form-comercial");
const tipoInteresseInput = document.getElementById("tipo-interesse");
const formImoveis = document.getElementById("form-imoveis");
const formAutomoveis = document.getElementById("form-automoveis");

// Função principal para carregar informações do usuário
async function carregarInformacoesUsuario(user) {
    try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
            const userData = userDoc.data();

            // Exibe as informações básicas no card
            cardNome.textContent = userData.nome || "Não informado";
            cardTelefone.textContent = userData.telefone || "Não informado";
            cardEmail.textContent = userData.email || "Não informado";
            cardCpfCnpj.textContent = userData.cpfCnpj || "Não informado";
            cardTipoUsuario.textContent = userData.tipoUsuario === "comum" ? "Usuário Comum" : "Usuário Comercial";

            // Exibe informações específicas do tipo de usuário
            if (userData.tipoUsuario === "comum") {
                cardComum.classList.remove("hidden");
                cardTipoInteresse.textContent = userData.comum?.tipoInteresse || "Não informado";

                if (userData.comum?.tipoInteresse === "imoveis") {
                    cardImoveis.classList.remove("hidden");
                    cardLocalizacaoImovel.textContent = userData.comum.imoveis?.localizacao || "Não informado";
                    cardFaixaPrecoImovel.textContent = userData.comum.imoveis?.faixaPreco || "Não informado";
                } else if (userData.comum?.tipoInteresse === "automoveis") {
                    cardAutomoveis.classList.remove("hidden");
                    cardMarcaAutomovel.textContent = userData.comum.automoveis?.marca || "Não informado";
                    cardFaixaPrecoAutomovel.textContent = userData.comum.automoveis?.faixaPreco || "Não informado";
                }
            } else if (userData.tipoUsuario === "comercial") {
                cardComercial.classList.remove("hidden");
                cardCreci.textContent = userData.comercial?.creci || "Não informado";
                cardCnpj.textContent = userData.comercial?.cnpj || "Não informado";
                cardAreaAtuacao.textContent = userData.comercial?.areaAtuacao || "Não informado";
                cardDescricaoEmpresa.textContent = userData.comercial?.descricaoEmpresa || "Não informado";
            }

            // Exibe o card
            userCard.classList.remove("hidden");
            
            // Preenche o formulário com os dados para edição
            fillEditForm(userData);
        } else {
            console.log("Nenhum documento de usuário encontrado");
        }
    } catch (error) {
        console.error("Erro ao carregar informações do usuário:", error);
        alert("Erro ao carregar informações do perfil. Tente novamente.");
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

// Funções para mostrar/ocultar campos específicos
function toggleUserTypeFields(tipoSelecionado) {
    if (tipoSelecionado === "comum") {
        formComum.classList.remove("hidden");
        formComercial.classList.add("hidden");
    } else if (tipoSelecionado === "comercial") {
        formComercial.classList.remove("hidden");
        formComum.classList.add("hidden");
    }
}

function toggleInterestFields(tipoInteresse) {
    if (tipoInteresse === "imoveis") {
        formImoveis.classList.remove("hidden");
        formAutomoveis.classList.add("hidden");
    } else if (tipoInteresse === "automoveis") {
        formAutomoveis.classList.remove("hidden");
        formImoveis.classList.add("hidden");
    }
}

// Event listeners para os selects
tipoUsuarioInput.addEventListener("change", (e) => {
    toggleUserTypeFields(e.target.value);
});

tipoInteresseInput.addEventListener("change", (e) => {
    toggleInterestFields(e.target.value);
});

// Evento de submit do formulário
perfilForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
        alert("Você precisa estar logado para atualizar o perfil");
        return;
    }

    try {
        // Coleta os dados do formulário
        const userData = {
            nome: document.getElementById("nome").value,
            telefone: document.getElementById("telefone").value,
            email: document.getElementById("email").value,
            cpfCnpj: document.getElementById("cpf-cnpj").value,
            dataNascimento: document.getElementById("data-nascimento").value,
            tipoUsuario: tipoUsuarioInput.value,
            updatedAt: new Date()
        };

        // Adiciona dados específicos do tipo de usuário
        if (userData.tipoUsuario === "comum") {
            userData.comum = {
                tipoInteresse: tipoInteresseInput.value
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
        
        // Recarrega as informações do usuário
        await carregarInformacoesUsuario(user);
        alert("Perfil atualizado com sucesso!");
    } catch (error) {
        console.error("Erro ao atualizar perfil:", error);
        alert("Erro ao atualizar perfil. Tente novamente.");
    }
});

// ==============================================
// ELEMENTOS E FUNÇÕES DA TAB DE ANÚNCIOS
// ==============================================

// Função para carregar os anúncios do usuário
async function carregarMeusAnuncios() {
    try {
        const user = auth.currentUser;
        if (!user) {
            showAlert('Você precisa estar logado para ver seus anúncios', 'error');
            return;
        }

        // Elementos do DOM
        const elements = {
            todos: document.getElementById("count-todos"),
            ativos: document.getElementById("count-ativos"),
            inativos: document.getElementById("count-inativos"),
            destaques: document.getElementById("count-destaques"),
            containerTodos: document.getElementById("anuncios-container"),
            containerAtivos: document.getElementById("anuncios-ativos"),
            containerInativos: document.getElementById("anuncios-inativos"),
            containerDestaques: document.getElementById("anuncios-destaques"),
            noAnuncios: document.getElementById("no-anuncios")
        };

        // Busca os anúncios no Firestore
        const [imoveisSnapshot, automoveisSnapshot] = await Promise.all([
            getDocs(query(collection(db, "imoveis"), where("userId", "==", user.uid))),
            getDocs(query(collection(db, "automoveis"), where("userId", "==", user.uid)))
        ]);

        // Processa os anúncios
        const todosAnuncios = [];
        const counters = { todos: 0, ativos: 0, inativos: 0, destaques: 0 };

        const processarAnuncio = (doc, tipo) => {
            const data = doc.data();
            const anuncio = {
                ...data,
                id: doc.id,
                tipo: tipo,
                status: (typeof data.status === 'string') ? data.status.toLowerCase() : 'ativo'
            };
            
            counters.todos++;
            if (anuncio.status === 'ativo') counters.ativos++;
            if (anuncio.status === 'inativo') counters.inativos++;
            if (data.destaque === true) counters.destaques++;
            
            todosAnuncios.push(anuncio);
        };

        imoveisSnapshot.forEach(doc => processarAnuncio(doc, "Imóvel"));
        automoveisSnapshot.forEach(doc => processarAnuncio(doc, "Automóvel"));

        // Atualiza os contadores
        if (elements.todos) elements.todos.textContent = counters.todos;
        if (elements.ativos) elements.ativos.textContent = counters.ativos;
        if (elements.inativos) elements.inativos.textContent = counters.inativos;
        if (elements.destaques) elements.destaques.textContent = counters.destaques;

        // Exibe os anúncios
        const exibirAnuncios = (anuncios, container) => {
            if (!container) return;
            
            container.innerHTML = "";
            
            if (anuncios.length === 0) {
                if (container === elements.containerTodos && elements.noAnuncios) {
                    elements.noAnuncios.classList.remove("d-none");
                }
                return;
            }
            
            if (elements.noAnuncios) elements.noAnuncios.classList.add("d-none");
            
            anuncios.forEach(anuncio => {
                container.innerHTML += criarCardAnuncio(anuncio);
            });
        };

        // Exibe todos os anúncios inicialmente
        exibirAnuncios(todosAnuncios, elements.containerTodos);
        
        // Prepara e exibe os anúncios filtrados
        exibirAnuncios(todosAnuncios.filter(a => a.status === 'ativo'), elements.containerAtivos);
        exibirAnuncios(todosAnuncios.filter(a => a.status === 'inativo'), elements.containerInativos);
        exibirAnuncios(todosAnuncios.filter(a => a.destaque === true), elements.containerDestaques);

        // Configura os eventos dos botões nos cards
        configurarEventosAnuncios();

    } catch (error) {
        console.error("Erro ao carregar anúncios:", error);
        showAlert("Erro ao carregar anúncios", "error");
    }
}

// Função para criar o HTML do card de anúncio
function criarCardAnuncio(anuncio) {
    const dataFormatada = anuncio.data?.toDate ? anuncio.data.toDate().toLocaleDateString('pt-BR') : 'Data não disponível';
    const precoFormatado = anuncio.preco?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'Preço não informado';

    return `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="anuncio-card" data-id="${anuncio.id}" data-tipo="${anuncio.tipo.toLowerCase()}">
                <div class="anuncio-header">
                    <img src="${anuncio.imagens?.[0] || 'img/sem-imagem.jpg'}" alt="${anuncio.titulo}" class="anuncio-imagem-principal">
                    <span class="anuncio-badge">${anuncio.tipo}</span>
                    
                    <div class="anuncio-controls">
                        <button class="btn-status-toggle ${anuncio.status === 'ativo' ? 'active' : ''}" 
                                data-status="${anuncio.status}">
                            <span class="toggle-handle"></span>
                        </button>
                        
                        <button class="btn-destaque-toggle ${anuncio.destaque ? 'active' : ''}"
                                data-destaque="${anuncio.destaque}">
                            <i class="fas fa-star"></i>
                        </button>
                    </div>
                </div>
                
                <div class="anuncio-body">
                    <h3 class="anuncio-titulo">${anuncio.titulo || 'Sem título'}</h3>
                    <div class="anuncio-preco">${precoFormatado}</div>
                    
                    <div class="anuncio-detalhes">
                        ${anuncio.tipo === 'Imóvel' ? gerarDetalhesImovel(anuncio) : gerarDetalhesAutomovel(anuncio)}
                    </div>
                    
                    <p class="anuncio-descricao">${anuncio.descricao || 'Nenhuma descrição fornecida'}</p>
                </div>
                
                <div class="anuncio-footer">
                    <span class="anuncio-data">${dataFormatada}</span>
                    <div class="anuncio-acoes">
                        <button class="btn-editar" data-id="${anuncio.id}" data-tipo="${anuncio.tipo.toLowerCase()}">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn-excluir" data-id="${anuncio.id}" data-tipo="${anuncio.tipo.toLowerCase()}">
                            <i class="fas fa-trash"></i> Excluir
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Funções para gerar detalhes específicos
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

// Configura os eventos dos botões nos cards de anúncio
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
            window.location.href = `editar-anuncio.html?id=${btn.dataset.id}&tipo=${btn.dataset.tipo}`;
        }

        // Botão Excluir
        if (e.target.closest('.btn-excluir')) {
            const btn = e.target.closest('.btn-excluir');
            confirmarExclusaoAnuncio(btn.dataset.id, btn.dataset.tipo);
        }
    });
}

// Função para confirmar exclusão de anúncio
async function confirmarExclusaoAnuncio(id, tipo) {
    const resultado = await Swal.fire({
        title: "Tem certeza?",
        text: "Você não poderá reverter isso!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sim, excluir!",
        cancelButtonText: "Cancelar"
    });

    if (resultado.isConfirmed) {
        try {
            const collectionName = tipo === 'imovel' ? 'imoveis' : 'automoveis';
            await deleteDoc(doc(db, collectionName, id));
            showAlert('Anúncio excluído com sucesso!', 'success');
            carregarMeusAnuncios();
        } catch (error) {
            console.error('Erro ao excluir anúncio:', error);
            showAlert('Erro ao excluir anúncio', 'error');
        }
    }
}

// Função para mostrar alertas
function showAlert(mensagem, tipo) {
    Swal.fire({
        title: mensagem,
        icon: tipo,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
    });
}

// ==============================================
// INICIALIZAÇÃO GERAL
// ==============================================

// Verifica o estado de autenticação
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Usuário logado:", user.uid);
        carregarInformacoesUsuario(user);
        
        // Configura o evento para carregar anúncios quando a tab for ativada
        document.getElementById('anuncios-tab')?.addEventListener('shown.bs.tab', () => {
            setTimeout(carregarMeusAnuncios, 50);
        });
    } else {
        window.location.href = "login.html";
    }
});

// Logout
document.getElementById('logout-btn').addEventListener('click', async () => {
    try {
        await signOut(auth);
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
        showAlert('Erro ao fazer logout. Tente novamente.', 'error');
    }
});

// Verificar hash na URL para ativar a aba correta
window.addEventListener('DOMContentLoaded', () => {
    const hash = window.location.hash;
    if (hash === '#meus-anuncios') {
        const tabAnuncios = document.querySelector('a[href="#meus-anuncios"]');
        if (tabAnuncios) tabAnuncios.click();
    }
});
