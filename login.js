import { db, auth } from "./firebase.js"; // Ajuste o caminho conforme necessário


// Verifica se o Firebase inicializou corretamente
console.log("Firebase inicializado:", app);
console.log("Auth:", auth);
console.log("Firestore:", db);

// Ativa persistência do login
setPersistence(auth, browserLocalPersistence)
  .then(() => console.log("Persistência ativada!"))
  .catch(error => console.error("Erro na persistência:", error));

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
        console.log("Criando usuário...");
        const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
        await new Promise(resolve => setTimeout(resolve, 1000));

        const user = userCredential.user;
        console.log("Usuário criado no Authentication:", user);

        await updateProfile(user, { displayName: nome });

        console.log("Tentando salvar usuário no Firestore...");
        await setDoc(doc(db, "usuarios", user.uid), {
            nome: nome,
            telefone: telefone,
            email: email,
            tipoUsuario: tipoUsuario,
            dataCadastro: new Date()
        });
        console.log("Usuário salvo com sucesso no Firestore!");

        window.location.href = "perfil.html";
    } catch (error) {
        console.error("Erro no cadastro:", error);
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

        window.location.href = "index.html";
    } catch (error) {
        console.error("Erro no login:", error.message);
        alert("Erro ao fazer login: " + error.message);
    }
});

// Verificar se o usuário já está logado
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Usuário já está logado:", user);
        window.location.href = "index.html";
    } else {
        console.log("Nenhum usuário logado.");
    }
});
// Verifica parâmetros de redirecionamento ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const redirectTo = urlParams.get('redirect'); // 'planos' no seu caso
  const planId = urlParams.get('plan'); // ID do plano (basico, profissional, etc)

  if (redirectTo) {
    console.log(`Redirecionamento pendente para: ${redirectTo}.html`);
    sessionStorage.setItem('pendingRedirect', redirectTo);
    
    if (planId) {
      sessionStorage.setItem('targetPlan', planId);
    }
  }
});

// Função chamada quando o login é bem-sucedido
function onLoginSuccess(user) {
  return user.getIdToken().then(token => {
    // Armazena o token de autenticação
    localStorage.setItem('authToken', token);
    sessionStorage.setItem('authToken', token);
    localStorage.setItem('userEmail', user.email);
    localStorage.setItem('userId', user.uid);

    // Recupera o redirecionamento pendente
    const redirectTo = sessionStorage.getItem('pendingRedirect') || 'index';
    const targetPlan = sessionStorage.getItem('targetPlan');

    // Limpa os valores temporários
    sessionStorage.removeItem('pendingRedirect');
    sessionStorage.removeItem('targetPlan');

    // Redireciona para a página original
    if (redirectTo === 'planos' && targetPlan) {
      window.location.href = `planos.html?autologin=true&plan=${targetPlan}`;
    } else {
      window.location.href = `${redirectTo}.html?autologin=true`;
    }
  });
}
