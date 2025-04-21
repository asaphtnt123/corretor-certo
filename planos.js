/**
 * Sistema de Pagamento para Planos - Corretor Certo
 * Implementação usando Stripe como gateway de pagamento
 */

class PaymentSystem {
  constructor() {
    // Configuração inicial
    this.stripe = Stripe('SUA_CHAVE_PUBLICA_STRIPE'); // Substitua pela sua chave pública
    this.planos = {
      basico: {
        id: 'basico',
        nome: 'Plano Básico',
        preco: 2990
      },
      profissional: {
        id: 'profissional',
        nome: 'Plano Profissional',
        preco: 5990
      },
      premium: {
        id: 'premium',
        nome: 'Plano Premium',
        preco: 9990
      }
    };
    
    this.initEventListeners();
  }

  /**
   * Inicializa os event listeners para os botões de assinatura
   */
  initEventListeners() {
    document.querySelectorAll('.btn-assinar').forEach(button => {
      button.addEventListener('click', (e) => {
        const planoId = e.target.getAttribute('data-plano');
        this.handlePayment(planoId);
      });
    });
  }

  /**
   * Manipula o processo de pagamento
   * @param {string} planoId - ID do plano selecionado
   */
  async handlePayment(planoId) {
    try {
      // Mostrar loader (opcional)
      this.showLoading(true);
      
      const plano = this.planos[planoId];
      if (!plano) throw new Error('Plano não encontrado');

      // Criar sessão de pagamento
      const session = await this.createPaymentSession(plano);
      
      // Redirecionar para checkout da Stripe
      const result = await this.stripe.redirectToCheckout({
        sessionId: session.id
      });

      if (result.error) {
        this.showError(result.error.message);
      }
    } catch (error) {
      console.error('Erro no pagamento:', error);
      this.showError('Ocorreu um erro ao processar seu pagamento.');
    } finally {
      this.showLoading(false);
    }
  }

  /**
   * Cria uma sessão de pagamento no backend
   * @param {object} plano - Dados do plano selecionado
   * @returns {Promise<object>} - Dados da sessão de pagamento
   */
  async createPaymentSession(plano) {
    const response = await fetch('/criar-sessao-pagamento', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planoId: plano.id,
        planoNome: plano.nome,
        preco: plano.preco,
        moeda: 'BRL'
      }),
    });

    if (!response.ok) {
      throw new Error('Falha ao criar sessão de pagamento');
    }

    return await response.json();
  }

  /**
   * Exibe um estado de carregamento
   * @param {boolean} show - Mostrar ou esconder o loader
   */
  showLoading(show) {
    const loaders = document.querySelectorAll('.btn-assinar');
    loaders.forEach(button => {
      if (show) {
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
        button.disabled = true;
      } else {
        const planoId = button.getAttribute('data-plano');
        button.textContent = 'Assinar agora';
        button.disabled = false;
      }
    });
  }

  /**
   * Exibe uma mensagem de erro
   * @param {string} message - Mensagem de erro
   */
  showError(message) {
    // Você pode implementar um modal de erro ou usar alertas
    alert(message);
    
    // Exemplo com SweetAlert2:
    // Swal.fire('Erro', message, 'error');
  }
}

// Inicializa o sistema de pagamento quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  // Verifica se a Stripe está disponível
  if (typeof Stripe === 'undefined') {
    console.error('Stripe.js não carregado corretamente');
    return;
  }

  // Inicializa o sistema de pagamento
  new PaymentSystem();
});
