// auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,  // Adicione esta importação
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCNr5JoKsWJVeUYAaVDqmPznZo100v0uvg",
  authDomain: "corretorcerto-76933.firebaseapp.com",
  databaseURL: "https://corretorcerto-76933-default-rtdb.firebaseio.com",
  projectId: "corretorcerto-76933",
  storageBucket: "corretorcerto-76933.firebasestorage.app",
  messagingSenderId: "357149829474",
  appId: "1:357149829474:web:324b2005d82eabbce5e43b"
};
// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Ativar persistência da autenticação
setPersistence(auth, browserLocalPersistence)
  .then(() => console.log("Persistência ativada"))
  .catch((error) => console.error("Erro na persistência:", error));

// DOM Elements
const registerForm = document.getElementById('registerForm');
const userRoleRadios = document.querySelectorAll('input[name="userRole"]');
const buyerSection = document.getElementById('buyerSection');
const sellerSection = document.getElementById('sellerSection');
const sellerTypeRadios = document.querySelectorAll('input[name="sellerType"]');
const professionalFields = document.getElementById('professionalFields');
const professionalAreaSelect = document.getElementById('professionalArea');
const creciField = document.getElementById('creciField');
const interestCards = document.querySelectorAll('.interest-card');
const buyerInterestsInput = document.getElementById('buyerInterests');


// Elementos DOM para controle das abas
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const loginForm = document.getElementById('loginForm');
const showRegisterLink = document.getElementById('showRegister');

// Função para alternar entre abas
function switchTab(tab) {
    if (tab === 'login') {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    } else if (tab === 'register') {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
    }
}

// Event Listeners para as abas
if (loginTab && registerTab) {
    loginTab.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab('login');
    });
    
    registerTab.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab('register');
    });
}

// Link "Cadastre-se" no formulário de login
if (showRegisterLink) {
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab('register');
    });
}

// Atualização da função handleLogin no auth.js
async function handleLogin(e) {
    e.preventDefault();
    
    const email = loginForm.loginEmail.value.trim();
    const password = loginForm.loginPassword.value;
    
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Obter o token de autenticação
        const token = await user.getIdToken();
        
        // Armazenar os tokens de autenticação
        localStorage.setItem('authToken', token);
        sessionStorage.setItem('authToken', token);
        localStorage.setItem('userEmail', user.email);
        localStorage.setItem('userId', user.uid);

        // Verificar se há redirecionamento pendente
        const urlParams = new URLSearchParams(window.location.search);
        const redirectTo = urlParams.get('redirect') || 'perfil'; // Padrão: perfil.html
        const planId = urlParams.get('plan');

        // Redirecionar conforme necessário
        if (redirectTo === 'planos' && planId) {
            console.log(`Redirecionando para planos.html?plan=${planId}`);
            window.location.href = `planos.html?plan=${planId}&fromLogin=true`;
        } else {
            console.log(`Redirecionando para ${redirectTo}.html`);
            window.location.href = `${redirectTo}.html?fromLogin=true`;
        }
        
    } catch (error) {
        console.error('Erro no login:', error);
        let errorMessage = 'Erro ao fazer login. Tente novamente.';
        
        if (error.code === 'auth/invalid-credential') {
            errorMessage = 'E-mail ou senha incorretos.';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Muitas tentativas. Tente novamente mais tarde.';
        } else if (error.code === 'auth/user-not-found') {
            errorMessage = 'Usuário não encontrado.';
        }
        
        Swal.fire({
            title: 'Erro',
            text: errorMessage,
            icon: 'error',
            confirmButtonText: 'Entendi'
        });
    }
}

// Adicione este listener para o formulário de login
if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
}

// Verificação de redirecionamento ao carregar a página de login
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const redirectTo = urlParams.get('redirect');
    const planId = urlParams.get('plan');

    if (redirectTo) {
        console.log(`Redirecionamento pendente para: ${redirectTo}.html`);
        console.log(`Plano selecionado: ${planId || 'Nenhum'}`);
        
        // Armazena temporariamente para caso a página seja recarregada
        if (redirectTo === 'planos' && planId) {
            sessionStorage.setItem('pendingPlan', planId);
        }
    }
});

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {

   // Verificar se há hash na URL para definir a aba inicial
    if (window.location.hash === '#login') {
        switchTab('login');
    } else {
        switchTab('register'); // Padrão: mostrar cadastro
    }
    // Alternar entre comprador e vendedor
    userRoleRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'buyer') {
                buyerSection.classList.remove('hidden');
                sellerSection.classList.add('hidden');
            } else {
                buyerSection.classList.add('hidden');
                sellerSection.classList.remove('hidden');
            }
        });
    });

    // Alternar entre particular e profissional
    sellerTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'professional') {
                professionalFields.classList.remove('hidden');
            } else {
                professionalFields.classList.add('hidden');
            }
        });
    });

    // Mostrar campo CRECI apenas para corretores de imóveis
    professionalAreaSelect.addEventListener('change', function() {
        if (this.value === 'imoveis' || this.value === 'ambas') {
            creciField.classList.remove('hidden');
        } else {
            creciField.classList.add('hidden');
        }
    });

    // Selecionar interesses (para compradores)
    interestCards.forEach(card => {
        card.addEventListener('click', function() {
            this.classList.toggle('selected');
            updateSelectedInterests();
        });
    });

    // Máscaras de input
    const phoneInput = document.getElementById('registerPhone');
    phoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) value = value.substring(0, 11);
        
        if (value.length > 2) {
            value = `(${value.substring(0,2)}) ${value.substring(2)}`;
        }
        if (value.length > 10) {
            value = `${value.substring(0,10)}-${value.substring(10)}`;
        }
        e.target.value = value;
    });

    // Validação do formulário
    registerForm.addEventListener('submit', handleRegister);
});

