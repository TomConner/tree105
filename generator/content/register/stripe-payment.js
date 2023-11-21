// ------- UI helpers -------

function showMessage(messageText) {
  const messageContainer = document.querySelector("#payment-message");

  messageContainer.classList.remove("hidden");
  messageContainer.textContent = messageText;

  setTimeout(function () {
    messageContainer.classList.add("hidden");
    messageContainer.textContent = "";
  }, 4000);
}

publishMessage = (message) => {
  window.parent.postMessage(message, window.location.origin);
}

// Show a spinner on payment submission
function setLoading(isLoading) {
  if (isLoading) {
    // Disable the button and show a spinner
    document.querySelector("#spinner").classList.remove("hidden");
    document.querySelector("#button-text").classList.add("hidden");
  } else {
    document.querySelector("#spinner").classList.add("hidden");
    document.querySelector("#button-text").classList.remove("hidden");
  }
}

// ------- Page load - async -------
document.addEventListener('DOMContentLoaded', async () => {

  //------------- Address --------------

  // fetch publishable key
  const {publishableKey} = await fetch(`/api/v1/config`).then((r) => r.json());
  if (!publishableKey) {
    console.error('no publishableKey');
  }
  const stripe = Stripe(publishableKey, {
    apiVersion: '2020-08-27',
  });

  // get lookup code from URL
  const params = new URLSearchParams(window.location.search);
  const lookup_code = params.get('q');
  console.log(`lookup_code ${lookup_code}`)

  // create PaymentIntent on server and fetch clientSecret
  const {
    error: backendError,
    clientSecret
  } = await fetch(`/api/v1/create-payment-intent/${lookup_code}`, {
    method: "POST"
  }).then(r => r.json());
  if (backendError) {
    console.log(backendError.message);
  }
  console.log(`client secret returned`);

  // initialize Stripe Elements with the PaymentIntent's clientSecret
  const loader = 'auto';
  const elements = stripe.elements({ clientSecret }); //, loader });

  // create and mount the linkAuthentication Element
  const linkAuthenticationElement = elements.create("linkAuthentication");
  linkAuthenticationElement.mount("#link-authentication-element");
  console.log(`link mounted`);

  // TODO default email
  // If the customer's email is known when the page is loaded, you can
  // pass the email to the linkAuthenticationElement on mount:
  //
  // linkAuthenticationElement.mount("#link-authentication-element",  {
  //   defaultValues: {
  //     email: 'jenny.rosen@example.com',
  //   }
  // })

  // obtain the email entered
  let emailAddress = '';
  linkAuthenticationElement.on('change', (event) => {
    if (event.complete) {
      const email = event.value.email;
      console.log(`email ${email}`);
      console.log(event);
      emailAddress = email;
      //TODO better email storage
    }
  })

  // create and mount the address element
  const options = {
    mode: 'billing',
    //mode: 'shipping',
    fields: {
      phone: 'always',
    },
    validation: {
      phone: {required: 'always'},
    }
  };
  const addressElement = elements.create('address', options);
  addressElement.mount('#address-element');

  // on address input, save address in localStorage
  addressElement.on('change', (event) => {
    if (event.complete){
      enableButtonsWhenReady();
      // Extract potentially complete address
      const address = event.value.address;
      console.log(`addressElement event.value.address ${address}`);
      setLocalItem("address", JSON.stringify(address));
    }
  });

  // on register button, post address and then hand off to payment choices
  const buttonRegister = document.getElementById('button-register');
  buttonRegister.addEventListener('click', async (e) => {
    e.preventDefault();
    const addressJSON = getLocalItem("address");
    console.debug(`posting address ${addressJSON}`);
    fetch(`/api/v1/addresses/${lookup_code}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    }).then((response) => {
      if (response.ok) {
        console.log(response);

        loadPaymentChoices();
      } else {
        console.error(response);
      }
    });
  });

  // show payment choices tabset
  function loadPaymentChoices() {
    //const sectionAddress = document.getElementById('section-address');
    const sectionPaymentChoices = document.getElementById('tabs-payment-method');
    //sectionAddress.classList.add('hidden');
    sectionPaymentChoices.classList.remove('hidden');

    // for all payment option tabs: on tab click, show tabcontent
    const tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].addEventListener("click", (event) => {
        const paymentMethod = event.currentTarget.id;
        var i, tabcontent, tablinks;

        // hide all tabcontent
        tabcontent = document.getElementsByClassName("tabcontent");
        for (i = 0; i < tabcontent.length; i++) {
          tabcontent[i].style.display = "none";
        }

        // deactivate all tablinks
        tablinks = document.getElementsByClassName("tablinks");
        for (i = 0; i < tablinks.length; i++) {
          tablinks[i].className = tablinks[i].className.replace(" active", "");
        }

        // activate clicked tablink and show its tabcontent
        document.getElementById(paymentMethod).style.display = "block";
        event.currentTarget.className += " active";
      });
    }
  }

  // on stripe button, hand off to stripe payment
  const buttonLoadStripe = document.getElementById('button-load-stripe');
  buttonLoadStripe.addEventListener('click', async (e) => {
    e.preventDefault();

    // show stripe payment section
    const stripePayment = document.getElementById('stripe-payment');
    stripePayment.classList.remove('hidden');


    // create and mount payment element
    const paymentElementOptions = {
      layout: "tabs", // TODO change payment option choice?
    };
    const paymentElement = elements.create('payment', paymentElementOptions);
    paymentElement.mount('#payment-element');

    // submit payment
    let submitted = false;
    const paymentForm = document.getElementById('payment-form');
    paymentForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Disable double submission of the form
      if(submitted) { return; }
      submitted = true;
      const buttonPay = document.getElementById('button-pay');
      buttonPay.disabled = true;

      // confirm payment as needed
      const {error: stripeError} = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/confirm`,
          receipt_email: emailAddress,
        }
      });

      if (stripeError) {
        showMessage(stripeError.message);

        // reenable the form.
        submitted = false;
        buttonPay.disabled = false;
        return;
      }
    });
  });

  // localStorage helpers
  function getLocalItem(key) {
    try {
      const item = window.localStorage.getItem(key);
      return item ? item : null;
    } catch (error) {
      console.error(error);
      return null;
    }
  }
  function setLocalItem(key, value) {
    window.localStorage.setItem(key, value);
  }
  function removeLocalItem(key) {
    window.localStorage.removeItem(key);
  }
});
