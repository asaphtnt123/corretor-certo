class PaymentSystem {
  constructor(options = {}) {
    this.config = {
      apiEndpoint: options.apiEndpoint || '/.netlify/functions/create-checkout-session',
      authRequired: options.authRequired !== false,
      defaultCurrency: 'BRL',
      loadingText: '<span class="spinner"></span> Processando...',
      maxRetryAttempts: 3,
      retryDelay: 1000
    };

    this.state = {
      isLoading: false,
      currentPlanoId: null,
      currentRequest: null
    };

    this.initializeSystem();
  }

  initializeSystem = async () => {
    try {
      this.checkDependencies();
      this.initPlanos();
      await this.initStripe();
      this.initEventListeners();
      console.log('Sistema de pagamento inicializado');
    } catch (error) {
      console.error('Falha na inicialização:', error);
      this.showFatalError('Sistema temporariamente indisponível');
    }
  };

  checkDependencies = () => {
    if (typeof Stripe === 'undefined') {
      throw new Error('Biblioteca Stripe não carregada');
    }
  };

  initPlanos = () => {
    this.planos = {
      basico: {
        id: 'basico',
        nome: 'Plano Básico',
        preco: 'R$ 29,90',
        ciclo: 'mensal'
      },
      profissional: {
        id: 'profissional',
        nome: 'Plano Profissional',
        preco: 'R$ 59,90',
        ciclo: 'mensal'
      },
      premium: {
        id: 'premium',
        nome: 'Plano Premium',
        preco: 'R$ 99,90',
        ciclo: 'anual'
      }
    };
  };

  initStripe = async () => {
    this.stripeKey = 'pk_live_51RGQ2oCaTJrTX5Tupk7zHAmRzxDgX9RtmxlFRwGNlyHudrhMjPVu0yx871bch1PpXkfUnOQN0UXB1mXzhwSMrDrG00ix8LTK9b';
    this.stripe = Stripe(this.stripeKey, { locale: 'pt-BR' });
  };

  initEventListeners = () => {
    document.addEventListener('click', (e) => {
      const button = e.target.closest('[data-plano]');
      if (button && !this.state.isLoading) {
        this.handlePaymentClick(button).catch(error => {
          console.error('Erro no clique:', error);
          this.showError('Erro ao processar pagamento');
        });
      }
    });
  };

  handlePaymentClick = async (button) => {
    this.setState({ isLoading: true, currentPlanoId: button.dataset.plano });
    
    try {
      const userId = this.config.authRequired ? await this.getCurrentUserId() : 'guest';
      await this.processPayment(button.dataset.plano, userId);
    } catch (error) {
      this.handlePaymentError(error, button);
    } finally {
      this.setState({ isLoading: false });
    }
  };

  processPayment = async (planoId, userId) => {
    const session = await this.createPaymentSession({
      planoId,
      userId,
      userEmail: await this.getUserEmail()
    });

    const result = await this.stripe.redirectToCheckout({
      sessionId: session.sessionId
    });

    if (result.error) throw result.error;
  };

  createPaymentSession = async (paymentData) => {
    try {
      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar sessão');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro na criação da sessão:', error);
      throw error;
    }
  };

  getCurrentUserId = async () => {
    return localStorage.getItem('userId') || 'guest';
  };

  getUserEmail = async () => {
    return localStorage.getItem('userEmail') || '';
  };

  handlePaymentError = (error, button) => {
    console.error('Erro no pagamento:', error);
    this.showError(error.message || 'Erro ao processar pagamento');
    if (button) button.disabled = false;
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
    errorEl.innerHTML = `<div class="error-message">⚠️ ${message}</div>`;
    document.body.appendChild(errorEl);
    setTimeout(() => errorEl.remove(), duration);
  };

  showFatalError = (message) => {
    const errorEl = document.createElement('div');
    errorEl.className = 'fatal-error';
    errorEl.innerHTML = `<div>${message}</div>`;
    document.body.prepend(errorEl);
  };
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  new PaymentSystem();
});
