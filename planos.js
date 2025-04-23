// 📁 public/planos.js (coloque esse arquivo junto com os HTML)
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
    const stripe = Stripe('pk_test_xxx'); // Substitua pela sua chave pública Stripe

    stripe.redirectToCheckout({ sessionId: data.id });
  });
});
