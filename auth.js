// auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_DOMINIO.firebaseapp.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID"
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

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
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
            const sellerType = document.querySelector('input[name="sellerType"]:checked').value;
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
                    : 'meus-anuncios.html';
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
