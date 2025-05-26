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
  // This is the base URL of your academy where users will eventually log in
  const ACADEMY_WEBSITE_URL = "https://muaishaq.github.io/MFA"; 

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
      if (amount < 0) amount = 0;
    }

    // Generate a unique transaction reference
    const txRef = `MFA_TX_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    FlutterwaveCheckout({
      public_key: FLUTTERWAVE_PUBLIC_KEY,
      tx_ref: txRef,
      amount: amount,
      currency: "NGN", // Assuming NGN, update if needed
      country: "NG", // Assuming Nigeria, update if needed
      payment_options: "card, mobilemoney, ussd", // Customize payment options
      customer: {
        email: email,
        phone_number: phone,
        name: fullName,
      },
      meta: {
        course: selectedCourse,
        state: state,
        town: town,
      },
      customizations: {
        title: "Muaishaq Forex Academy",
        description: `Payment for ${selectedCourse} Course`,
        logo: "https://yourforexacademy.com/logo.png", // Replace with your actual logo URL
      },
      callback: function (response) {
        console.log("Payment response:", response); // Log response for debugging

        if (
          response.status === "successful" &&
          response.tx_ref &&
          response.transaction_id
        ) {
          // Payment was successful on Flutterwave's side.
          // The Apps Script webhook will handle the backend processing (sheet logging, initial email).

          // Display success message to the user, instructing them to check email
          alert(
            `Payment of ${response.currency} ${response.amount} for the ${selectedCourse} Course was successful! Your account has been activated, and login instructions (including password setup) will be sent to your email (${email}) in a separate email shortly. Please check your inbox (and spam folder).`
          );
          
        } else if (response.status === "cancelled") {
          alert("Payment was cancelled. Please try again.");
        } else {
          alert("Payment failed or was not successful. Please try again.");
        }
        // Always reset the form after the payment interaction is complete
        registrationForm.reset(); // <--- ADDED THIS LINE
      },
      onclose: function () {
        // User closed the payment modal
        console.log("Flutterwave payment modal closed by user.");
        registrationForm.reset(); // <--- ADDED THIS LINE
      },
    });
  });

  // --- Email Matching Validation  ---
  const emailMatchError = document.getElementById("emailMatchError");

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