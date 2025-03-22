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
const nomeInput = document.getElementById("nome");
const telefoneInput = document.getElementById("telefone");
const emailInput = document.getElementById("email");
const cpfCnpjInput = document.getElementById("cpf-cnpj");
const dataNascimentoInput = document.getElementById("data-nascimento");
const creciInput = document.getElementById("creci");
const areaAtuacaoInput = document.getElementById("area-atuacao");
const anosExperienciaInput = document.getElementById("anos-experiencia");
const descricaoProfissionalInput = document.getElementById("descricao-profissional");
const cepInput = document.getElementById("cep");
const estadoInput = document.getElementById("estado");
const cidadeInput = document.getElementById("cidade");
const bairroInput = document.getElementById("bairro");
const tipoImovelInput = document.getElementById("tipo-imovel");
const tipoAutomovelInput = document.getElementById("tipo-automovel");
const faixaPrecoInput = document.getElementById("faixa-preco");
const tipoInteresseInput = document.getElementById("tipo-interesse");
const localizacaoInteresseInput = document.getElementById("localizacao-interesse");
const faixaPrecoInteresseInput = document.getElementById("faixa-preco-interesse");

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
            nome: nomeInput.value,
            telefone: telefoneInput.value,
            email: emailInput.value,
            cpfCnpj: cpfCnpjInput.value,
            dataNascimento: dataNascimentoInput.value,
            creci: creciInput.value,
            areaAtuacao: areaAtuacaoInput.value,
            anosExperiencia: anosExperienciaInput.value,
            descricaoProfissional: descricaoProfissionalInput.value,
            endereco: {
                cep: cepInput.value,
                estado: estadoInput.value,
                cidade: cidadeInput.value,
                bairro: bairroInput.value
            },
            preferenciasAtuacao: {
                tipoImovel: Array.from(tipoImovelInput.selectedOptions).map(option => option.value),
                tipoAutomovel: Array.from(tipoAutomovelInput.selectedOptions).map(option => option.value),
                faixaPreco: faixaPrecoInput.value
            },
            preferenciasBusca: {
                tipoInteresse: tipoInteresseInput.value,
                localizacaoInteresse: localizacaoInteresseInput.value,
                faixaPrecoInteresse: faixaPrecoInteresseInput.value
            }
        };

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
