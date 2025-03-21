import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

const auth = getAuth();

onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById("user-info").innerHTML = `Olá, ${user.displayName || "Usuário"} <br> Email: ${user.email}`;
        document.getElementById("tipo-usuario").textContent = `Tipo de conta: ${localStorage.getItem("tipoUsuario") || "Comum"}`;
    } else {
        window.location.href = "login.html";
    }
});

document.getElementById("logout").addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "login.html";
});
