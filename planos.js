/**
 * Sistema de Pagamento para Planos - Corretor Certo
 * Versão 3.0 - Segura, Modular e Pronta para Produção
 */
class PaymentSystem {
  constructor() {
    // Configurações centralizadas
    this.config = {
      apiEndpoint: '/.netlify/functions/create-checkout-session',
      loadingText: '<span class="spinner"></span> Processando...'
    };

    // Inicializações seguras
    try {
      this.initStripe();
      this.initPlanos();
      this.initEventListeners();
    } catch (error) {
      console.error('Falha na inicialização:', error);
      this.showError('Sistema de pagamento indisponível');
    }
  }

  /**
   * Inicialização segura do Stripe.js
   */
  initStripe() {
    if (typeof Stripe === 'undefined') {
      throw new Error('Biblioteca Stripe não carregada');
    }

    // Carrega a chave pública de forma segura
    const stripeKey = this.getStripeKey();
    if (!stripeKey) {
      throw new Error('Configuração de pagamento incompleta');
    }

    this.stripe = Stripe(stripeKey, {
      betas: ['process_order_beta_3']
    });
  }

  /**
   * Obtém a chave do Stripe de forma segura
   */
  getStripeKey() {
    // 1. Tenta obter da variável de ambiente (build-time)
    if (typeof process !== 'undefined' && process.env.STRIPE_PUBLISHABLE_KEY) {
      return process.env.STRIPE_PUBLISHABLE_KEY;
    }
    
    // 2. Tenta obter de um atributo data-* no HTML
    const stripeElement = document.getElementById('stripe-config');
    if (stripeElement?.dataset.publishableKey) {
      return stripeElement.dataset.publishableKey;
    }
    
    // 3. Fallback para desenvolvimento
    if (window.location.hostname === 'localhost') {
      return 'pk_test_51RGQ31Ctf0sheJfc7YQ32qSzBdzRIsyLRAzBqf3lEgd5F4Ej5RJr3Kp0ZsgkVVUQxouU9vF4jzC2Okp5bmbG3Ic40042yaPE84';
    }

    return null;
  }

  /**
   * Definição dinâmica dos planos
   */
  initPlanos() {
    this.planos = {
      basico: {
        id: 'basico',
        nome: 'Plano Básico',
        preco: 2990,
        moeda: 'BRL',
        features: ['Acesso básico', 'Suporte por email'],
        ciclo: 'mensal',
        metadata: {
          tipo: 'assinatura'
        }
      },
      profissional: {
        id: 'profissional',
        nome: 'Plano Profissional',
        preco: 5990,
        moeda: 'BRL',
        features: ['Acesso completo', 'Suporte prioritário'],
        ciclo: 'mensal',
        metadata: {
          tipo: 'assinatura'
        }
      },
      premium: {
        id: 'premium',
        nome: 'Plano Premium',
        preco: 9990,
        moeda: 'BRL',
        features: ['Acesso completo', 'Suporte 24/7', 'Consultoria'],
        ciclo: 'anual',
        metadata: {
          tipo: 'assinatura'
        }
      }
    };
  }

  /**
   * Configuração de event listeners com delegção
   */
  initEventListeners() {
    document.body.addEventListener('click', async (e) => {
      const button = e.target.closest('[data-plano]');
      if (!button) return;

      try {
        e.preventDefault();
        
        const planoId = button.dataset.plano;
        const userId = await this.getCurrentUserId();
        
        if (!userId) {
          this.showAuthError();
          return this.redirectToLogin();
        }

        await this.handlePayment(planoId, userId);
      } catch (error) {
        console.error('Erro no evento:', error);
        this.showError('Falha ao iniciar pagamento');
      }
    });
  }

  /**
   * Fluxo principal de pagamento
   */
  async handlePayment(planoId, userId) {
    try {
      this.showLoading(true, planoId);
      
      const plano = this.planos[planoId];
      if (!plano) throw new Error('Plano selecionado é inválido');

      // 1. Cria a sessão no backend
      const session = await this.createPaymentSession({
        planoId,
        userId,
        userEmail: await this.getUserEmail(),
        ip: await this.getUserIP()
      });

      // 2. Redireciona para o checkout
      const result = await this.stripe.redirectToCheckout({
        sessionId: session.id
      });

      if (result.error) {
        throw result.error;
      }
    } catch (error) {
      console.error('Erro no fluxo de pagamento:', {
        error,
        planoId,
        userId
      });
      
      this.showError(this.getFriendlyError(error));
    } finally {
      this.showLoading(false);
    }
  }

  /**
   * Comunicação segura com o backend
   */
  async createPaymentSession(paymentData) {
    const response = await fetch(this.config.apiEndpoint, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await this.getAuthToken()}`
      },
      body: JSON.stringify(paymentData)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Erro na comunicação com o servidor');
    }

    return await response.json();
  }

  /**
   * Métodos auxiliares de UI
   */
  showLoading(show, planoId = null) {
    const buttons = document.querySelectorAll('[data-plano]');
    buttons.forEach(btn => {
      if (!planoId || btn.dataset.plano === planoId) {
        btn.disabled = show;
        btn.innerHTML = show 
          ? this.config.loadingText 
          : `Assinar ${this.planos[btn.dataset.plano]?.nome || ''}`;
      }
    });
  }

  showError(message, duration = 5000) {
    const errorEl = document.getElementById('payment-error') || this.createErrorElement();
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    
    setTimeout(() => {
      errorEl.style.display = 'none';
    }, duration);
  }

  createErrorElement() {
    const el = document.createElement('div');
    el.id = 'payment-error';
    el.style.display = 'none';
    document.body.appendChild(el);
    return el;
  }

  showAuthError() {
    this.showError('Por favor, faça login para assinar um plano');
  }

  redirectToLogin() {
    window.location.href = '/login?returnTo=' + encodeURIComponent(window.location.pathname);
  }

  /**
   * Métodos para implementação específica
   */
  async getCurrentUserId() {
    // Implemente com seu sistema de autenticação
    return localStorage.getItem('userId') || null;
  }

  async getUserEmail() {
    // Implemente para retornar o email do usuário
    return null;
  }

  async getAuthToken() {
    // Implemente para retornar o token JWT
    return null;
  }

  async getUserIP() {
    // Pode ser obtido via API ou headers em algumas implementações
    return null;
  }

  getFriendlyError(error) {
    const defaultMessage = 'Erro ao processar pagamento';
    if (!error) return defaultMessage;
    
    const errorMap = {
      'card_declined': 'Cartão recusado',
      'expired_card': 'Cartão expirado',
      'insufficient_funds': 'Saldo insuficiente'
    };
    
    return errorMap[error.code] || error.message || defaultMessage;
  }
}

// Inicialização segura com fallback
function initializePaymentSystem() {
  try {
    if (typeof Stripe !== 'undefined') {
      return new PaymentSystem();
    }
    
    // Carrega o Stripe.js dinamicamente
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.async = true;
    script.onload = () => new PaymentSystem();
    script.onerror = () => console.error('Falha ao carregar Stripe.js');
    document.head.appendChild(script);
  } catch (error) {
    console.error('Falha na inicialização do sistema de pagamento:', error);
  }
}

// Inicia quando o DOM estiver pronto
if (document.readyState !== 'loading') {
  initializePaymentSystem();
} else {
  document.addEventListener('DOMContentLoaded', initializePaymentSystem);
}
