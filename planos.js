/**
 * Sistema de Pagamento Completo - Corretor Certo
 * Integração com Stripe e Firebase
 * Versão 4.0 - Segura, Modular e Pronta para Produção
 */

// No início do arquivo
if (typeof Stripe === 'undefined') {
  console.error('Stripe.js não carregou! Verifique o bloqueio de scripts no navegador');
}


class PaymentSystem {
  constructor() {
    try {
      this.stripeKey = this.getStripeKey();
      if (!this.stripeKey) throw new Error('Configuração de pagamento incompleta');
      
      this.stripe = Stripe(this.stripeKey, {
        locale: 'pt-BR',
        apiVersion: '2023-08-16'
      });
      
      this.initEventListeners();
    } catch (error) {
      console.error('Falha na inicialização:', error);
      this.showError('Sistema de pagamento temporariamente indisponível');
    }
  }

  getStripeKey() {
    // Modo produção - só aceita variável de ambiente
    return typeof process !== 'undefined' ? process.env.STRIPE_PUBLISHABLE_KEY : null;
  }
  /* ========== INICIALIZAÇÃO ========== */

  initStripe() {
    try {
      if (typeof Stripe === 'undefined') {
        throw new Error('Stripe.js não está disponível');
      }

      if (!this.config.stripeKey) {
        throw new Error('Chave pública do Stripe não configurada');
      }

      this.stripe = Stripe(this.config.stripeKey, {
        locale: 'pt-BR',
        betas: ['process_order_beta_3']
      });
    } catch (error) {
      console.error('Falha ao inicializar Stripe:', error);
      this.showFatalError('Sistema de pagamento indisponível');
    }
  }

  initPlanos() {
    this.planos = {
      basico: {
        id: 'basico',
        nome: 'Plano Básico',
        preco: 2990,
        moeda: this.config.defaultCurrency,
        ciclo: 'mensal',
        features: [
          'Acesso básico à plataforma',
          'Suporte por e-mail',
          'Relatórios simples'
        ],
        metadata: {
          tipo: 'assinatura',
          nivel: 'iniciante'
        }
      },
      profissional: {
        id: 'profissional',
        nome: 'Plano Profissional',
        preco: 5990,
        moeda: this.config.defaultCurrency,
        ciclo: 'mensal',
        features: [
          'Acesso completo',
          'Suporte prioritário',
          'Relatórios avançados'
        ],
        metadata: {
          tipo: 'assinatura',
          nivel: 'avancado'
        }
      },
      premium: {
        id: 'premium',
        nome: 'Plano Premium',
        preco: 9990,
        moeda: this.config.defaultCurrency,
        ciclo: 'anual',
        features: [
          'Acesso completo',
          'Suporte 24/7',
          'Consultoria personalizada'
        ],
        metadata: {
          tipo: 'assinatura',
          nivel: 'premium'
        }
      }
    };
  }

  initEventListeners() {
    // Delegation para melhor performance
    document.addEventListener('click', (e) => {
      const button = e.target.closest('[data-plano]');
      if (!button || this.state.isLoading) return;

      this.handlePaymentClick(button);
    });
  }

