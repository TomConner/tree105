say = (message) => {
  console.log('stripe payment: ' + message)
}

document.addEventListener('DOMContentLoaded', async () => {
  // Load the publishable key from the server. The publishable key
  // is set in your .env file.
  const {publishableKey} = await fetch(`/api/v1/config`).then((r) => r.json());
  if (!publishableKey) {
    say('no publishableKey');
  }

  const stripe = Stripe(publishableKey, {
    apiVersion: '2020-08-27',
  });

  // On page load, create a PaymentIntent on the server so that we have its clientSecret to
  // initialize the instance of Elements below. The PaymentIntent settings configure which payment
  // method types to display in the PaymentElement.
  //
  const {
    error: backendError,
    clientSecret
  } = await fetch(`/api/v1/create-payment-intent`).then(r => r.json());
  if (backendError) {
    say(backendError.message);
  }
  say(`client secret returned`);

  // Initialize Stripe Elements with the PaymentIntent's clientSecret
  //
  const loader = 'auto';
  const elements = stripe.elements({ clientSecret, loader });

  // Create and mount the linkAuthentication Element to enable 
  // autofilling customer payment details
  //
  const linkAuthenticationElement = elements.create("linkAuthentication");
  linkAuthenticationElement.mount("#link-authentication-element");
  say(`link mounted`);

  // TODO default email
  // If the customer's email is known when the page is loaded, you can
  // pass the email to the linkAuthenticationElement on mount:
  //
  // linkAuthenticationElement.mount("#link-authentication-element",  {
  //   defaultValues: {
  //     email: 'jenny.rosen@example.com',
  //   }
  // })

  // Obtain the email entered
  //
  // linkAuthenticationElement.on('change', (event) => {
  //   const email = event.value.email;
  //   console.log({ email });
  //   console.log(event);
  //   // TODO save email when committed
  // })

  // Get a reference to the payment form and its sections
  //
  const form = document.getElementById('payment-form');
  const buttonPayNow = document.getElementById('button-pay-now');
  const buttonPayLater = document.getElementById('button-pay-later');
  const sectionPayStripe = document.getElementById('section-pay-stripe');
  const stripeError = document.getElementById('error-message');

  // Create and mount the address element
  //
  const options = { mode: 'billing' };
  const addressElement = elements.create('address', options);
  addressElement.mount('#address-element');
  say(`address mounted`);

  enableButtonsWhenReady = () => {
    // TODO conditional on both email and address
    buttonPayLater.disabled = false;
    buttonPayNow.disabled = false;
  }

  // Buffer address
  addressElement.on('change', (event) => {
    if (event.complete){
      enableButtonsWhenReady();
      // Extract potentially complete address
      const address = event.value.address;
      say(`address ${address}`);

    }
  })

  // Show Stripe payment fields if user so chooses
  //
  const paymentElement = elements.create('payment');
  paymentElement.mount('#payment-element');

  // When the form is submitted...
  let submitted = false;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Disable double submission of the form
    if(submitted) { return; }
    submitted = true;
    buttonPayNow.disabled = true;

    const nameInput = document.querySelector('#name');

    // Confirm the payment given the clientSecret
    // from the payment intent that was just created on
    // the server.
    const {error: stripeError} = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // TODO return page
        return_url: `${window.location.origin}/return.html`, 
      }
    });

    if (stripeError) {
      addMessage(stripeError.message);

      // reenable the form.
      submitted = false;
      buttonPayNow.disabled = false;
      return;
    }
  });
});
