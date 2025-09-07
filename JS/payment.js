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

  const submitButton = document.getElementById("submitForVerification"); 
  const statusMessageDiv = document.getElementById("statusMessage");

  // --- Configuration for EmailJS & WhatsApp ---
  const EMAILJS_SERVICE_ID = "service_n5apk6b"; 
  const EMAILJS_TEMPLATE_ID = "template_5vg7f5h"; 
  const EMAILJS_PUBLIC_KEY = "QK74tX-WLrp7gQKd4";

  const YOUR_WHATSAPP_NUMBER = "+234 70 8350 1555";

  // --- Configuration for Appscript
  const GOOGLE_SHEET_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxRl1RvykDdly56wOjDMhP19TAcByc6BsdlOm4sG-yIX1tu2JBLxXg0hUfm-1cJsNBs/exec";

  const DISCOUNT_AMOUNT = 1500;

  function isDiscountActive() {
    const countdownTimerSpan = document.getElementById("countdownTimer");
    return (
      countdownTimerSpan && countdownTimerSpan.textContent.trim() !== "Expired!"
    );
  }

  function getCoursePrice(courseValue) {
    switch (courseValue) {
      case "Beginner": return 10000;
      case "Intermediate": return 15000;
      case "Advanced": return 25000;
      case "Full Course": return 50000;
      default: return 0;
    }
  }

  //This Handles form submission for manual registration and WhatsApp redirect
  if (registrationForm) {
    registrationForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      //This Reset messages
      statusMessageDiv.textContent = "";
      statusMessageDiv.style.color = "";

      //This is Basic form validation (it ensure all required fields are filled)
      if (!registrationForm.checkValidity()) {
        statusMessageDiv.textContent = "Please fill in all required fields correctly.";
        statusMessageDiv.style.color = "red";
        registrationForm.reportValidity(); //This Shows browser's validation messages
        return;
      }

      const fullName = fullNameInput.value;
      const email = emailInput.value;
      const phone = phoneInput.value;
      const course = courseSelect.value;
      const state = stateInput.value;
      const town = townInput.value;

      statusMessageDiv.textContent = "Processing your registration...";
      statusMessageDiv.style.color = "orange";
      submitButton.disabled = true; //This Disables button to prevent multiple submissions

      try {
        // Data to send to EmailJS template
        const templateParams = {
          from_name: fullName,
          user_email: email,
          user_phone: phone,
          course_name: course,
          user_state: state,
          user_town: town,
          whatsapp_number: YOUR_WHATSAPP_NUMBER //This passes WhatsApp number to template for link
        };

        //This Sends email using EmailJS
        const emailResponse = await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          templateParams,
          EMAILJS_PUBLIC_KEY
        );

        console.log("EmailJS response:", emailResponse);

        if (emailResponse.status === 200) {
          statusMessageDiv.textContent = `✅ Registration successful! A confirmation email has been sent to ${email}.`;
          statusMessageDiv.style.color = "green";

          // --- This Sends data to Google Sheet ---
          try {
            const sheetResponse = await fetch(GOOGLE_SHEET_WEB_APP_URL, {
              method: "POST",
              mode: "no-cors", //This is Required for Google Apps Script as a web app
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(templateParams), // Sends the same form data
            });
            // As a developer Note: With 'no-cors', the response object will be opaque,
            // so you can't read the actual JSON success message from the Apps Script.
            // You just assume success if the fetch operation itself doesn't throw.
            console.log("Data sent to Google Sheet successfully (assuming 'no-cors' success).");
          } catch (sheetError) {
            console.error("Error sending data to Google Sheet:", sheetError);
            // Am displaying a warning to the user if this fails without affecting the main EmailJS success message.

            statusMessageDiv.textContent += "\n⚠️ Failed to save data to database. Contact support.";
            statusMessageDiv.style.color = "orange"; // Indicate a secondary issue
          }

          //This is WhatsApp URL with pre-filled message
          const whatsappMessage = encodeURIComponent(
            `Hello Muaishaq Forex Academy, I just registered for the ${course} Course. My name is ${fullName} and my email is ${email}. I'd like to make payment.`
          );
          const whatsappURL = `https://wa.me/${YOUR_WHATSAPP_NUMBER}?text=${whatsappMessage}`;

          // The setTimeout here is used to  Redirect to WhatsApp after a short delay
          setTimeout(() => {
            window.location.href = whatsappURL;
          }, 2000); // Redirect after 2 seconds

          registrationForm.reset();
          // Optionally disable form fields after successful submission and redirection
          Array.from(registrationForm.elements).forEach(element => {
            if (element !== submitButton) { // This Keeps submit button enabled for potential re-submission if user comes back. It's all logic guys!
              element.disabled = true;
            }
          });
        } else {
          statusMessageDiv.textContent = `❌ Error sending confirmation email. Please try again or contact us directly. (Error: ${emailResponse.text || 'Unknown'})`;
          statusMessageDiv.style.color = "red";
          submitButton.disabled = false; // Re-enables button on error
        }
      } catch (error) {
        console.error("Error during registration process:", error);
        statusMessageDiv.textContent = "An error occurred. Please try again later or contact us directly.";
        statusMessageDiv.style.color = "red";
        submitButton.disabled = false; // Re-enables button on error
      }
    });
  }


  const emailInputForValidation = document.getElementById("email");
  const confirmEmailInputForValidation = document.getElementById("confirmEmail");
  const emailMatchError = document.getElementById("emailMatchError");

  if (emailInputForValidation && confirmEmailInputForValidation && emailMatchError) {
    function validateEmails() {
      if (emailInputForValidation.value !== confirmEmailInputForValidation.value) {
        emailMatchError.style.display = "block";
        confirmEmailInputForValidation.setCustomValidity("Emails do not match");
      } else {
        emailMatchError.style.display = "none";
        confirmEmailInputForValidation.setCustomValidity(""); // Clear custom validation message
      }
    }
    emailInputForValidation.addEventListener("keyup", validateEmails);
    confirmEmailInputForValidation.addEventListener("keyup", validateEmails);
    confirmEmailInputForValidation.addEventListener("change", validateEmails); // This will allow users to copy and paste.
    // I used it so that my users will have better user experience
  } else {
    console.warn("Email validation elements not found. Check IDs: email, confirmEmail, emailMatchError");
  }
});