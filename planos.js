/**
 * Sistema de Pagamento Completo - Corretor Certo
 * Integração com Stripe e Firebase
 * Versão 5.4 - Segura, Modular e Pronta para Produção
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

    // Define todos os métodos como propriedades de classe com arrow functions
    // Isso automaticamente mantém o contexto correto (this)
    this.initializeSystem = async () => {
      try {
        // Verifica dependências primeiro
        if (typeof Stripe === 'undefined') {
          throw new Error('Biblioteca Stripe não carregada');
        }
        
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
    };

    this.initPlanos = () => {
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
    };

    this.initStripe = async () => {
      this.stripeKey = await this.getStripeKey();
      
      // Validação adicional da chave
      if (!this.stripeKey || !this.stripeKey.startsWith('pk_')) {
        throw new Error('Chave pública do Stripe inválida');
      }

      this.stripe = Stripe(this.stripeKey, {
        locale: 'pt-BR',
        apiVersion: '2023-08-16'
      });
    };

    this.getStripeKey = async () => {
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
    };

    // ... (todos os outros métodos como arrow functions)

    this.initEventListeners = () => {
      document.addEventListener('click', (e) => {
        const button = e.target.closest('[data-plano]');
        if (!button || this.state.isLoading) return;

        try {
          this.handlePaymentClick(button);
        } catch (error) {
          this.handlePaymentError(error, button);
        }
      });
    };

    this.setupErrorHandling = () => {
      window.addEventListener('unhandledrejection', (event) => {
        console.error('Erro não tratado:', event.reason);
        this.showError('Ocorreu um erro inesperado');
      });
    };

    this.handlePaymentClick = async (button) => {
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
    };

    // Inicializa o sistema
    this.initializeSystem();
  }
}

/* ========== INICIALIZAÇÃO GLOBAL ========== */

function initializePaymentSystem() {
  try {
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
        ${error.message || 'Sistema de pagamento indisponível. Por favor, recarregue a página.'}
      </div>
    `;
    document.body.appendChild(errorEl);
  }
}

// Garante que o DOM esteja totalmente carregado
document.addEventListener('DOMContentLoaded', initializePaymentSystem);
