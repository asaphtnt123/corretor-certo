document.querySelectorAll('.btn-assinar').forEach(btn => {
  btn.addEventListener('click', async () => {
    const plano = btn.getAttribute('data-plano');  // Obtém o plano do atributo 'data-plano'
    btn.classList.add('loading');  // Adiciona uma classe de carregamento ao botão

    try {
      // Chama o endpoint da função do Netlify para criar a sessão de checkout
      const response = await fetch('/.netlify/functions/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ plano })  // Passa o plano como corpo da requisição
      });

      const data = await response.json();
      console.log("Sessão Stripe:", data);

      const stripe = Stripe('pk_live_xxx'); // Sua chave pública do Stripe

      if (data.id) {
        // Redireciona o usuário para o Stripe Checkout
        const { error } = await stripe.redirectToCheckout({ sessionId: data.id });
        if (error) {
          console.error("Erro ao redirecionar para o checkout:", error);
          alert("Ocorreu um erro ao iniciar o pagamento. Tente novamente.");
        }
      } else {
        alert("Erro ao criar sessão de pagamento. Veja o console.");
        console.error(data);
      }
    } catch (error) {
      alert("Falha na conexão com servidor.");
      console.error("Erro no checkout:", error);
    }

    btn.classList.remove('loading');  // Remove a classe de carregamento ao final
  });
});
