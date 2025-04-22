/**
 * Sistema de Pagamento Completo - Corretor Certo
 * Integração com Stripe e Firebase
 * Versão 5.0 - Segura, Modular e Pronta para Produção
 */

class PaymentSystem {
  constructor(options = {}) {
    // Configurações padrão
    this.config = {
      apiEndpoint: options.apiEndpoint || '/.netlify/functions/create-checkout-session',
      authRequired: options.authRequired !== false,
      defaultCurrency: 'BRL',
      loadingText: '<span class="spinner"></span> Processando...'
    };

    // Estados
    this.state = {
      isLoading: false,
      currentPlanoId: null,
      currentRequest: null
    };

    try {
      // Inicializações seguras
      this.initStripe();
      this.initPlanos();
      this.initEventListeners();
      this.setupErrorHandling();
      
      console.log('Sistema de pagamento inicializado com sucesso');
    } catch (error) {
      console.error('Falha na inicialização do PaymentSystem:', error);
      this.showFatalError('Sistema de pagamento temporariamente indisponível');
    }
  }

  /* ========== INICIALIZAÇÃO ========== */

  initStripe() {
    if (typeof Stripe === 'undefined') {
      throw new Error('Biblioteca Stripe não carregada');
    }

    this.stripeKey = this.getStripeKey();
    
    if (!this.stripeKey) {
      throw new Error('Configuração de pagamento incompleta');
    }

    this.stripe = Stripe(this.stripeKey, {
      locale: 'pt-BR',
      apiVersion: '2023-08-16'
    });
  }

 getStripeKey() {
  // 1. Prioridade: Variável de ambiente no Netlify
   if (process.env.STRIPE_PUBLIC_KEY) {
      return process.env.STRIPE_PUBLIC_KEY;
    }
  
  // 2. Fallback: Atributo data-* no HTML (apenas para desenvolvimento)
  const stripeConfig = document.getElementById('payment-config');
  if (stripeConfig?.dataset.publishableKey) {
    console.warn('Usando chave do HTML - apenas para desenvolvimento');
    return stripeConfig.dataset.publishableKey;
  }
  
  // 3. Erro em produção
  throw new Error('Chave pública do Stripe não configurada. Verifique as variáveis de ambiente no Netlify.');
}

  initPlanos() {
    this.planos = {
      basico: {
        id: 'basico',
        nome: 'Plano Básico',
        preco: 2990,
        moeda: this.config.defaultCurrency,
        features: ['Acesso básico', 'Suporte por email', 'Relatórios simples'],
        ciclo: 'mensal',
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
        features: ['Acesso completo', 'Suporte prioritário', 'Relatórios avançados'],
        ciclo: 'mensal',
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
        features: ['Acesso completo', 'Suporte 24/7', 'Consultoria personalizada'],
        ciclo: 'anual',
        metadata: {
          tipo: 'assinatura',
          nivel: 'premium'
        }
      }
    };
  }

  initEventListeners() {
    document.addEventListener('click', (e) => {
      const button = e.target.closest('[data-plano]');
      if (!button || this.state.isLoading) return;

      try {
        this.handlePaymentClick(button);
      } catch (error) {
        this.handlePaymentError(error, button);
      }
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
    const planoId = button.dataset.plano;
    this.setState({ isLoading: true, currentPlanoId: planoId });

    try {
      const userId = this.config.authRequired ? await this.getCurrentUserId() : null;
      
      if (this.config.authRequired && !userId) {
        return this.handleUnauthenticated(button);
      }

      await this.processPayment(planoId, userId);
    } catch (error) {
      this.handlePaymentError(error, button);
    } finally {
      this.setState({ isLoading: false });
    }
  }

  async processPayment(planoId, userId) {
    const plano = this.planos[planoId];
    if (!plano) throw new Error('Plano selecionado é inválido');

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
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Erro ao criar sessão de pagamento');
      }

      return await response.json();
    } finally {
      this.setState({ currentRequest: null });
    }
  }

  /* ========== AUTENTICAÇÃO ========== */

  async getCurrentUserId() {
    // Firebase Auth
    if (typeof firebase !== 'undefined' && firebase.auth().currentUser) {
      return firebase.auth().currentUser.uid;
    }
    
    // Implementação genérica
    return localStorage.getItem('userId') || null;
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

  /* ========== UTILITÁRIOS ========== */

  async getUserIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json', { timeout: 2000 });
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

  /* ========== GERENCIAMENTO DE ESTADO ========== */

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.updateUI();
  }

  updateUI() {
    const buttons = document.querySelectorAll('[data-plano]');
    buttons.forEach(btn => {
      const isLoading = this.state.isLoading && btn.dataset.plano === this.state.currentPlanoId;
      
      btn.disabled = this.state.isLoading;
      btn.innerHTML = isLoading 
        ? this.config.loadingText 
        : `Assinar ${this.planos[btn.dataset.plano]?.nome || ''}`;
    });
  }

  /* ========== TRATAMENTO DE ERROS ========== */

  handleUnauthenticated(button) {
    this.showError('Por favor, faça login para continuar');
    button.disabled = false;
    this.setState({ isLoading: false });
  }

  handlePaymentError(error, button) {
    console.error('Erro no pagamento:', {
      error: error.message,
      planoId: button?.dataset?.plano,
      timestamp: new Date().toISOString()
    });

    this.showError(this.getErrorMessage(error));
    
    if (button) {
      button.disabled = false;
      button.innerHTML = `Assinar ${this.planos[button.dataset.plano]?.nome || ''}`;
    }
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
    const errorEl = document.createElement('div');
    errorEl.className = 'payment-error';
    errorEl.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 15px;
        background: #ffebee;
        color: #c62828;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 1000;
        animation: fadeIn 0.3s ease;
      ">
        <span>⚠️ ${message}</span>
      </div>
    `;

    document.body.appendChild(errorEl);
    setTimeout(() => errorEl.remove(), duration);
  }

  showFatalError(message = 'Sistema de pagamento temporariamente indisponível') {
    const errorEl = document.createElement('div');
    errorEl.className = 'payment-fatal-error';
    errorEl.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        padding: 15px;
        background: #d32f2f;
        color: white;
        text-align: center;
        z-index: 9999;
      ">
        ${message}
      </div>
    `;

    document.body.prepend(errorEl);
    document.querySelectorAll('[data-plano]').forEach(btn => btn.disabled = true);
  }
}

/* ========== INICIALIZAÇÃO ========== */

function initializePaymentSystem() {
  try {
    const configElement = document.getElementById('payment-config');
    const options = {
      apiEndpoint: configElement?.dataset.apiEndpoint
    };

    new PaymentSystem(options);
  } catch (error) {
    console.error('Falha na inicialização:', error);
    
    const errorEl = document.createElement('div');
    errorEl.textContent = 'Sistema de pagamento indisponível. Por favor, tente novamente mais tarde.';
    errorEl.style.cssText = `
      padding: 20px;
      background: #ffebee;
      color: #c62828;
      text-align: center;
      margin: 20px;
      border-radius: 4px;
    `;
    
    (document.querySelector('.planos-container') || document.body).appendChild(errorEl);
  }
}

// Inicialização segura
if (document.readyState === 'complete') {
  initializePaymentSystem();
} else {
  document.addEventListener('DOMContentLoaded', initializePaymentSystem);
}
