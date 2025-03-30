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
const profileView = document.getElementById("profile-view");
const profileEdit = document.getElementById("profile-edit");
const editProfileBtn = document.getElementById("edit-profile-btn");
const cancelEditBtn = document.getElementById("cancel-edit-btn");

// Elementos do card de visualização
const profileName = document.getElementById("profile-name");
const profileEmail = document.getElementById("profile-email");
const profilePhone = document.getElementById("profile-phone");
const profileDoc = document.getElementById("profile-doc");
const profileType = document.getElementById("profile-type");
const profileCommonInfo = document.getElementById("profile-common-info");
const profileInterest = document.getElementById("profile-interest");
const profileProfessionalInfo = document.getElementById("profile-professional-info");
const profileArea = document.getElementById("profile-area");
const profileCreciCnpj = document.getElementById("profile-creci-cnpj");

// Elementos do formulário de edição
const nomeInput = document.getElementById("nome");
const telefoneInput = document.getElementById("telefone");
const emailInput = document.getElementById("email");
const cpfCnpjInput = document.getElementById("cpf-cnpj");
const dataNascimentoInput = document.getElementById("data-nascimento");
const tipoUsuarioInputs = document.querySelectorAll('input[name="tipo-usuario"]');
const tipoInteresseSelect = document.getElementById("tipo-interesse");
const localizacaoImovelInput = document.getElementById("localizacao-imovel");
const faixaPrecoImovelInput = document.getElementById("faixa-preco-imovel");
const marcaAutomovelInput = document.getElementById("marca-automovel");
const faixaPrecoAutomovelInput = document.getElementById("faixa-preco-automovel");
const creciInput = document.getElementById("creci");
const cnpjInput = document.getElementById("cnpj");
const areaAtuacaoInput = document.getElementById("area-atuacao");
const descricaoEmpresaInput = document.getElementById("descricao-empresa");

// Elementos para alternar entre formulários
const formComum = document.getElementById("form-comum");
const formComercial = document.getElementById("form-comercial");
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
            profileName.textContent = userData.nome || "Não informado";
            profileEmail.textContent = userData.email || "Não informado";
            profilePhone.textContent = userData.telefone || "Não informado";
            profileDoc.textContent = userData.cpfCnpj || "Não informado";
            
            // Define o tipo de usuário
            if (userData.tipoUsuario === "comum") {
                profileType.textContent = "Usuário Comum";
                profileCommonInfo.classList.remove("hidden");
                profileInterest.textContent = userData.comum?.tipoInteresse || "Não informado";
                
                // Adiciona detalhes específicos do interesse
                if (userData.comum?.tipoInteresse === "imoveis") {
                    // Adicione detalhes de imóveis se necessário
                } else if (userData.comum?.tipoInteresse === "automoveis") {
                    // Adicione detalhes de automóveis se necessário
                }
            } else if (userData.tipoUsuario === "comercial") {
                profileType.textContent = "Profissional";
                profileProfessionalInfo.classList.remove("hidden");
                profileArea.textContent = userData.comercial?.areaAtuacao || "Não informado";
                profileCreciCnpj.textContent = 
                    userData.comercial?.creci ? `CRECI ${userData.comercial.creci}` : 
                    userData.comercial?.cnpj ? `CNPJ ${userData.comercial.cnpj}` : "Não informado";
            }

            // Preenche o formulário com os dados para edição
            fillEditForm(userData);
            
            // Exibe o card de visualização
            profileView.classList.remove("hidden");
        } else {
            console.log("Nenhum documento de usuário encontrado");
            // Mostra o formulário para cadastro inicial
            profileEdit.classList.remove("hidden");
        }
    } catch (error) {
        console.error("Erro ao carregar informações do usuário:", error);
        showAlert("Erro ao carregar informações do perfil. Tente novamente.", "error");
    }
}

