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
const tipoUsuarioInput = document.getElementById("tipo-usuario");

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

    const nome = nomeInput.value;
    const telefone = telefoneInput.value;
    const tipoUsuario = tipoUsuarioInput.value;

    try {
        const user = auth.currentUser;
        if (user) {
            // Salva os dados do usuário no Firestore
            await setDoc(doc(db, "usuarios", user.uid), {
                nome: nome,
                telefone: telefone,
                tipoUsuario: tipoUsuario,
                dataCadastro: new Date()
            });
            alert("Perfil salvo com sucesso!");
            window.location.href = "index.html"; // Redireciona para a página inicial
        }
    } catch (error) {
        console.error("Erro ao salvar perfil:", error);
        alert("Erro ao salvar perfil. Tente novamente.");
    }
});
