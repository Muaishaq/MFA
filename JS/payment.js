// JS/payment.js - FOR EMAIL VERIFICATION & PAYMENT FLOW

document.addEventListener("DOMContentLoaded", function () {
  const registrationForm = document.getElementById("registrationForm");
  const courseSelect = document.getElementById("course");
  const fullNameInput = document.getElementById("fullName");
  const emailInput = document.getElementById("email");
  const confirmEmailInput = document.getElementById("confirmEmail"); 
  const phoneInput = document.getElementById("phone");

  const stateInput = document.getElementById("state");
  const townInput = document.getElementById("town");

  const submitButton = document.getElementById("submitForVerification"); // initial submit button
  const statusMessageDiv = document.getElementById("statusMessage"); // For displaying messages

  // --- Configuration ---
  const FLUTTERWAVE_PUBLIC_KEY = "FLWPUBK_TEST-048e59700701a459a784e8eca4658065-X";
  const DISCOUNT_AMOUNT = 1500;
  const LOGIN_PORTAL_URL = "https://muaishaq.github.io/MFA/login";
  const SEND_VERIFICATION_ENDPOINT = "http://localhost/MFA/send_verification.php"; 
    // Function to check if the discount is currently active
  function isDiscountActive() {
    const countdownTimerSpan = document.getElementById("countdownTimer");
    return (
      countdownTimerSpan && countdownTimerSpan.textContent.trim() !== "Expired!"
    );
  }

  // Function to get course price
  function getCoursePrice(courseValue) {
    switch (courseValue) {
      case "Beginner": return 10000;
      case "Intermediate": return 15000;
      case "Advanced": return 25000;
      case "Full Course": return 50000;
      default: return 0;
    }
  }

  // --- Function to initiate Flutterwave Checkout ---
  function initiatePayment(paymentData) {
    let amount = getCoursePrice(paymentData.course);
    if (amount > 0 && isDiscountActive()) {
      amount -= DISCOUNT_AMOUNT;
      if (amount < 0) amount = 0;
    }
    if (amount <= 0) {
      alert("Please select a valid course or the calculated amount is zero/negative.");
      return;
    }

    const txRef = `MFA_TX_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    FlutterwaveCheckout({
      public_key: FLUTTERWAVE_PUBLIC_KEY,
      tx_ref: txRef,
      amount: amount,
      currency: "NGN",
      country: "NG",
      payment_options: "card, mobilemoney, ussd",
      customer: {
        email: paymentData.email,
        phone_number: paymentData.phone,
        name: paymentData.fullName,
      },
      meta: {
        course: paymentData.course,
        state: paymentData.state,
        town: paymentData.town,
        original_amount: getCoursePrice(paymentData.course),
        discount_applied: isDiscountActive() ? DISCOUNT_AMOUNT : 0,
      },
      customizations: {
        title: "Muaishaq Forex Academy",
        description: `Payment for ${paymentData.course} Course`,
        logo: "https://muaishaq.github.io/MFA/ASSETS/images/MFA_Logo.png", 
      },
      callback: function (response) {
        console.log("Payment response:", response);

        if (
          response.status === "successful" &&
          response.tx_ref &&
          response.transaction_id
        ) {
          alert(
            `Payment of ${response.currency} ${response.amount} for the ${paymentData.course} Course was successful! Your account has been activated, and login instructions (including password setup) will be sent to your email (${paymentData.email}) in a separate email shortly. Please check your inbox (and spam folder).`
          );
          window.location.href = LOGIN_PORTAL_URL;

        } else if (response.status === "cancelled") {
          alert("Payment was cancelled. Please try again.");
        } else {
          alert("Payment failed or was not successful. Please try again.");
        }
        registrationForm.reset();
        // Re-enable form fields if the user needs to try again or register another
        Array.from(registrationForm.elements).forEach(element => element.disabled = false);
        statusMessageDiv.textContent = ''; // Clear status message
      },
      onclose: function () {
        console.log("Flutterwave payment modal closed by user.");
        // registrationForm.reset();
        // Array.from(registrationForm.elements).forEach(element => element.disabled = false);
      },
    });
  }

  // --- Check URL for Verification Status on page load ---
  const urlParams = new URLSearchParams(window.location.search);
  const verificationStatus = urlParams.get('status');

  if (verificationStatus === 'verified') {
    // User arrived from successful email verification
    const verifiedData = {
      fullName: urlParams.get('fullName'),
      email: urlParams.get('email'),
      phone: urlParams.get('phone'),
      course: urlParams.get('course'),
      state: urlParams.get('state'),
      town: urlParams.get('town')
    };

    // Pre-fill the form with verified data
    fullNameInput.value = verifiedData.fullName;
    emailInput.value = verifiedData.email;
    confirmEmailInput.value = verifiedData.email; // Also pre-fill confirm email
    phoneInput.value = verifiedData.phone;
    courseSelect.value = verifiedData.course;
    stateInput.value = verifiedData.state;
    townInput.value = verifiedData.town;

    // Disable fields that are now "verified" to prevent accidental changes
    fullNameInput.disabled = true;
    emailInput.disabled = true;
    confirmEmailInput.disabled = true;
    phoneInput.disabled = true;
    courseSelect.disabled = true;
    stateInput.disabled = true;
    townInput.disabled = true;
    submitButton.disabled = true; // Disable the old "Register" button

    // Show message to user and automatically trigger payment or prompt
    statusMessageDiv.textContent = "✅ Email verified! Proceed to payment.";
    statusMessageDiv.style.color = "green";

   
    const payButton = document.createElement('button');
    payButton.type = 'button';
    payButton.textContent = 'Proceed to Payment';
    payButton.id = 'proceedToPaymentBtn';
    payButton.style.marginTop = '20px';
    payButton.style.padding = '10px 20px';
    payButton.style.backgroundColor = '#007bff';
    payButton.style.color = 'white';
    payButton.style.border = 'none';
    payButton.style.borderRadius = '5px';
    payButton.style.cursor = 'pointer';

    registrationForm.parentNode.insertBefore(payButton, registrationForm.nextSibling); // Insert after the form

    payButton.addEventListener('click', () => {
        initiatePayment(verifiedData);
    });

    // Clear the URL parameters after processing to keep the URL clean
    const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);

  } else if (verificationStatus === 'already_verified') {
    statusMessageDiv.textContent = "ℹ️ This email is already verified. Please proceed to payment or contact support.";
    statusMessageDiv.style.color = "blue";
    // Optionally pre-fill email if available in URL to prompt user for payment
    const verifiedEmail = urlParams.get('email');
    if(verifiedEmail) {
      emailInput.value = verifiedEmail;
      emailInput.disabled = true;
      confirmEmailInput.value = verifiedEmail;
      confirmEmailInput.disabled = true;
    }
    submitButton.disabled = true; // Disable registration button
    // i might also add a "Proceed to Payment" button here as well,
    // if the user simply needs to pay for an existing verified registration.
    // This would require fetching other pending data via AJAX or having a dedicated "Pay Now" flow.
  }

  // --- Original Form Submission Listener (Conditional for initial registration) ---
  if (!verificationStatus) { // Only attach if no verification status in URL
      registrationForm.addEventListener("submit", async function (event) { // Use async for fetch
        event.preventDefault(); // Prevent default form submission

        // Basic client-side validation
        if (!registrationForm.checkValidity()) {
          alert("Please fill out all required fields correctly.");
          return;
        }

        statusMessageDiv.textContent = "Sending verification email...";
        statusMessageDiv.style.color = "blue";

        // Gather form data
        const fullName = fullNameInput.value;
        const email = emailInput.value;
        const phone = phoneInput.value;
        const selectedCourse = courseSelect.value;
        const state = stateInput.value;
        const town = townInput.value;

        // Data to send to the backend for email verification
        const formData = {
          fullName: fullName,
          email: email,
          phone: phone,
          course: selectedCourse,
          state: state,
          town: town
        };

        try {
          const response = await fetch(SEND_VERIFICATION_ENDPOINT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
          });

          const result = await response.json();

          if (response.ok && result.status === 'success') {
            statusMessageDiv.textContent = "✅ Verification email sent! Please check your inbox (and spam folder) to verify your email and proceed to payment.";
            statusMessageDiv.style.color = "green";
            registrationForm.reset();
            Array.from(registrationForm.elements).forEach(element => element.disabled = true); // Disable form
          } else {
            statusMessageDiv.textContent = `❌ Error sending verification email: ${result.message || 'Unknown error.'}`;
            statusMessageDiv.style.color = "red";
          }
        } catch (error) {
          console.error("Error during email verification request:", error);
          statusMessageDiv.textContent = "An error occurred. Please try again later.";
          statusMessageDiv.style.color = "red";
        }
      });
  }


  // --- Email Matching Validation (Keep as is) ---
  const emailMatchError = document.getElementById("emailMatchError");

  if (emailInputForValidation && confirmEmailInput && emailMatchError) {
    function validateEmails() {
      if (emailInputForValidation.value !== confirmEmailInput.value) {
        emailMatchError.style.display = "block";
        confirmEmailInput.setCustomValidity("Emails do not match");
      } else {
        emailMatchError.style.display = "none";
        confirmEmailInput.setCustomValidity("");
      }
    }
    emailInputForValidation.addEventListener("keyup", validateEmails);
    confirmEmailInput.addEventListener("keyup", validateEmails);
    confirmEmailInput.addEventListener("change", validateEmails);
  } else {
    console.warn("Email validation elements not found. Check IDs: email, confirmEmail, emailMatchError");
  }
});