function updateSelectedInterests() {
    const selected = Array.from(document.querySelectorAll('.interest-card.selected'))
                         .map(card => card.dataset.interest);
    buyerInterestsInput.value = selected.join(',');
}

async function handleRegister(e) {
    e.preventDefault();
    
    // Validação básica
    if (!validateForm()) return;
    
    // Obter valores do formulário
    const name = registerForm.registerName.value.trim();
    const email = registerForm.registerEmail.value.trim();
    const phone = registerForm.registerPhone.value.trim();
    const password = registerForm.registerPassword.value;
    const userRole = document.querySelector('input[name="userRole"]:checked').value;
    let sellerType = null; // Definir a variável aqui
    
    try {
        // Criar usuário no Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Preparar dados para Firestore
        const userData = {
            name,
            email,
            phone,
            userRole,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        // Adicionar dados específicos do comprador
        if (userRole === 'buyer') {
            userData.buyerProfile = {
                interests: buyerInterestsInput.value.split(','),
                preferenceLocation: registerForm.preferenceLocation.value.trim(),
                budgetRange: registerForm.budgetRange.value
            };
        } 
        // Adicionar dados específicos do vendedor
        else {
            sellerType = document.querySelector('input[name="sellerType"]:checked').value; // Atribuir valor aqui
            userData.sellerProfile = {
                sellerType,
                aboutBusiness: registerForm.aboutBusiness.value.trim()
            };
            
            // Se for profissional
            if (sellerType === 'professional') {
                userData.sellerProfile.professional = {
                    area: registerForm.professionalArea.value,
                    ...(registerForm.professionalArea.value === 'imoveis' || 
                        registerForm.professionalArea.value === 'ambas') && {
                        creci: registerForm.creci.value.trim()
                    },
                    ...(registerForm.cnpj.value.trim() && {
                        cnpj: registerForm.cnpj.value.trim()
                    }),
                    approved: false // Requer aprovação manual
                };
                
                // Validação adicional para profissionais
                if ((registerForm.professionalArea.value === 'imoveis' || 
                     registerForm.professionalArea.value === 'ambas') && 
                    !registerForm.creci.value.trim()) {
                    showError('Por favor, informe seu CRECI', creciField);
                    return;
                }
            }
        }
        
        // Salvar no Firestore
        await setDoc(doc(db, 'users', user.uid), userData);
        
        // Feedback para o usuário
        Swal.fire({
            title: 'Cadastro realizado!',
            text: userRole === 'buyer' 
                ? 'Agora você pode buscar os melhores imóveis e automóveis!' 
                : sellerType === 'professional' 
                    ? 'Seu cadastro profissional será analisado e em breve você poderá anunciar!' 
                    : 'Agora você pode anunciar seus imóveis e automóveis!',
            icon: 'success',
            confirmButtonText: 'Continuar'
        }).then(() => {
            window.location.href = userRole === 'buyer' 
                ? 'buscar.html' 
                : sellerType === 'professional' 
                    ? 'aguardando-aprovacao.html' 
                    : 'index.html';
        });
        
    } catch (error) {
        console.error('Erro no cadastro:', error);
        let errorMessage = 'Erro ao realizar cadastro. Tente novamente.';
        
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'Este e-mail já está cadastrado.';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'A senha deve ter pelo menos 6 caracteres.';
        }
        
        Swal.fire({
            title: 'Erro',
            text: errorMessage,
            icon: 'error',
            confirmButtonText: 'Entendi'
        });
    }
}
function validateForm() {
    let isValid = true;
    
    // Validar campos obrigatórios
    const requiredFields = [
        'registerName', 'registerEmail', 'registerPhone', 
        'registerPassword', 'registerConfirmPassword'
    ];
    
    requiredFields.forEach(id => {
        const field = document.getElementById(id);
        if (!field.value.trim()) {
            showError('Este campo é obrigatório', field);
            isValid = false;
        }
    });
    
    // Validar e-mail
    const email = document.getElementById('registerEmail');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
        showError('Por favor, insira um e-mail válido', email);
        isValid = false;
    }
    
    // Validar senha
    const password = document.getElementById('registerPassword');
    if (password.value.length < 6) {
        showError('A senha deve ter pelo menos 6 caracteres', password);
        isValid = false;
    }
    
    // Validar confirmação de senha
    const confirmPassword = document.getElementById('registerConfirmPassword');
    if (confirmPassword.value !== password.value) {
        showError('As senhas não coincidem', confirmPassword);
        isValid = false;
    }
    
    // Validar termos
    if (!document.getElementById('termsAgreement').checked) {
        Swal.fire({
            title: 'Atenção',
            text: 'Você deve aceitar os Termos de Serviço e Política de Privacidade',
            icon: 'warning',
            confirmButtonText: 'Entendi'
        });
        isValid = false;
    }
    
    // Validação específica para compradores
    if (document.querySelector('input[name="userRole"]:checked').value === 'buyer') {
        if (!buyerInterestsInput.value) {
            Swal.fire({
                title: 'Atenção',
                text: 'Por favor, selecione pelo menos um interesse',
                icon: 'warning',
                confirmButtonText: 'Entendi'
            });
            isValid = false;
        }
    }
    
    return isValid;
}

function showError(message, field) {
    field.classList.add('is-invalid');
    const feedback = field.nextElementSibling;
    if (feedback && feedback.classList.contains('invalid-feedback')) {
        feedback.textContent = message;
    }
    
    // Scroll para o campo com erro
    field.scrollIntoView({ behavior: 'smooth', block: 'center' });
    field.focus();
}
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
