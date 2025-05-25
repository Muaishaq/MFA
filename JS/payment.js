// JS/payment.js

document.addEventListener("DOMContentLoaded", function () {
  const registrationForm = document.getElementById("registrationForm");
  const courseSelect = document.getElementById("course");
  const fullNameInput = document.getElementById("fullName");
  const emailInput = document.getElementById("email");
  const phoneInput = document.getElementById("phone");

  // Get additional fields for meta data
  const stateInput = document.getElementById("state");
  const townInput = document.getElementById("town");

  // --- Configuration ---
  const FLUTTERWAVE_PUBLIC_KEY = "FLWPUBK_TEST-048e59700701a459a784e8eca4658065-X";
  const DISCOUNT_AMOUNT = 1500;
  const LOGIN_PORTAL_URL = "https://yourforexacademy.com/login.html";
  // Function to check if the discount is currently active
  function isDiscountActive() {
    const countdownTimerSpan = document.getElementById("countdownTimer");
    // Ensure countdownTimerSpan exists and its text content is not "Expired!"
    return (
      countdownTimerSpan && countdownTimerSpan.textContent.trim() !== "Expired!"
    );
  }

  // Function to get course price
  function getCoursePrice(courseValue) {
    switch (courseValue) {
      case "Beginner":
        return 10000;
      case "Intermediate":
        return 15000;
      case "Advanced":
        return 25000;
      case "Full Course":
        return 50000;
      default:
        return 0;
    }
  }

  registrationForm.addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent default form submission

    // Basic client-side validation to ensure form is valid before proceeding
    if (!registrationForm.checkValidity()) {
      alert("Please fill out all required fields correctly.");
      return;
    }

    // Gather form data ( needed for Flutterwave checkout parameters)
    const fullName = fullNameInput.value;
    const email = emailInput.value;
    const phone = phoneInput.value;
    const selectedCourse = courseSelect.value;
    const state = stateInput.value; // Get value from the state input
    const town = townInput.value; // Get value from the town input

    let amount = getCoursePrice(selectedCourse);

    // Apply discount logic
    if (amount > 0 && isDiscountActive()) {
      amount -= DISCOUNT_AMOUNT;
      if (amount < 0) amount = 0; // Ensure amount doesn't go negative
    }

    // Prevent checkout if amount is zero or negative after calculation
    if (amount <= 0) {
      alert(
        "Please select a valid course or the calculated amount is zero/negative."
      );
      return;
    }

    // Generate a unique transaction reference
    // Using Date.now() + random string ensures high uniqueness
    const tx_ref =
      "Muaishaq_" + Date.now() + Math.random().toString(36).substring(2, 15);

    FlutterwaveCheckout({
      public_key: FLUTTERWAVE_PUBLIC_KEY,
      tx_ref: tx_ref,
      amount: amount,
      currency: "NGN", // Ensure this matches your expected currency
      payment_options: "card,mobilemoney,ussd",
      customer: {
        email: email,
        phone_number: phone,
        name: fullName,
      },
      // IMPORTANT: Pass any custom data here so Apps Script can retrieve it
      // from webhook/verification metadata (verificationResult.data.meta in Apps Script)
      meta: {
        // These keys should match what you expect in Apps Script's verificationResult.data.meta
        state: state,
        town: town,
        course: selectedCourse,
        // You can add other useful info here, e.g., the original amount, discount applied etc.
        original_amount: getCoursePrice(selectedCourse), // Original amount before discount
        discount_applied: isDiscountActive() ? DISCOUNT_AMOUNT : 0, // Indicate if discount was applied
      },
      customizations: {
        title: "Muaishaq Forex Academy Registration",
        description: `Payment for ${selectedCourse} Course`,
        // Make sure this logo URL is correct and publicly accessible
        logo: "https://yourforexacademy.com/ASSETS/images/your-logo.png",
      },
      callback: function (response) {
        // This callback is from Flutterwave, indicating their UI is done.
        //now primarily rely on Flutterwave's webhook for backend logging/email.
        if (response.status === "successful") {
          alert(
            "✅ Payment successful! You will receive an email shortly. Redirecting to your login portal..."
          );
          registrationForm.reset(); // Clear the form after successful initiation
          // Redirect the user immediately. The Apps Script (via webhook) will handle logging and email.
          window.location.href = LOGIN_PORTAL_URL; // Redirect to your login page/dashboard
        } else {
          // Payment was not successful or failed.
          alert("❌ Payment Failed! Please try again or contact support.");
        }
        console.log("Flutterwave Checkout Callback Response:", response); // Log response for debugging
      },
      onclose: function () {
        // User closed the payment modal
        console.log("Flutterwave payment modal closed by user.");
      },
    });
  });

  // --- Email Matching Validation  ---
  const emailMatchError = document.getElementById("emailMatchError");

  // If you want to put these event listeners inside DOMContentLoaded for consistency
  // (assuming email and confirmEmail inputs are also available)
  const emailInputForValidation = document.getElementById("email");
  const confirmEmailInput = document.getElementById("confirmEmail");

  if (emailInputForValidation && confirmEmailInput && emailMatchError) {
    function validateEmails() {
      if (emailInputForValidation.value !== confirmEmailInput.value) {
        emailMatchError.style.display = "block";
        confirmEmailInput.setCustomValidity("Emails do not match"); // Set HTML5 custom validation error
      } else {
        emailMatchError.style.display = "none";
        confirmEmailInput.setCustomValidity(""); // Clear the error if emails match
      }
    }

    emailInputForValidation.addEventListener("keyup", validateEmails);
    confirmEmailInput.addEventListener("keyup", validateEmails);
    confirmEmailInput.addEventListener("change", validateEmails); // Good for paste events
  } else {
    console.warn(
      "Email validation elements not found. Check IDs: email, confirmEmail, emailMatchError"
    );
  }
});
