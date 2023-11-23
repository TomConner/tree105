  // function urlencodeFormData(fd){
  //   var s = '';
  //   function encode(s){ return encodeURIComponent(s).replace(/%20/g,'+'); }
  //   for(var pair of fd.entries()){
  //       if(typeof pair[1]=='string'){
  //           s += (s?'&':'') + encode(pair[0])+'='+encode(pair[1]);
  //       }
  //   }
  //   return s;
  // }

  // function displayPaymentInstructions() {
  //   if (intend_pay_venmo) {
  //     messageVenmo.hidden = false;
  //     window.location.assign('venmoinstructions');
  //   } else if (intend_pay_card) {
  //     messageVenmo.hidden = true;
  //     message2.innerText = "";
  //     message1.innerText = `Please continue to payment of $${amount}. You can use your PayPal or a credit/debit card.`;
  //   } else {
  //     messageVenmo.hidden = true;
  //     window.location.assign('registered');
  //   }
  // }

  // function formSubmit(event) {
  //   var url = "https://tree105-reg-mcme3i32aq-uc.a.run.app";
  //   var request = new XMLHttpRequest();
  //   request.open('POST', url, true);
  //   message1 = document.getElementById("message1")
  //   message2 = document.getElementById("message2")
  //   intend_pay_card = document.getElementById("card").checked;
  //   intend_pay_venmo = document.getElementById("venmo").checked;
  //   amount = parseInt(document.getElementById("amount").innerText);

  //   request.onload = function() { // request successful
  //     // we can use server response to our request now
  //     console.log(request.responseText);
  //     displayPaymentInstructions();
  //   };

  //   request.onerror = function() {
  //     console.log(request.responseText);
  //     // request failed
  //     message1.innerText =
  //       "Registration failed. Please try again later or contact treedrive105@gmail.com";
  //    };

  //   message1.innerText = "Processing";
  //   request.setRequestHeader('Content-Type','application/x-www-form-urlencoded')
  //   request.send(urlencodeFormData(new FormData(event.target)));
  //   event.preventDefault();

  //   if (intend_pay_card) {
  //     renderPaypalButtons(amount);
  //   }
  // }



window.addEventListener("load", (event) => {

  const orderForm = document.getElementById("order-form");
  const rnumtrees = document.getElementById("rnumtrees");
  const rextra = document.getElementById("rextra");
  const rcomment = document.getElementById("rcomment");
  const ramount = document.getElementById("amount");

  const stripeFrame = document.getElementById("stripe-frame");

  // establish lookup code, retrieve any order from server, and load orderForm
  async function pageStart() {
    console.debug("pageStart");
    const lookup_code = getLocalItem("lookup");
    if (lookup_code) {
      console.debug(`lookup code from localStorage is ${lookup_code}; fetching order`);
      try {
        const response = await fetch(`/api/v1/orders/${lookup_code}`);
        console.debug(response);
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
      // document.getElementById("registerform").addEventListener("submit", formSubmit);

      //document.getElementById("cashcheck").checked = true;
      rnumtrees.value = 1;
      rextra.value = 0;
      rcomment.value = "";
    }
    onChangeOrderForm();
    rnumtrees.addEventListener("input", onChangeOrderForm);
    rextra.addEventListener("input", onChangeOrderForm);

    lookup_code = getLocalItem("lookup");

    // document.getElementById("registerform").addEventListener("input", (event) => {
    //   message1 = document.getElementById("message1")
    //   isvalid = document.getElementById("registerform").checkValidity();
    //   MSG_INVALID = "Please complete the form.";
    //   button = document.getElementById("submit");
    //   document.getElementById("paypal-button-container").innerHTML = "";
    //   if (document.getElementById("cashcheck").checked) {
    //     button.value = "Register";
    //     message1.innerText = isvalid ? "Press button to register your tree(s) for lookup." : MSG_INVALID;
    //   } else if (document.getElementById("venmo").checked) {
    //     button.value = "Continue to Venmo payment";
    //     message1.innerText = isvalid ? "Press button to register and pay by Venmo." : MSG_INVALID;
    //   } else if (document.getElementById("card").checked) {
    //     button.value = "Continue to card payment";
    //     message1.innerText = isvalid ? "Press button to register and pay by credit/debit card." : MSG_INVALID;
    //   } else {
    //     button.value = "Submit";
    //   }
    // });
    // console.log('ready');

    document.getElementById("spinner-register").hidden = true;
    orderForm.hidden = false;
    orderForm.scrollIntoView();
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

  // on Continue button: POST order, then hand off to stripeFrame
  orderForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const order = JSON.stringify({
      numtrees: rnumtrees.value,
      extra: rextra.value,
      comment: rcomment.value
    })
    setLocalItem("order", order);
    fetch(`/api/v1/orders/${lookup_code}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: order
    }).then((response) => {
      if (response.ok) {
        console.log(response);

        loadStripeFrame();
      } else {
        console.error(response);
      }
    });
  });

  // load stripeFrame and hand off to it
  function loadStripeFrame() {
    console.log("Load stripe frame");
    const lookup_code = getLocalItem("lookup");
    stripeFrame.src = `/register?q=${lookup_code}`;
    stripeFrame.contentWindow.addEventListener('message', onStripeFrameMessage, false);
    stripeFrame.hidden = false;
    stripeFrame.scrollIntoView();
  }

  // dispatch messages from stripeFrame
  function onStripeFrameMessage(event) {
    // only trust messages from my own iframe
    const expectedOrigins = [window.location.origin, 'https://js.stripe.com'];

    // Check if the origin of the message is the expected one
    if (!(expectedOrigins.includes(event.origin))) {
        console.error('Invalid origin:', event.origin);
        return; // Ignore the message
    } else {
        console.debug('Valid origin:', event.origin);
        console.debug(event);
    }

    // Handle the message here

    switch (event.data.m) {
      case 'frame_scrollIntoView':
        stripeFrame.scrollIntoView();
        break;

      //TODO height of frame

      case 'navigate':
        window.location.assign(event.data.location);

      default:
        console.debug(`message from ${event.origin}:`);
        console.debug(event.data);
        break;
    }
  }

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

  pageStart();
});
