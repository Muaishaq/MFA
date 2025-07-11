// registration-countdown.js

// This Sets discount end date/time (5 days from now)
const discountEndDate = new Date();
discountEndDate.setDate(discountEndDate.getDate() + 5);

const countdownTimer = document.getElementById("countdownTimer");
const discountBanner = document.getElementById("discountBanner");
const courseSelect = document.getElementById("course");

const discountedPrices = {
  Beginner: 10000,
  Intermediate: 13500,
  Advanced: 23500,
  "Full Course": 48500,
};

const normalPrices = {
  Beginner: 10000,
  Intermediate: 15000,
  Advanced: 25000,
  "Full Course": 50000,
};

function updatePrices(discountActive) {
  for (let option of courseSelect.options) {
    if (option.value) {
      let price = discountActive
        ? discountedPrices[option.value]
        : normalPrices[option.value];
      option.text = `${option.value} - ₦${price.toLocaleString()}`;
    }
  }
}

function updateCountdown() {
  const now = new Date().getTime();
  const distance = discountEndDate.getTime() - now;

  if (distance < 0) {
    // Discount ended
    discountBanner.style.display = "none";
    updatePrices(false);
    clearInterval(countdownInterval);
    return;
  }

  // Time calculations
  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  countdownTimer.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

// Initialize
updatePrices(true);
updateCountdown();
const countdownInterval = setInterval(updateCountdown, 1000);
