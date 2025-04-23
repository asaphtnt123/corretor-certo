document.querySelectorAll('.btn-assinar').forEach(btn => {
  btn.addEventListener('click', async () => {
    const plano = btn.getAttribute('data-plano');
    btn.classList.add('loading');

    try {
      const response = await fetch('/.netlify/functions/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ plano })
      });

      const data = await response.json();
      console.log("Sessão Stripe:", data);

      const stripe = Stripe('pk_live_xxx'); // sua chave pública

      if (data.id) {
        stripe.redirectToCheckout({ sessionId: data.id });
      } else {
        alert("Erro ao criar sessão de pagamento. Veja o console.");
        console.error(data);
      }
    } catch (error) {
      alert("Falha na conexão com servidor.");
      console.error("Erro no checkout:", error);
    }

    btn.classList.remove('loading');
  });
});
