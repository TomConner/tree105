const originalLocalStorage = window.localStorage;
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

  function onChangeNumTrees() {
    value = document.getElementById("rnumtrees").value;
    count = value == "" ? 0 : parseInt(value);
    value = document.getElementById("rextra").value
    extra = value == "" ? 0 : parseInt(value);
    console.log(`${count} trees, ${extra} extra`);
    amount = (count * 15) + extra;
    document.getElementById("amount").innerText = amount;
    lookup_code = localStorage.getItem("lookup");
  }

  function blah() {
    fetch(`/api/v1/pickups/${lookup_code}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        numtrees: count,
        extra: extra,
      }),
    })
    .then((response) => response.json())
    .then((pickup) => {
        console.log(pickup);
    });
  }


  function loadOrderForm() {
    console.debug("loadOrderForm");
    const rnumtrees = document.getElementById("rnumtrees");
    const rextra = document.getElementById("rextra");
    const rcomment = document.getElementById("rcomment");
    const pickup = getLocalItem("pickup")
    if (pickup != null) {
      rnumtrees.value = pickup.numtrees;
      rextra.value = pickup.extra;
      rcomment.value = pickup.comment;
    } else {
      // document.getElementById("registerform").addEventListener("submit", formSubmit);

      //document.getElementById("cashcheck").checked = true;
      rnumtrees.value = 1;
      rextra.value = 0;
      rcomment.value = "";
    }
    onChangeNumTrees();
    rnumtrees.addEventListener("input", onChangeNumTrees);
    rextra.addEventListener("input", onChangeNumTrees);

    const lookup_code = getLocalItem("lookup")
    document.getElementById("lookup-code").innerText = `Lookup code: ${lookup_code}`;

    // document.getElementById("registerform").addEventListener("input", (event) => {
    //   message1 = document.getElementById("message1")
    //   isvalid = document.getElementById("registerform").checkValidity();
    //   MSG_INVALID = "Please complete the form.";
    //   button = document.getElementById("submit");
    //   document.getElementById("paypal-button-container").innerHTML = "";
    //   if (document.getElementById("cashcheck").checked) {
    //     button.value = "Register";
    //     message1.innerText = isvalid ? "Press button to register your tree(s) for pickup." : MSG_INVALID;
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
  }

  // This function will be called when a message is received
  function onStripeFrameMessage(event) {
    // only trust messages from my own iframe
    const expectedOrigins = [window.location.origin, 'https://js.stripe.com'];

    // Check if the origin of the message is the expected one
    if (!(expectedOrigins.includes(event.origin))) {
        console.error('Invalid origin:', event.origin);
        return; // Ignore the message
    } else {
        console.debug('Valid origin:', event.origin);
    }

    // Handle the message here
    //console.debug('Stripe message:', event.data);

    // TODO dispatch the message data to other parts of your application as needed
    // For example: dispatchEvent(new CustomEvent('messageReceived', { detail: event.data }));
  }



  async function newPickup() {
    console.debug("POSTing to pickups");
    // post to /api/v1/pickups
    await fetch('/api/v1/pickups', {method: "POST"})
      .then((response) => response.json())
      .then((data) => {
        console.debug(data);
        lookup_code = data.lookup;
        console.log(`new lookup code is ${lookup_code}`);
        localStorage.setItem("lookup", lookup_code);
        loadOrderForm();
    });
  }

  function getLocalItem(key) {
    try {
      const item = window.localStorage.getItem(key);
      if (item === undefined) {
        return null;
      }
      if (!item) {
        return null;
      }
      return item;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async function pageStart() {
    console.debug("pageStart");
    const lookup_code = getLocalItem("lookup");
    if (lookup_code) {
      console.debug(`lookup code from localStorage is ${lookup_code}; fetching pickup`);
      try {
        await fetch(`/api/v1/pickups/${lookup_code}`)
        .then((response) => {
          console.debug(response)
          if (response.ok) {
            pickup = response.json();
            localStorage.setItem("pickup", pickup);
            loadOrderForm();

          } else {
            console.log(`lookup code ${lookup_code} not found`);
            localStorage.removeItem("lookup");
            newPickup();
          }
        });
      } catch (error) {
        console.error(error);
        localStorage.removeItem("lookup");
        newPickup();
      }
    } else {
      console.debug("no lookup code in localStorage");
      newPickup();
    }
  }



  window.addEventListener("load", (event) => {
    pageStart();

    // Add the event listener to the iframe's window
    const stripeFrame = document.querySelector("iframe#stripe-frame");
    stripeFrame.contentWindow.addEventListener('message', onStripeFrameMessage, false);
  });

