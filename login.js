import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, setPersistence, browserLocalPersistence, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

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

// Ativa persistência do login
setPersistence(auth, browserLocalPersistence).then(() => console.log("Persistência ativada!"));

// Alternar entre Login e Cadastro
document.getElementById("login-tab").addEventListener("click", () => toggleForm("login"));
document.getElementById("cadastro-tab").addEventListener("click", () => toggleForm("cadastro"));

function toggleForm(type) {
    document.getElementById("login-form").style.display = type === "login" ? "block" : "none";
    document.getElementById("cadastro-form").style.display = type === "cadastro" ? "block" : "none";
}

// Cadastro de Usuário
document.getElementById("cadastro-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const nome = document.getElementById("cadastro-nome").value;
    const telefone = document.getElementById("cadastro-telefone").value;
    const email = document.getElementById("cadastro-email").value;
    const senha = document.getElementById("cadastro-senha").value;
    const tipoUsuario = document.getElementById("tipo-usuario").value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
        const user = userCredential.user;
        await updateProfile(user, { displayName: nome });

        // Salvar dados no Firestore
        await setDoc(doc(db, "usuarios", user.uid), {
            nome: nome,
            telefone: telefone,
            email: email,
            tipoUsuario: tipoUsuario,
            dataCadastro: new Date()
        });

        localStorage.setItem("userName", nome);
        window.location.href = "perfil.html";
    } catch (error) {
        console.error("Erro no cadastro:", error.message);
        alert("Erro ao criar conta: " + error.message);
    }
});

// Login de Usuário
document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    const senha = document.getElementById("login-senha").value;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, senha);
        const user = userCredential.user;

        // Verifica o tipo de usuário no Firestore
        const userDoc = await getDoc(doc(db, "usuarios", user.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            localStorage.setItem("userName", userData.nome);
            localStorage.setItem("tipoUsuario", userData.tipoUsuario);
        }

        window.location.href = "perfil.html";
    } catch (error) {
        console.error("Erro no login:", error.message);
        alert("Erro ao fazer login: " + error.message);
    }
});

// Verificar se o usuário já está logado
onAuthStateChanged(auth, (user) => {
    if (user) {
        window.location.href = "perfil.html";
    }
});
