document.querySelectorAll('.btn-assinar').forEach(btn => {
  btn.addEventListener('click', async () => {
    const plano = btn.getAttribute('data-plano');
    btn.classList.add('loading');

    const response = await fetch('/.netlify/functions/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plano })
    });

    const data = await response.json();
    const stripe = Stripe('pk_live_51RGQ2oCaTJrTX5Tupk7zHAmRzxDgX9RtmxlFRwGNlyHudrhMjPVu0yx871bch1PpXkfUnOQN0UXB1mXzhwSMrDrG00ix8LTK9b'); // Substitua pela sua chave pública Stripe

    stripe.redirectToCheckout({ sessionId: data.id });
  });
});
