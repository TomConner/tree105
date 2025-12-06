// ------- UI helpers from stripe-payment.js -------

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

window.addEventListener("load", (event) => {

  const orderForm = document.getElementById("order-form");
  const rnumtrees = document.getElementById("rnumtrees");
  const rextra = document.getElementById("rextra");
  const rcomment = document.getElementById("rcomment");
  const ramount = document.getElementById("amount");

  // establish lookup code, retrieve any order from server, and load orderForm
  async function pageStart() {
    console.debug("pageStart");
    const lookup_code = getLocalItem("lookup");
    if (lookup_code && lookup_code.length === 4 && /^[A-Z]{4}$/.test(lookup_code)) {
      console.info(`lookup code from localStorage is ${lookup_code}; fetching order`);
      try {
        const response = await fetch(`/api/v1/orders/${lookup_code}`);
        if (response.ok) {
          const order = await response.text();
          console.log(`retrieved order ${order}`);
          setLocalItem("order", order);
        }
        loadOrderForm();
      } catch (error) {
        console.error(error);
        removeLocalItem("lookup");
        newLookup();
      }
    } else {
      console.debug("no lookup code in localStorage");
      newLookup();
    }
  }

  // get new unique lookup code from server and load orderForm with defaults
  async function newLookup() {
    console.debug("POSTing to lookups");
    // post to /api/v1/lookups
    await fetch('/api/v1/lookups', {method: "POST"})
      .then((response) => response.text())
      .then((lookup_code) => {
        lookup_code = lookup_code.trim();
        console.log(`new lookup code is ${lookup_code}`);
        setLocalItem("lookup", lookup_code);
        loadOrderForm();
    });
  }

  // restore orderForm from localStorage, wire up events, and display
  function loadOrderForm() {
    console.debug("loadOrderForm");
    let order = null;
    try {
      order = JSON.parse(getLocalItem("order"));
    } catch (error) {
      console.error(error);
    }
    if (order != null) {
      rnumtrees.value = order.numtrees;
      rextra.value = order.extra;
      rcomment.value = order.comment;
    } else {
      rnumtrees.value = 1;
      rextra.value = 0;
      rcomment.value = "";
    }
    onChangeOrderForm();
    rnumtrees.addEventListener("input", onChangeOrderForm);
    rextra.addEventListener("input", onChangeOrderForm);

    lookup_code = getLocalItem("lookup");

    document.getElementById("spinner-register").hidden = true;
    orderForm.hidden = false;
    document.getElementById("logo-image").scrollIntoView();
  }

  // on orderForm input, update amount
  function onChangeOrderForm() {
    const scount = rnumtrees.value;
    const count = scount == "" ? 0 : parseInt(scount);
    const sextra = rextra.value
    const extra = sextra == "" ? 0 : parseInt(sextra);
    console.log(`${count} trees, ${extra} extra`);
    const amount = (count * 15) + extra;
    ramount.value = amount;
  }

  // on Continue button: POST order, then hand off to Stripe logic
  orderForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const order = JSON.stringify({
      numtrees: rnumtrees.value,
      extra: rextra.value,
      comment: rcomment.value
    })
    if (!localStorage.getItem("lookup")) {
      console.log("new lookup before posting order")
      await fetch('/api/v1/lookups', {method: "POST"})
        .then((response) => {
            return response.text();
        })
        .then((response_lookup_code) => {
            const trimmed_code = response_lookup_code.trim();
            console.log(`new lookup code is ${trimmed_code}`);
            localStorage.setItem("lookup", trimmed_code);
        });
    }
    const lookup_code = localStorage.getItem("lookup");
    if (!lookup_code) {
      console.error("no lookup code before order post")
    } else {
      console.log(`lookup from local storage before posting order is ${lookup_code}`)
    }
    setLocalItem("order", order);
    console.log(`fetch orders ${lookup_code}`)
    fetch(`/api/v1/orders/${lookup_code}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: order
    }).then((response) => {
      if (response.ok) {
        console.log(response);
        initializeStripe(lookup_code);
      } else {
        console.error(response);
      }
    });
  });

  // ------- Stripe Logic Merged -------

  async function initializeStripe(lookup_code) {
    console.log("Initializing Stripe with lookup_code:", lookup_code);

    // Show the stripe section
    const stripeSection = document.getElementById("stripe-section");
    stripeSection.hidden = false;
    stripeSection.scrollIntoView();

    // fetch publishable key
    const {publishableKey} = await fetch(`/api/v1/config`).then((r) => r.json());
    if (!publishableKey) {
      console.error('no publishableKey');
      return;
    }
    const stripe = Stripe(publishableKey, {
      apiVersion: '2020-08-27',
    });

    function postIntent(method) {
        console.info(`posting intent ${lookup_code}`);
        fetch(`/api/v1/intents/${lookup_code}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            "method": method
          })
        }).then((response) => {
          if (response.ok) {
            console.log(response);
          } else {
            console.error(response);
          }
        });
    }

    // show payment choices tabset
    function loadPaymentChoices() {
      const tabsPaymentMethod = document.getElementById("tabs-payment-method");
      tabsPaymentMethod.classList.remove("hidden");
      tabsPaymentMethod.scrollIntoView();

      const tablink_pay_stripe = document.getElementById("tablink-pay-stripe");
      const tablink_pay_on_tree = document.getElementById("tablink-pay-on-tree");

      const tabcontent_pay_stripe = document.getElementById("tab-pay-stripe");
      const tabcontent_pay_on_tree = document.getElementById("tab-pay-on-tree");

      const buttonLoadStripe = document.getElementById("button-load-stripe");

      document.getElementById("button-pay-on-tree").onclick = (event) => {
        event.preventDefault();
        postIntent("cashcheck");
        window.location.assign("/registered");
      }

      // Note: Stripe payments redirect to "/return"

      tablink_pay_stripe.addEventListener("click", (event) => {
        event.preventDefault();
        tablink_pay_stripe.classList.add("active"); // activate
        tablink_pay_on_tree.classList.remove("active");

        tabcontent_pay_stripe.classList.remove("hidden"); // show
        tabcontent_pay_on_tree.classList.add("hidden");
      });

      tablink_pay_on_tree.addEventListener("click", (event) => {
        event.preventDefault();
        tablink_pay_stripe.classList.remove("active");
        tablink_pay_on_tree.classList.add("active"); // activate

        tabcontent_pay_stripe.classList.add("hidden");
        const stripePayment = document.getElementById('stripe-payment');
        stripePayment.classList.add('hidden');
        tabcontent_pay_on_tree.classList.remove("hidden"); // show
      });

      tablink_pay_stripe.click();
    }

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
    const elements = stripe.elements({ clientSecret });

    // create and mount the linkAuthentication Element
    const linkAuthenticationElement = elements.create("linkAuthentication");
    linkAuthenticationElement.mount("#link-authentication-element");
    console.log(`link mounted`);

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
      },
      defaultValues: {
        address: {
          city: 'Pembroke',
          state: 'MA',
          postal_code: '02359',
          country: 'US',
        }
      },
    };
    const addressElement = elements.create('address', options);
    addressElement.mount('#address-element');

    // on address input, save address in localStorage
    addressElement.on('change', (event) => {
      if (event.complete) {
        // Extract potentially complete address
        const address = event.value.address;
        console.log(address);
        setLocalItem("address", JSON.stringify(address));

        // post address to server
        fetch(`/api/v1/addresses/${lookup_code}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(address)
        }).then((response) => {
            if (response.ok) {
              console.log(response);

              loadPaymentChoices();
            } else {
              console.error(response);
            }
          });
      }
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
        layout: "tabs",
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

        postIntent("stripe");

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
  }

  // localStorage helpers
  function getLocalItem(key) {
    return window.localStorage.getItem(key);
  }
  function setLocalItem(key, value) {
    window.localStorage.setItem(key, value);
  }
  function removeLocalItem(key) {
    window.localStorage.removeItem(key);
  }

  pageStart();
});
