/**
 * Sistema de Pagamento Completo - Corretor Certo
 * Integração com Stripe e Firebase
 * Versão 5.1 - Segura, Modular e Pronta para Produção
 */

class PaymentSystem {
  constructor(options = {}) {
    // Configurações padrão com validação
    this.config = this.validateConfig({
      apiEndpoint: options.apiEndpoint || '/.netlify/functions/create-checkout-session',
      authRequired: options.authRequired !== false,
      defaultCurrency: 'BRL',
      loadingText: '<span class="spinner"></span> Processando...',
      maxRetryAttempts: 3,
      retryDelay: 1000
    });

    // Estados
    this.state = {
      isLoading: false,
      currentPlanoId: null,
      currentRequest: null,
      retryCount: 0
    };

    this.initializeSystem();
  }

  /* ========== INICIALIZAÇÃO ========== */

  validateConfig(config) {
    if (!config.apiEndpoint) {
      throw new Error('Endpoint da API não configurado');
    }
    
    if (typeof config.authRequired !== 'boolean') {
      config.authRequired = true;
    }
    
    return config;
  }

  async initializeSystem() {
    try {
      // Verifica dependências antes de iniciar
      await this.checkDependencies();
      
      // Inicializações seguras
      await this.initStripe();
      this.initPlanos();
      this.initEventListeners();
      this.setupErrorHandling();
      
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
      // Tentativa de obter a chave via endpoint
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
      
      // Fallback seguro com verificação
      const fallbackKey = 'pk_live_51RGQ2oCaTJrTX5Tupk7zHAmRzxDgX9RtmxlFRwGNlyHudrhMjPVu0yx871bch1PpXkfUnOQN0UXB1mXzhwSMrDrG00ix8LTK9b';
      
      if (!fallbackKey.startsWith('pk_')) {
        throw new Error('Chave de fallback inválida');
      }
      
      return fallbackKey;
    }
  }

  /* ... (restante do código permanece igual) ... */

  /* ========== TRATAMENTO DE ERROS MELHORADO ========== */

  handlePaymentError(error, button) {
    console.error('Erro no pagamento:', {
      error: error.message,
      code: error.code,
      planoId: button?.dataset?.plano,
      timestamp: new Date().toISOString(),
      stack: error.stack
    });

    // Tentativa de recuperação para erros de rede
    if (this.isNetworkError(error) && this.state.retryCount < this.config.maxRetryAttempts) {
      this.state.retryCount++;
      setTimeout(() => {
        this.handlePaymentClick(button);
      }, this.config.retryDelay);
      return;
    }

    this.showError(this.getErrorMessage(error));
    
    if (button) {
      button.disabled = false;
      button.innerHTML = `Assinar ${this.planos[button.dataset.plano]?.nome || ''}`;
    }
    
    // Reset do contador de tentativas
    this.state.retryCount = 0;
  }

  isNetworkError(error) {
    return (
      error.message.includes('Failed to fetch') || 
      error.message.includes('NetworkError') ||
      error.message.includes('Timeout')
    );
  }

  /* ... (restante do código permanece igual) ... */
}

// Inicialização com verificação de ambiente
function initializePaymentSystem() {
  try {
    // Verifica se estamos em um ambiente seguro (HTTPS)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      throw new Error('O sistema de pagamento requer HTTPS');
    }

    const configElement = document.getElementById('payment-config');
    const options = {
      apiEndpoint: configElement?.dataset.apiEndpoint
    };

    new PaymentSystem(options);
  } catch (error) {
    console.error('Falha na inicialização:', error);
    showInitializationError(error.message);
  }
}

function showInitializationError(message) {
  const errorEl = document.createElement('div');
  errorEl.className = 'payment-init-error';
  errorEl.innerHTML = `
    <div style="
      padding: 20px;
      background: #fff3e0;
      color: #e65100;
      border: 1px solid #ffcc80;
      border-radius: 4px;
      margin: 20px auto;
      max-width: 600px;
      text-align: center;
    ">
      <h3 style="margin-top: 0;">⚠️ Erro no sistema de pagamento</h3>
      <p>${message || 'Por favor, tente novamente mais tarde.'}</p>
      ${window.location.protocol !== 'https:' ? 
        '<p>Este site requer conexão segura (HTTPS) para processar pagamentos.</p>' : ''}
    </div>
  `;
  
  (document.querySelector('.planos-container') || document.body).appendChild(errorEl);
}

// Inicialização segura com fallback
if (document.readyState === 'complete') {
  initializePaymentSystem();
} else {
  document.addEventListener('DOMContentLoaded', initializePaymentSystem);
}