// Função para preencher o formulário de edição
function fillEditForm(userData) {
    // Preenche campos básicos
    nomeInput.value = userData.nome || "";
    telefoneInput.value = userData.telefone || "";
    emailInput.value = userData.email || "";
    cpfCnpjInput.value = userData.cpfCnpj || "";
    dataNascimentoInput.value = userData.dataNascimento || "";
    
    // Define o tipo de usuário
    if (userData.tipoUsuario) {
        document.querySelector(`input[name="tipo-usuario"][value="${userData.tipoUsuario}"]`).checked = true;
        toggleUserTypeFields(userData.tipoUsuario);
        
        // Preenche campos específicos
        if (userData.tipoUsuario === "comum" && userData.comum) {
            tipoInteresseSelect.value = userData.comum.tipoInteresse || "";
            toggleInterestFields(userData.comum.tipoInteresse);
            
            if (userData.comum.tipoInteresse === "imoveis" && userData.comum.imoveis) {
                localizacaoImovelInput.value = userData.comum.imoveis.localizacao || "";
                faixaPrecoImovelInput.value = userData.comum.imoveis.faixaPreco || "";
            } else if (userData.comum.tipoInteresse === "automoveis" && userData.comum.automoveis) {
                marcaAutomovelInput.value = userData.comum.automoveis.marca || "";
                faixaPrecoAutomovelInput.value = userData.comum.automoveis.faixaPreco || "";
            }
        } else if (userData.tipoUsuario === "comercial" && userData.comercial) {
            creciInput.value = userData.comercial.creci || "";
            cnpjInput.value = userData.comercial.cnpj || "";
            areaAtuacaoInput.value = userData.comercial.areaAtuacao || "";
            descricaoEmpresaInput.value = userData.comercial.descricaoEmpresa || "";
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

// Funções para alternar entre visualização e edição
function toggleEditMode(showEdit) {
    if (showEdit) {
        profileView.classList.add("hidden");
        profileEdit.classList.remove("hidden");
    } else {
        profileView.classList.remove("hidden");
        profileEdit.classList.add("hidden");
    }
}

// Event listeners para os selects
document.getElementById("tipo-usuario").addEventListener("change", (e) => {
    toggleUserTypeFields(e.target.value);
});

document.getElementById("tipo-interesse").addEventListener("change", (e) => {
    toggleInterestFields(e.target.value);
});

// Evento de submit do formulário
perfilForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
        showAlert("Você precisa estar logado para atualizar o perfil", "error");
        return;
    }

    try {
        // Coleta os dados do formulário
        const userData = {
            nome: nomeInput.value,
            telefone: telefoneInput.value,
            email: emailInput.value,
            cpfCnpj: cpfCnpjInput.value,
            dataNascimento: dataNascimentoInput.value,
            tipoUsuario: document.querySelector('input[name="tipo-usuario"]:checked').value,
            updatedAt: new Date()
        };

        // Adiciona dados específicos do tipo de usuário
        if (userData.tipoUsuario === "comum") {
            userData.comum = {
                tipoInteresse: tipoInteresseSelect.value
            };

            if (userData.comum.tipoInteresse === "imoveis") {
                userData.comum.imoveis = {
                    localizacao: localizacaoImovelInput.value,
                    faixaPreco: faixaPrecoImovelInput.value
                };
            } else if (userData.comum.tipoInteresse === "automoveis") {
                userData.comum.automoveis = {
                    marca: marcaAutomovelInput.value,
                    faixaPreco: faixaPrecoAutomovelInput.value
                };
            }
        } else if (userData.tipoUsuario === "comercial") {
            userData.comercial = {
                creci: creciInput.value,
                cnpj: cnpjInput.value,
                areaAtuacao: areaAtuacaoInput.value,
                descricaoEmpresa: descricaoEmpresaInput.value
            };
        }

        // Atualiza no Firestore
        await setDoc(doc(db, "users", user.uid), userData, { merge: true });
        
        // Recarrega as informações do usuário
        await carregarInformacoesUsuario(user);
        toggleEditMode(false);
        
        showAlert("Perfil atualizado com sucesso!", "success");
    } catch (error) {
        console.error("Erro ao atualizar perfil:", error);
        showAlert("Erro ao atualizar perfil. Tente novamente.", "error");
    }
});

// Event Listeners para edição do perfil
editProfileBtn.addEventListener("click", () => toggleEditMode(true));
cancelEditBtn.addEventListener("click", () => toggleEditMode(false));

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
        
        // Carrega anúncios se já estiver na tab
        if (window.location.hash === '#anuncios') {
            setTimeout(carregarMeusAnuncios, 100);
        }
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

// Inicializa os eventos quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Ativar a aba correta quando a página carrega com hash na URL
    const hash = window.location.hash;
    if (hash === '#anuncios') {
        const triggerTab = document.querySelector('#anuncios-tab');
        if (triggerTab) {
            const tab = new bootstrap.Tab(triggerTab);
            tab.show();
        }
    } else if (hash === '#favoritos') {
        const triggerTab = document.querySelector('#favoritos-tab');
        if (triggerTab) {
            const tab = new bootstrap.Tab(triggerTab);
            tab.show();
        }
    }
});
