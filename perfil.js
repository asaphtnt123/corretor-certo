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
  addDoc
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

async function carregarInformacoesUsuario(user) {
    try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
            const userData = userDoc.data();

            // Exibe as informações básicas
            cardNome.textContent = userData.nome || "Não informado";
            cardTelefone.textContent = userData.telefone || "Não informado";
            cardEmail.textContent = userData.email || "Não informado";
            cardCpfCnpj.textContent = userData.cpfCnpj || "Não informado";
            cardTipoUsuario.textContent = userData.tipoUsuario === "comum" ? "Usuário Comum" : "Usuário Comercial";

            // Exibe as informações específicas do tipo de usuário
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
        } else {
            console.log("Nenhum documento de usuário encontrado");
        }
    } catch (error) {
        console.error("Erro ao carregar informações do usuário:", error);
        alert("Erro ao carregar informações do perfil. Tente novamente.");
    }
}

// Função para carregar os anúncios do usuário
async function carregarMeusAnuncios() {
    try {
        const user = auth.currentUser;
        if (!user) {
            showAlert('Você precisa estar logado para ver seus anúncios', 'error');
            return;
        }
        console.log('ID do usuário:', user.uid); // Log para depuração

        // Referências das coleções
        const imoveisRef = collection(db, "imoveis");
        const automoveisRef = collection(db, "automoveis");
        
        // Consultas para buscar os anúncios do usuário
        const qImoveis = query(imoveisRef, where("userId", "==", user.uid));
        const qAutomoveis = query(automoveisRef, where("userId", "==", user.uid));
        
        // Executa as consultas em paralelo
        const [imoveisSnapshot, automoveisSnapshot] = await Promise.all([
            getDocs(qImoveis),
            getDocs(qAutomoveis)
        ]);

        console.log('Imóveis encontrados:', imoveisSnapshot.size); // Log
        console.log('Automóveis encontrados:', automoveisSnapshot.size); // Log
      
        // Elementos DOM
        const anunciosContainer = document.getElementById("anuncios-container");
        const containerAtivos = document.getElementById("anuncios-ativos");
        const containerInativos = document.getElementById("anuncios-inativos");
        const containerDestaques = document.getElementById("anuncios-destaques");
        const noAnuncios = document.getElementById("no-anuncios");

        // Limpa os containers
        anunciosContainer.innerHTML = "";
        containerAtivos.innerHTML = "";
        containerInativos.innerHTML = "";
        containerDestaques.innerHTML = "";

        // Contadores
        let countTodos = 0;
        let countAtivos = 0;
        let countInativos = 0;
        let countDestaques = 0;

      // Processa cada documento
const processDocs = (snapshot, tipo) => {
    snapshot.forEach(doc => {
        const data = doc.data();
        console.log('Processando anúncio:', doc.id, data); // Log detalhado
        
        countTodos++;
        
        // Verifica status com fallback para 'ativo' se não existir
        const status = data.status || 'ativo';
        if (status === 'ativo') countAtivos++;
        if (status === 'inativo') countInativos++;
        if (data.destaque) countDestaques++;
            // Cria o card do anúncio
            const cardHTML = criarCardAnuncio(data, tipo, id);
            
            // Adiciona aos containers apropriados
            anunciosContainer.innerHTML += cardHTML;
            
            if (data.status === 'ativo') {
                containerAtivos.innerHTML += cardHTML;
            } else if (data.status === 'inativo') {
                containerInativos.innerHTML += cardHTML;
            }
            
            if (data.destaque) {
                containerDestaques.innerHTML += cardHTML;
            }
        };

        // Processa imóveis
        imoveisSnapshot.forEach(doc => processarAnuncio(doc, "Imóvel"));
        
        // Processa automóveis
        automoveisSnapshot.forEach(doc => processarAnuncio(doc, "Automóvel"));

        // Atualiza os contadores na interface
        document.getElementById("count-todos").textContent = countTodos;
        document.getElementById("count-ativos").textContent = countAtivos;
        document.getElementById("count-inativos").textContent = countInativos;
        document.getElementById("count-destaques").textContent = countDestaques;

        // Mostra mensagem se não houver anúncios
        if (countTodos === 0) {
            noAnuncios.classList.remove("d-none");
        } else {
            noAnuncios.classList.add("d-none");
        }

        // Inicializa eventos dos anúncios
        inicializarEventosAnuncios();

    } catch (error) {
                console.error("Erro detalhado:", error); // Log mais detalhado

        showAlert("Erro ao carregar seus anúncios. Tente novamente.", "error");
    }
}

// Função para inicializar eventos dos anúncios
function inicializarEventosAnuncios() {
    // Filtro por tipo
    document.getElementById("filtro-tipo").addEventListener("change", function() {
        const tipo = this.value;
        const cards = document.querySelectorAll("#anuncios-container .anuncio-card");
        
        cards.forEach(card => {
            const cardTipo = card.querySelector(".anuncio-badge").textContent.toLowerCase();
            if (tipo === "todos" || cardTipo.includes(tipo)) {
                card.style.display = "";
            } else {
                card.style.display = "none";
            }
        });
    });
    
    // Busca por texto
    document.getElementById("busca-anuncios").addEventListener("input", function() {
        const termo = this.value.toLowerCase();
        const cards = document.querySelectorAll("#anuncios-container .anuncio-card");
        
        cards.forEach(card => {
            const textoCard = card.textContent.toLowerCase();
            card.style.display = textoCard.includes(termo) ? "" : "none";
        });
    });
    
    // Botões de ação
    document.addEventListener("click", function(e) {
        // Editar
        if (e.target.closest(".btn-editar")) {
            const btn = e.target.closest(".btn-editar");
            const id = btn.dataset.id;
            const tipo = btn.dataset.tipo;
            window.location.href = `editar-anuncio.html?id=${id}&tipo=${tipo}`;
        }
        
        // Excluir
        if (e.target.closest(".btn-excluir")) {
            const btn = e.target.closest(".btn-excluir");
            const id = btn.dataset.id;
            const tipo = btn.dataset.tipo;
            confirmarExclusaoAnuncio(id, tipo);
        }
        
        // Alterar status (ativo/inativo)
        if (e.target.closest(".btn-status")) {
            const btn = e.target.closest(".btn-status");
            const id = btn.dataset.id;
            const tipo = btn.dataset.tipo;
            const statusAtual = btn.dataset.status;
            toggleStatusAnuncio(id, tipo, statusAtual);
        }
    });
}

// Função para alternar status do anúncio
async function toggleStatusAnuncio(id, tipo, statusAtual) {
    try {
        const collectionName = tipo === "imovel" ? "imoveis" : "automoveis";
        const novoStatus = statusAtual === "ativo" ? "inativo" : "ativo";
        
        await updateDoc(doc(db, collectionName, id), {
            status: novoStatus
        });
        
        showAlert(`Anúncio ${novoStatus === "ativo" ? "ativado" : "desativado"} com sucesso!`, "success");
        carregarMeusAnuncios(); // Recarrega a lista
    } catch (error) {
        console.error("Erro ao alterar status:", error);
        showAlert("Erro ao alterar status do anúncio", "error");
    }
}

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

function criarCardAnuncio(data, tipo, id) {
      console.log('Criando card para:', { id, tipo, data }); // Log importante

    const dataFormatada = data.data?.toDate ? data.data.toDate().toLocaleDateString('pt-BR') : 'Data não disponível';
    const precoFormatado = data.preco?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'Preço não informado';
    
    return `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="anuncio-card">
                <div class="anuncio-header">
                    <img src="${data.imagens?.[0] || 'img/sem-imagem.jpg'}" alt="${data.titulo}" class="anuncio-imagem-principal">
                    <span class="anuncio-badge">${tipo}</span>
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
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-excluir" data-id="${id}" data-tipo="${tipo.toLowerCase()}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function gerarDetalhesImovel(data) {
    return `
        <div class="detalhe-item">
            <span class="detalhe-icon"><i class="fas fa-home"></i></span>
            <span>${data.tipoImovel || 'Tipo não especificado'}</span>
        </div>
        <div class="detalhe-item">
            <span class="detalhe-icon"><i class="fas fa-map-marker-alt"></i></span>
            <span>${data.bairro || 'Local não informado'}</span>
        </div>
        <div class="detalhe-item">
            <span class="detalhe-icon"><i class="fas fa-bed"></i></span>
            <span>${data.quartos || 0} quarto${data.quartos !== 1 ? 's' : ''}</span>
        </div>
        <div class="detalhe-item">
            <span class="detalhe-icon"><i class="fas fa-bath"></i></span>
            <span>${data.banheiros || 0} banheiro${data.banheiros !== 1 ? 's' : ''}</span>
        </div>
        <div class="detalhe-item">
            <span class="detalhe-icon">
                ${data.garagem && data.garagem > 0 ? '<i class="fas fa-car"></i>' : '<span class="emoji">🚫</span>'}
            </span>
            <span>${data.garagem && data.garagem > 0 ? `${data.garagem} vaga${data.garagem !== 1 ? 's' : ''}` : 'Sem vaga'}</span>
        </div>
        <div class="detalhe-item">
            <span class="detalhe-icon"><i class="fas fa-ruler-combined"></i></span>
            <span>${data.area || '?'} m²</span>
        </div>
    `;
}

function gerarDetalhesAutomovel(data) {
    return `
        <div class="detalhe-item">
            <span class="detalhe-icon"><i class="fas fa-car"></i></span>
            <span>${data.marca || 'Marca não informada'}</span>
        </div>
        <div class="detalhe-item">
            <span class="detalhe-icon"><i class="fas fa-tag"></i></span>
            <span>${data.modelo || 'Modelo não informado'}</span>
        </div>
        <div class="detalhe-item">
            <span class="detalhe-icon"><i class="fas fa-calendar-alt"></i></span>
            <span>${data.ano || 'Ano não informado'}</span>
        </div>
        <div class="detalhe-item">
            <span class="detalhe-icon"><i class="fas fa-tachometer-alt"></i></span>
            <span>${data.km ? `${data.km.toLocaleString('pt-BR')} km` : 'KM não informada'}</span>
        </div>
        <div class="detalhe-item">
            <span class="detalhe-icon"><i class="fas fa-paint-brush"></i></span>
            <span>${data.cor || 'Cor não informada'}</span>
        </div>
        <div class="detalhe-item">
            <span class="detalhe-icon">
                ${data.combustivel ? '<i class="fas fa-gas-pump"></i>' : '<span class="emoji">❓</span>'}
            </span>
            <span>${data.combustivel || 'Combustível não informado'}</span>
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
