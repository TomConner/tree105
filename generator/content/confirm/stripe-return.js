document.addEventListener('DOMContentLoaded', async () => {
  // Load the publishable key from the server. The publishable key
  // is set in your .env file.
  const {publishableKey} = await fetch('/api/v1/config').then((r) => r.json());
  if (!publishableKey) {
    addMessage("no publishableKey");
  }

  const stripe = Stripe(publishableKey, {
    apiVersion: '2020-08-27',
  });

  const url = new URL(window.location);
  const clientSecret = url.searchParams.get('payment_intent_client_secret');

  const {error, paymentIntent} = await stripe.retrievePaymentIntent(
    clientSecret
  );
  var height = document.body.scrollHeight;
  window.parent.postMessage({
      'frameHeight': height
  }, 'https://dev.troop105treedrive.com');

  // Helper for displaying status messages.
  const addMessage = (message) => {
    const messagesDiv = document.querySelector('#messages');
    messagesDiv.style.display = 'block';
    const messageWithLinks = addDashboardLinks(message);
    messagesDiv.innerHTML += `> ${messageWithLinks}<br>`;
    console.log(`Debug: ${message}`);
  };

  if (error) {
    addMessage(error.message);
  }
  addMessage(`Payment ${paymentIntent.status}: ${paymentIntent.id}`);

});
