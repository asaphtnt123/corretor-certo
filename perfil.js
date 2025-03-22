import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCNr5JoKsWJVeUYAaVDqmPznZo100v0uvg",
    authDomain: "corretorcerto-76933.firebaseapp.com",
    projectId: "corretorcerto-76933",
    storageBucket: "corretorcerto-76933.appspot.com",
    messagingSenderId: "357149829474",
    appId: "1:357149829474:web:324b2005d82eabbce5e43b"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

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

// Função para carregar e exibir as informações do usuário no card
async function carregarInformacoesUsuario(user) {
    const userDoc = await getDoc(doc(db, "usuarios", user.uid));
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
    }
}

// Verifica o estado de autenticação
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Usuário logado:", user.uid);
        carregarInformacoesUsuario(user); // Carrega as informações do usuário no card
    } else {
        // Usuário não está logado, redireciona para a página de login
        window.location.href = "login.html";
    }
});

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
            await setDoc(doc(db, "usuarios", user.uid), userData);
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