  setupErrorHandling() {
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Erro não tratado:', event.reason);
      this.showError('Ocorreu um erro inesperado');
    });
  }

  /* ========== MÉTODOS PRINCIPAIS ========== */

  async handlePaymentClick(button) {
    try {
      const planoId = button.dataset.plano;
      const userId = this.config.authRequired ? await this.getCurrentUserId() : null;

      if (this.config.authRequired && !userId) {
        return this.handleUnauthenticated(button);
      }

      await this.processPayment(planoId, userId);
    } catch (error) {
      this.handlePaymentError(error, button);
    }
  }

  async processPayment(planoId, userId) {
    this.setState({ isLoading: true });

    try {
      const plano = this.planos[planoId];
      if (!plano) throw new Error('Plano não encontrado');

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
    } finally {
      this.setState({ isLoading: false });
    }
  }

  async createPaymentSession(paymentData) {
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erro ao criar sessão de pagamento');
      }

      return await response.json();
    } finally {
      this.setState({ currentRequest: null });
    }
  }

  /* ========== MÉTODOS DE AUTENTICAÇÃO ========== */

  async getCurrentUserId() {
    // Implementação para Firebase Auth
    if (typeof firebase !== 'undefined' && firebase.auth().currentUser) {
      return firebase.auth().currentUser.uid;
    }

    // Implementação genérica (adaptar conforme necessário)
    return localStorage.getItem('userId') || sessionStorage.getItem('userId') || null;
  }

  async getAuthToken() {
    // Firebase Auth
    if (typeof firebase !== 'undefined' && firebase.auth().currentUser) {
      return await firebase.auth().currentUser.getIdToken();
    }

    // Implementação genérica
    return localStorage.getItem('authToken') || null;
  }

  async getUserEmail() {
    // Firebase Auth
    if (typeof firebase !== 'undefined' && firebase.auth().currentUser) {
      return firebase.auth().currentUser.email;
    }

    // Implementação genérica
    return localStorage.getItem('userEmail') || null;
  }

  /* ========== MÉTODOS AUXILIARES ========== */

  async getUserIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json', {
        timeout: 2000
      });
      const data = await response.json();
      return data.ip || null;
    } catch {
      return null;
    }
  }

  getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      language: navigator.language
    };
  }

  detectStripeKey() {
    // 1. Tenta obter de atributo data-* no HTML
    const fromDOM = document.getElementById('stripe-config')?.dataset.publishableKey;
    if (fromDOM) return fromDOM;

    // 2. Tenta obter de variável de ambiente (build-time)
    if (typeof process !== 'undefined' && process.env.STRIPE_PUBLISHABLE_KEY) {
      return process.env.STRIPE_PUBLISHABLE_KEY;
    }

    // 3. Fallback para desenvolvimento
    if (window.location.hostname === 'localhost') {
      return 'pk_test_51RGQ31Ctf0sheJfc7YQ32qSzBdzRIsyLRAzBqf3lEgd5F4Ej5RJr3Kp0ZsgkVVUQxouU9vF4jzC2Okp5bmbG3Ic40042yaPE84';
    }

    return null;
  }

  /* ========== GERENCIAMENTO DE ESTADO ========== */

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.updateUI();
  }

  updateUI() {
    const buttons = document.querySelectorAll('[data-plano]');
    buttons.forEach(button => {
      button.disabled = this.state.isLoading;
      
      if (this.state.isLoading && button.dataset.plano === this.state.currentPlanoId) {
        button.innerHTML = this.config.loadingText || 'Processando...';
      } else {
        const plano = this.planos[button.dataset.plano];
        button.innerHTML = plano ? `Assinar ${plano.nome}` : 'Assinar';
      }
    });
  }

  /* ========== TRATAMENTO DE ERROS ========== */

  handleUnauthenticated(button) {
    this.showError('Por favor, faça login para continuar');
    button.disabled = false;
    
    // Opcional: redirecionar para login
    // window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
  }

  handlePaymentError(error, button) {
    console.error('Erro no pagamento:', {
      error,
      button: button?.dataset?.plano,
      timestamp: new Date().toISOString()
    });

    this.showError(this.getErrorMessage(error));
    
    if (button) {
      button.disabled = false;
      const plano = this.planos[button.dataset.plano];
      button.innerHTML = plano ? `Assinar ${plano.nome}` : 'Assinar';
    }

    this.setState({ isLoading: false });
  }

  getErrorMessage(error) {
    const errorMap = {
      'card_declined': 'Seu cartão foi recusado',
      'expired_card': 'Cartão expirado',
      'insufficient_funds': 'Saldo insuficiente',
      'authentication_required': 'Autenticação 3D Secure necessária'
    };

    return errorMap[error.code] || 
           error.message || 
           'Ocorreu um erro ao processar seu pagamento';
  }

  /* ========== UI/UX ========== */

  showError(message, duration = 5000) {
    let errorContainer = document.getElementById('payment-error-container');
    
    if (!errorContainer) {
      errorContainer = document.createElement('div');
      errorContainer.id = 'payment-error-container';
      errorContainer.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
      `;
      document.body.appendChild(errorContainer);
    }

    const errorElement = document.createElement('div');
    errorElement.className = 'payment-error';
    errorElement.innerHTML = `
      <div style="
        padding: 15px;
        background: #ffebee;
        color: #c62828;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        margin-bottom: 10px;
        display: flex;
        align-items: center;
      ">
        <span style="margin-right: 10px;">⚠️</span>
        <span>${message}</span>
      </div>
    `;

    errorContainer.appendChild(errorElement);

    setTimeout(() => {
      errorElement.style.opacity = '0';
      setTimeout(() => errorElement.remove(), 300);
    }, duration);
  }

  showFatalError(message) {
    const fatalError = document.createElement('div');
    fatalError.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #d32f2f;
      color: white;
      padding: 15px;
      text-align: center;
      z-index: 9999;
    `;
    fatalError.textContent = message;
    document.body.prepend(fatalError);
  }
}

/* ========== INICIALIZAÇÃO AUTOMÁTICA ========== */

function initializePaymentSystem() {
  // Configuração via atributos data-*
  const paymentElement = document.getElementById('payment-system-config');
  const options = paymentElement ? paymentElement.dataset : {};

  try {
    new PaymentSystem(options);
  } catch (error) {
    console.error('Falha ao inicializar sistema de pagamento:', error);
    
    const errorContainer = document.createElement('div');
    errorContainer.style.cssText = `
      padding: 20px;
      background: #ffebee;
      color: #c62828;
      border-radius: 4px;
      margin: 20px;
      text-align: center;
    `;
    errorContainer.textContent = 'Sistema de pagamento indisponível no momento. Por favor, tente novamente mais tarde.';
    
    const container = document.querySelector('.payment-container') || document.body;
    container.appendChild(errorContainer);
  }
}

// Carrega quando o DOM estiver pronto
if (document.readyState !== 'loading') {
  initializePaymentSystem();
} else {
  document.addEventListener('DOMContentLoaded', initializePaymentSystem);
}

// Carrega o Stripe.js dinamicamente se necessário
if (typeof Stripe === 'undefined') {
  const script = document.createElement('script');
  script.src = 'https://js.stripe.com/v3/';
  script.async = true;
  script.onload = initializePaymentSystem;
  document.head.appendChild(script);
}
