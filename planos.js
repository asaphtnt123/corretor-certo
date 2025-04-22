/**
 * Sistema de Pagamento Completo - Corretor Certo
 * Integração com Stripe e Firebase
 * Versão 5.2 - Segura, Modular e Pronta para Produção
 */

class PaymentSystem {
  constructor(options = {}) {
    // Garante o contexto correto para callbacks
    this.handlePaymentClick = this.handlePaymentClick.bind(this);
    this.handlePaymentError = this.handlePaymentError.bind(this);
    this.initializeSystem = this.initializeSystem.bind(this);
    this.showError = this.showError.bind(this);
    this.showFatalError = this.showFatalError.bind(this);

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

  /* ========== MÉTODOS DE INICIALIZAÇÃO ========== */

  async initializeSystem() {
    try {
      // Verifica dependências primeiro
      await this.checkDependencies();
      
      // Inicializações síncronas
      this.initPlanos();
      this.setupErrorHandling();
      
      // Inicializações assíncronas
      await this.initStripe();
      this.initEventListeners();
      
      console.log('Sistema de pagamento inicializado com sucesso');
    } catch (error) {
      console.error('Falha na inicialização do PaymentSystem:', error);
      this.showFatalError('Sistema de pagamento temporariamente indisponível');
    }
  }

  async checkDependencies() {
    const dependencies = {
      Stripe: typeof Stripe !== 'undefined',
      fetch: typeof fetch !== 'undefined'
    };

    const missingDeps = Object.entries(dependencies)
      .filter(([, loaded]) => !loaded)
      .map(([name]) => name);

    if (missingDeps.length > 0) {
      throw new Error(`Dependências ausentes: ${missingDeps.join(', ')}`);
    }
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

  async initStripe() {
    this.stripeKey = await this.getStripeKey();
    
    // Validação adicional da chave
    if (!this.stripeKey || !this.stripeKey.startsWith('pk_')) {
      throw new Error('Chave pública do Stripe inválida');
    }

    this.stripe = Stripe(this.stripeKey, {
      locale: 'pt-BR',
      apiVersion: '2023-08-16'
    });
  }

  async getStripeKey() {
    try {
      const response = await fetch('/.netlify/functions/getStripeKey');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.key) {
        throw new Error('Resposta inválida do servidor');
      }
      
      return data.key;
    } catch (error) {
      console.error('Falha ao obter chave:', error);
      // Fallback seguro
      return 'pk_live_51RGQ2oCaTJrTX5Tupk7zHAmRzxDgX9RtmxlFRwGNlyHudrhMjPVu0yx871bch1PpXkfUnOQN0UXB1mXzhwSMrDrG00ix8LTK9b';
    }
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

  /* ========== MÉTODOS AUXILIARES ========== */

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

/* ========== INICIALIZAÇÃO GLOBAL ========== */

function initializePaymentSystem() {
  try {
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      throw new Error('O sistema de pagamento requer HTTPS');
    }

    const configElement = document.getElementById('payment-config');
    new PaymentSystem({
      apiEndpoint: configElement?.dataset.apiEndpoint
    });
  } catch (error) {
    console.error('Falha na inicialização:', error);
    
    const errorEl = document.createElement('div');
    errorEl.innerHTML = `
      <div style="
        padding: 20px;
        background: #ffebee;
        color: #c62828;
        text-align: center;
        margin: 20px;
        border-radius: 4px;
      ">
        ${error.message || 'Sistema de pagamento indisponível'}
      </div>
    `;
    document.body.appendChild(errorEl);
  }
}

// Inicialização segura
if (document.readyState === 'complete') {
  initializePaymentSystem();
} else {
  document.addEventListener('DOMContentLoaded', initializePaymentSystem);
}
