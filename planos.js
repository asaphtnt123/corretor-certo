/**
 * Sistema de Pagamento Completo - Corretor Certo
 * Versão 6.0 - Solução Definitiva
 */

class PaymentSystem {
  constructor(options = {}) {
    // Configurações padrão
    this.config = {
      apiEndpoint: options.apiEndpoint || '/.netlify/functions/create-checkout-session',
      authRequired: options.authRequired !== false,
      defaultCurrency: 'BRL',
      loadingText: '<span class="spinner"></span> Processando...',
      maxRetryAttempts: 3,
      retryDelay: 1000
    };

    // Estados
    this.state = {
      isLoading: false,
      currentPlanoId: null,
      currentRequest: null,
      retryCount: 0
    };

    // Inicializa o sistema
    this.initializeSystem();
  }

  /* ========== MÉTODOS PRINCIPAIS ========== */

  initializeSystem = async () => {
    try {
      // Verifica dependências
      this.checkDependencies();
      
      // Inicializações
      this.initPlanos();
      await this.initStripe();
      this.initEventListeners();
      this.setupErrorHandling();
      
      console.log('Sistema de pagamento inicializado com sucesso');
    } catch (error) {
      console.error('Falha na inicialização:', error);
      this.showFatalError('Sistema temporariamente indisponível');
    }
  };

  checkDependencies = () => {
    if (typeof Stripe === 'undefined') {
      throw new Error('Biblioteca Stripe não carregada');
    }
    if (typeof fetch === 'undefined') {
      throw new Error('API fetch não disponível');
    }
  };

  initPlanos = () => {
    this.planos = {
      basico: {
        id: 'basico',
        nome: 'Plano Básico',
        preco: 2990,
        moeda: this.config.defaultCurrency,
        features: ['Acesso básico', 'Suporte por email', 'Relatórios simples'],
        ciclo: 'mensal'
      },
      profissional: {
        id: 'profissional',
        nome: 'Plano Profissional',
        preco: 5990,
        moeda: this.config.defaultCurrency,
        features: ['Acesso completo', 'Suporte prioritário', 'Relatórios avançados'],
        ciclo: 'mensal'
      },
      premium: {
        id: 'premium',
        nome: 'Plano Premium',
        preco: 9990,
        moeda: this.config.defaultCurrency,
        features: ['Acesso completo', 'Suporte 24/7', 'Consultoria personalizada'],
        ciclo: 'anual'
      }
    };
  };

  initStripe = async () => {
    this.stripeKey = await this.getStripeKey();
    
    if (!this.stripeKey?.startsWith('pk_')) {
      throw new Error('Chave pública do Stripe inválida');
    }

    this.stripe = Stripe(this.stripeKey, {
      locale: 'pt-BR',
      apiVersion: '2023-08-16'
    });
  };

  getStripeKey = async () => {
    try {
      const response = await fetch('/.netlify/functions/getStripeKey');
      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
      
      const data = await response.json();
      if (!data?.key) throw new Error('Resposta inválida');
      
      return data.key;
    } catch (error) {
      console.error('Falha ao obter chave:', error);
      return 'pk_live_51RGQ2oCaTJrTX5Tupk7zHAmRzxDgX9RtmxlFRwGNlyHudrhMjPVu0yx871bch1PpXkfUnOQN0UXB1mXzhwSMrDrG00ix8LTK9b';
    }
  };

  initEventListeners = () => {
    document.addEventListener('click', (e) => {
      const button = e.target.closest('[data-plano]');
      if (!button || this.state.isLoading) return;
      
      this.handlePaymentClick(button).catch(error => {
        console.error('Erro no clique:', error);
        this.showError('Erro ao processar pagamento');
      });
    });
  };

  setupErrorHandling = () => {
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Erro não tratado:', event.reason);
      this.showError('Ocorreu um erro inesperado');
    });
  };

  /* ========== FLUXO DE PAGAMENTO ========== */

  handlePaymentClick = async (button) => {
    try {
      this.setState({ isLoading: true, currentPlanoId: button.dataset.plano });
      
      const userId = this.config.authRequired ? await this.getCurrentUserId() : null;
      if (this.config.authRequired && !userId) {
        return this.handleUnauthenticated(button);
      }

      await this.processPayment(button.dataset.plano, userId);
    } catch (error) {
      this.handlePaymentError(error, button);
    } finally {
      this.setState({ isLoading: false });
    }
  };

  processPayment = async (planoId, userId) => {
    const plano = this.planos[planoId];
    if (!plano) throw new Error('Plano inválido');

    const session = await this.createPaymentSession({
      planoId,
      userId,
      userEmail: await this.getUserEmail(),
      userIP: await this.getUserIP(),
      deviceInfo: this.getDeviceInfo()
    });

    const result = await this.stripe.redirectToCheckout({
      sessionId: session.id
    });

    if (result.error) throw result.error;
  };

  createPaymentSession = async (paymentData) => {
    const abortController = new AbortController();
    this.setState({ currentRequest: abortController });

    try {
      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify(paymentData),
        signal: abortController.signal
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Erro ao criar sessão');
      }

      return await response.json();
    } finally {
      this.setState({ currentRequest: null });
    }
  };

  /* ========== MÉTODOS AUXILIARES ========== */

 // No método getCurrentUserId, atualize para:
