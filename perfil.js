import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

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

// Elementos do formulário
const perfilForm = document.getElementById("perfil-form");
const tipoInteresseInput = document.getElementById("tipo-interesse");
const formImoveis = document.getElementById("form-imoveis");
const formAutomoveis = document.getElementById("form-automoveis");

// Alternar entre formulários de imóveis e automóveis
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

// Verifica o estado de autenticação
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Usuário logado:", user.uid);
    } else {
        // Usuário não está logado, redireciona para a página de login
        window.location.href = "login.html";
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
            tipoInteresse: tipoInteresseInput.value,
        };

        // Adiciona dados específicos com base no tipo de interesse
        if (tipoInteresseInput.value === "imoveis") {
            userData.imoveis = {
                tipoImovel: document.getElementById("tipo-imovel").value,
                localizacao: document.getElementById("localizacao-imovel").value,
                faixaPreco: document.getElementById("faixa-preco-imovel").value,
            };
        } else if (tipoInteresseInput.value === "automoveis") {
            userData.automoveis = {
                tipoAutomovel: document.getElementById("tipo-automovel").value,
                marca: document.getElementById("marca-automovel").value,
                faixaPreco: document.getElementById("faixa-preco-automovel").value,
            };
        }

        try {
            await setDoc(doc(db, "usuarios", user.uid), userData);
            alert("Perfil salvo com sucesso!");
            window.location.href = "index.html"; // Redireciona para a página inicial
        } catch (error) {
            console.error("Erro ao salvar perfil:", error);
            alert("Erro ao salvar perfil. Tente novamente.");
        }
    }
});
