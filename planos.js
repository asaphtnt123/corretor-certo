/**
 * Sistema de Pagamento para Planos - Corretor Certo
 * Versão para arquivo na raiz
 */

class PaymentSystem {
  constructor() {
    // Verifica se o Stripe.js está carregado
    if (typeof Stripe === 'undefined') {
      console.error('Stripe.js não carregado!');
      return;
    }

    // Inicializa o Stripe com sua chave pública
    this.stripe = Stripe('pk_live_51RGQ2oCaTJrTX5Tupk7zHAmRzxDgX9RtmxlFRwGNlyHudrhMjPVu0yx871bch1PpXkfUnOQN0UXB1mXzhwSMrDrG00ix8LTK9b');
    
    // Definição dos planos
    this.planos = {
      basico: {
        id: 'basico',
        nome: 'Plano Básico',
        preco: 1090
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
    
    // Inicia os listeners
    this.initEventListeners();
  }

  /**
   * Inicializa os event listeners
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
   * Processa o pagamento
   */
  async handlePayment(planoId) {
    try {
      this.showLoading(true);
      
      const plano = this.planos[planoId];
      if (!plano) throw new Error('Plano não encontrado');

      // Chamada para a Netlify Function
      const { sessionId, url } = await this.createPaymentSession(plano);
      
      // Redireciona para o checkout
      const result = await this.stripe.redirectToCheckout({
        sessionId: sessionId
      });

      if (result.error) {
        this.showError(result.error.message);
      }
    } catch (error) {
      console.error('Erro:', error);
      this.showError(error.message || 'Erro ao processar pagamento');
    } finally {
      this.showLoading(false);
    }
  }

  /**
   * Cria a sessão de pagamento via Netlify Function
   */
async createPaymentSession(plano) {
  try {
    this.showLoading(true);
    
    const email = prompt("Informe seu e-mail para continuar com o pagamento:");
    if (!email) {
      this.showError("E-mail é obrigatório para continuar");
      this.showLoading(false);
      return;
    }

    // Armazena o plano no localStorage como fallback
    localStorage.setItem('planoSelecionado', plano.id);
    
    const response = await fetch('/.netlify/functions/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        planoId: plano.id,
        email: email
      })
    });

    // Verifica se a resposta é OK (status 200-299)
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro no servidor');
    }

    const data = await response.json();
    
    // Verifica se os dados necessários existem
    if (!data.sessionId || !data.url) {
      throw new Error('Resposta inválida do servidor');
    }

    // Redireciona para o checkout do Stripe
    const result = await this.stripe.redirectToCheckout({
      sessionId: data.sessionId
    });

    // Se houver erro no redirecionamento
    if (result.error) {
      throw new Error(result.error.message);
    }

  } catch (error) {
    console.error('Erro no processamento:', error);
    this.showError(error.message || 'Erro ao processar pagamento');
    
    // Mostra detalhes adicionais em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.debug('Detalhes do erro:', error);
    }
  } finally {
    this.showLoading(false);
  }
}

  /**
   * Mostra estado de carregamento
   */
  showLoading(show) {
    document.querySelectorAll('.btn-assinar').forEach(btn => {
      btn.disabled = show;
      btn.innerHTML = show 
        ? '<i class="fas fa-spinner fa-spin"></i> Processando...' 
        : 'Assinar agora';
    });
  }

  /**
   * Mostra erros
   */
  showError(message) {
    // Modifique para usar seu sistema de alertas preferido
    alert(`Erro: ${message}`);
  }
}

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  // Carrega o Stripe.js dinamicamente se não estiver presente
  if (typeof Stripe === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.onload = () => new PaymentSystem();
    document.head.appendChild(script);
  } else {
    new PaymentSystem();
  }
});
