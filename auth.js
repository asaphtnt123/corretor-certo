import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    setPersistence,
    browserLocalPersistence,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore,
    doc,
    setDoc
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

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Ativar persistência da autenticação
setPersistence(auth, browserLocalPersistence)
    .then(() => console.log("Persistência ativada"))
    .catch((error) => console.error("Erro na persistência:", error));

// Elementos DOM
const togglePasswordBtns = document.querySelectorAll('.toggle-password');
const userTypeRadios = document.querySelectorAll('input[name="userType"]');
const professionalFields = document.getElementById('professionalFields');
const professionalAreaSelect = document.getElementById('professionalArea');
const creciField = document.getElementById('creciField');

// Elementos DOM
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showLogin = document.getElementById('showLogin');

// Inicialização - Garantir que apenas o login esteja visível inicialmente
registerForm.classList.add('hidden');
loginTab.classList.add('active');
registerTab.classList.remove('active');

// Alternar entre login e cadastro
loginTab.addEventListener('click', (e) => {
    e.preventDefault();
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
});

registerTab.addEventListener('click', (e) => {
    e.preventDefault();
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
});

showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    loginTab.click(); // Simula o clique na aba de login
});

// Mostrar/ocultar senha
togglePasswordBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const input = e.currentTarget.parentElement.querySelector('input');
        const icon = e.currentTarget.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.replace('fa-eye-slash', 'fa-eye');
        }
    });
});

// Mostrar campos de profissional quando selecionado
userTypeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        professionalFields.classList.toggle('hidden', e.target.value !== 'comercial');
    });
});

// Mostrar CRECI apenas para corretores de imóveis
professionalAreaSelect.addEventListener('change', (e) => {
    creciField.classList.toggle('hidden', !e.target.value.includes('imoveis'));
});

// Formulário de Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = loginForm.loginEmail.value.trim();
    const password = loginForm.loginPassword.value;
    
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Redirecionar após login
        window.location.href = 'perfil.html';
    } catch (error) {
        console.error('Erro no login:', error);
        
        let errorMessage = 'Erro ao fazer login. Tente novamente.';
        switch (error.code) {
            case 'auth/invalid-email':
                errorMessage = 'E-mail inválido.';
                break;
            case 'auth/user-not-found':
                errorMessage = 'Usuário não encontrado.';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Senha incorreta.';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Muitas tentativas. Tente novamente mais tarde.';
                break;
        }
        
        alert(errorMessage);
    }
});

// Formulário de Cadastro
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Obter valores do formulário
    const name = registerForm.registerName.value.trim();
    const email = registerForm.registerEmail.value.trim();
    const phone = registerForm.registerPhone.value.trim();
    const password = registerForm.registerPassword.value;
    const confirmPassword = registerForm.registerConfirmPassword.value;
    const userType = document.querySelector('input[name="userType"]:checked').value;
    
    // Validações
    if (password !== confirmPassword) {
        alert('As senhas não coincidem!');
        return;
    }
    
    if (password.length < 6) {
        alert('A senha deve ter pelo menos 6 caracteres!');
        return;
    }
    
    try {
        // Criar usuário no Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Salvar dados adicionais no Firestore
        const userData = {
            name,
            email,
            phone,
            userType,
            createdAt: new Date()
        };
        
        if (userType === 'comercial') {
            const professionalArea = professionalAreaSelect.value;
            const creci = registerForm.creci.value.trim();
            const cnpj = registerForm.cnpj.value.trim();
            
            userData.professional = {
                area: professionalArea,
                ...(professionalArea.includes('imoveis') && { creci }),
                ...(cnpj && { cnpj }),
                approved: false
            };
        }
        
        await setDoc(doc(db, 'users', user.uid), userData);
        
        // Redirecionar após cadastro
        alert(userType === 'comercial' 
            ? 'Cadastro realizado! Aguarde aprovação.' 
            : 'Cadastro realizado com sucesso!');
        
        window.location.href = userType === 'comercial' 
            ? 'aguardando-aprovacao.html' 
            : 'perfil.html';
        
    } catch (error) {
        console.error('Erro no cadastro:', error);
        
        let errorMessage = 'Erro ao cadastrar. Tente novamente.';
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'Este e-mail já está em uso.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'E-mail inválido.';
                break;
            case 'auth/weak-password':
                errorMessage = 'Senha muito fraca. Use pelo menos 6 caracteres.';
                break;
        }
        
        alert(errorMessage);
    }
});

// Recuperação de senha
document.querySelector('.forgot-password').addEventListener('click', async (e) => {
    e.preventDefault();
    
    const email = prompt('Digite seu e-mail para redefinir a senha:');
    if (!email) return;
    
    try {
        await sendPasswordResetEmail(auth, email);
        alert('E-mail de redefinição enviado! Verifique sua caixa de entrada.');
    } catch (error) {
        console.error('Erro ao enviar e-mail:', error);
        alert('Erro ao enviar e-mail. Verifique se o e-mail está correto.');
    }
});
