// ------- UI helpers -------

function showAddressMessage(messageText) {
  const messageContainer = document.querySelector("#address-message");

  messageContainer.classList.remove("hidden");
  messageContainer.textContent = messageText;
}

function clearAddressMessage() {
  const messageContainer = document.querySelector("#address-message");
  messageContainer.classList.add("hidden");
  messageContainer.textContent = "";
}

function showPaymentMessage(messageText) {
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

// show payment choices tabset
function loadPaymentChoices() {
  const tabsPaymentMethod = document.getElementById("tabs-payment-method");
  tabsPaymentMethod.classList.remove("hidden");
  tabsPaymentMethod.scrollIntoView();
  publishMessage({m:'frame_scrollIntoView'})

  const tablink_pay_stripe = document.getElementById("tablink-pay-stripe");
  const tablink_pay_venmo = document.getElementById("tablink-pay-venmo");
  const tablink_pay_on_tree = document.getElementById("tablink-pay-on-tree");

  const tabcontent_pay_stripe = document.getElementById("tab-pay-stripe");
  const tabcontent_pay_venmo = document.getElementById("tab-pay-venmo");
  const tabcontent_pay_on_tree = document.getElementById("tab-pay-on-tree");

  const buttonLoadStripe = document.getElementById("button-load-stripe");

  buttonPayVenmo = document.getElementById("button-pay-venmo");
  buttonPayOnTree = document.getElementById("button-pay-on-tree");

  tablink_pay_stripe.addEventListener("click", (event) => {
    event.preventDefault();
    tablink_pay_stripe.classList.add("active"); // activate
    tablink_pay_venmo.classList.remove("active");
    tablink_pay_on_tree.classList.remove("active");

    tabcontent_pay_stripe.classList.remove("hidden"); // show
    tabcontent_pay_venmo.classList.add("hidden");
    tabcontent_pay_on_tree.classList.add("hidden");
  });

  tablink_pay_venmo.addEventListener("click", (event) => {
    event.preventDefault();
    tablink_pay_stripe.classList.remove("active");
    tablink_pay_venmo.classList.add("active"); // activate
    tablink_pay_on_tree.classList.remove("active");

    tabcontent_pay_stripe.classList.add("hidden");
    const stripePayment = document.getElementById('stripe-payment');
    stripePayment.classList.add('hidden');
    tabcontent_pay_venmo.classList.remove("hidden"); // show
    tabcontent_pay_on_tree.classList.add("hidden");
  });

  tablink_pay_on_tree.addEventListener("click", (event) => {
    event.preventDefault();
    tablink_pay_stripe.classList.remove("active");
    tablink_pay_venmo.classList.remove("active");
    tablink_pay_on_tree.classList.add("active"); // activate

    tabcontent_pay_stripe.classList.add("hidden");
    const stripePayment = document.getElementById('stripe-payment');
    stripePayment.classList.add('hidden');
    tabcontent_pay_venmo.classList.add("hidden");
    tabcontent_pay_on_tree.classList.remove("hidden"); // show
  });

  tablink_pay_stripe.click();
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
  console.log(`in frame, lookup_code ${lookup_code}`)
  setLocalItem("lookup", lookup_code)

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
      setLocalItem("email", email);
    }
  })

  // create and mount the address element
  const options = {
    mode: 'shipping',
    autocomplete: {
      mode: 'automatic',
    },
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
    if (event.error) {
      validateAddress(event);
    } else if (event.complete) {
      // Extract potentially complete address
      const address = event.value;
      setLocalItem("address", JSON.stringify(address));
      validateAddress(null);
    }
  });

  function validateAddress(event) {
    const address = JSON.parse(getLocalItem("address"));
    if (event && event.error) {
      showAddressMessage(event.error.message);
    } else if (!(address.address.city.toLowerCase() === "Pembroke".toLowerCase())) {
      showAddressMessage("Sorry, we can only pick up trees from Pembroke.");
      return false;
    } else {
      clearAddressMessage();
      return true;
    }
  }

  // on register button, post address and then hand off to payment choices
  const buttonRegister = document.getElementById('button-register');
  buttonRegister.addEventListener('click', async (e) => {
    e.preventDefault();
    if (!validateAddress(null)) {
      return;
    }
    const address = JSON.parse(getLocalItem("address"));
    const flat_address = address.address;
    flat_address.name = address.name;
    flat_address.phone = address.phone;
    flat_address.email = getLocalItem("email");
    console.debug("posting address");
    console.debug(flat_address);
    const lookup_code = getLocalItem("lookup");

    fetch(`/api/v1/addresses/${lookup_code}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(flat_address),
    }).then((response) => {
      if (response.ok) {
        console.log(response);

        loadPaymentChoices();
      } else {
        console.error(response);
      }
    });
  });

  // on stripe button, hand off to stripe payment
  const buttonLoadStripe = document.getElementById('button-load-stripe');
  buttonLoadStripe.addEventListener('click', async (e) => {
    e.preventDefault();

    // show stripe payment section
    const stripePayment = document.getElementById('stripe-payment');
    stripePayment.classList.remove("hidden");
    stripePayment.scrollIntoView();

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
          return_url: `${window.location.origin}/return?lookup=${lookup_code}`,
          receipt_email: emailAddress,
        }
      });

      if (stripeError) {
        showPaymentMessage(stripeError.message);

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