getCurrentUserId = async () => {
  // 1. Primeiro verifica o Firebase Auth
  if (typeof firebase !== 'undefined' && firebase.auth().currentUser) {
    return firebase.auth().currentUser.uid;
  }
  
  // 2. Verifica se há token válido no localStorage/sessionStorage
  const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  if (authToken) {
    return this.validateToken(authToken); // Método novo que vamos adicionar
  }
  
  // 3. Se não encontrou usuário autenticado
  return null;
};

// Adicione este novo método à classe:
validateToken = async (token) => {
  try {
    // Verifica com seu backend ou Firebase Admin
    const response = await fetch('/.netlify/functions/validate-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.userId;
    }
    return null;
  } catch (error) {
    console.error('Erro ao validar token:', error);
    return null;
  }
};

  getAuthToken = async () => {
    if (typeof firebase !== 'undefined' && firebase.auth().currentUser) {
      return await firebase.auth().currentUser.getIdToken();
    }
    return localStorage.getItem('authToken');
  };

  getUserEmail = async () => {
    if (typeof firebase !== 'undefined' && firebase.auth().currentUser) {
      return firebase.auth().currentUser.email;
    }
    return localStorage.getItem('userEmail');
  };

  getUserIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return null;
    }
  };

  getDeviceInfo = () => ({
    userAgent: navigator.userAgent,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    language: navigator.language
  });

 // Modifique o handleUnauthenticated para redirecionar corretamente:
handleUnauthenticated = (button) => {
  this.showError('Redirecionando para login...');
  setTimeout(() => {
    window.location.href = 'index.html?redirect=planos';
  }, 1500);
};

  handlePaymentError = (error, button) => {
    console.error('Erro no pagamento:', error);
    this.showError(this.getErrorMessage(error));
    if (button) button.disabled = false;
  };

  getErrorMessage = (error) => {
    const errorMap = {
      'card_declined': 'Cartão recusado',
      'expired_card': 'Cartão expirado',
      'insufficient_funds': 'Saldo insuficiente'
    };
    return errorMap[error.code] || error.message || 'Erro ao processar pagamento';
  };

  setState = (newState) => {
    this.state = { ...this.state, ...newState };
    this.updateUI();
  };

  updateUI = () => {
    const buttons = document.querySelectorAll('[data-plano]');
    buttons.forEach(btn => {
      const isLoading = this.state.isLoading && btn.dataset.plano === this.state.currentPlanoId;
      btn.disabled = this.state.isLoading;
      btn.innerHTML = isLoading ? this.config.loadingText : `Assinar ${this.planos[btn.dataset.plano]?.nome || ''}`;
    });
  };

  showError = (message, duration = 5000) => {
    const errorEl = document.createElement('div');
    errorEl.className = 'payment-error';
    errorEl.innerHTML = `<div style="position:fixed;bottom:20px;right:20px;padding:15px;background:#ffebee;color:#c62828;border-radius:4px;box-shadow:0 2px 10px rgba(0,0,0,0.1);z-index:1000">⚠️ ${message}</div>`;
    document.body.appendChild(errorEl);
    setTimeout(() => errorEl.remove(), duration);
  };

  showFatalError = (message = 'Sistema indisponível') => {
    const errorEl = document.createElement('div');
    errorEl.className = 'payment-fatal-error';
    errorEl.innerHTML = `<div style="position:fixed;top:0;left:0;right:0;padding:15px;background:#d32f2f;color:white;text-align:center;z-index:9999">${message}</div>`;
    document.body.prepend(errorEl);
    document.querySelectorAll('[data-plano]').forEach(btn => btn.disabled = true);
  };
}

/* ========== INICIALIZAÇÃO ========== */

function initializePaymentSystem() {
  try {
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      throw new Error('Requer conexão segura (HTTPS)');
    }

    const configElement = document.getElementById('payment-config');
    new PaymentSystem({
      apiEndpoint: configElement?.dataset.apiEndpoint
    });
  } catch (error) {
    console.error('Falha na inicialização:', error);
    const errorEl = document.createElement('div');
    errorEl.innerHTML = `<div style="padding:20px;background:#ffebee;color:#c62828;text-align:center;margin:20px;border-radius:4px">${error.message || 'Erro ao carregar o sistema de pagamento'}</div>`;
    document.body.appendChild(errorEl);
  }
}

// Inicialização segura
if (document.readyState === 'complete') {
  initializePaymentSystem();
} else {
  document.addEventListener('DOMContentLoaded', initializePaymentSystem);
}
