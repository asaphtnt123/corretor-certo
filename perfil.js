import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

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

// Elementos da página
const userNameElement = document.getElementById("user-name");
const userEmailElement = document.getElementById("user-email");
const userPhoneElement = document.getElementById("user-phone");
const userTypeElement = document.getElementById("user-type");
const userCreatedAtElement = document.getElementById("user-created-at");
const logoutButton = document.getElementById("logout");

// Verifica o estado de autenticação
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Usuário está logado
        console.log("Usuário logado:", user.uid);

        // Recupera os dados do usuário do Firestore
        const userDoc = await getDoc(doc(db, "usuarios", user.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();

            // Exibe as informações do usuário
            userNameElement.textContent = userData.nome || "Não informado";
            userEmailElement.textContent = user.email;
            userPhoneElement.textContent = userData.telefone || "Não informado";
            userTypeElement.textContent = userData.tipoUsuario || "Não informado";
            userCreatedAtElement.textContent = userData.dataCadastro.toDate().toLocaleDateString() || "Não informado";
        } else {
            console.error("Documento do usuário não encontrado no Firestore.");
        }
    } else {
        // Usuário não está logado, redireciona para a página de login
        window.location.href = "login.html";
    }
});

// Logout
logoutButton.addEventListener("click", () => {
    signOut(auth)
        .then(() => {
            console.log("Usuário deslogado com sucesso.");
            window.location.href = "login.html";
        })
        .catch((error) => {
            console.error("Erro ao fazer logout:", error);
        });
});
