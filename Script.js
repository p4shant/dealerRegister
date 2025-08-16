document.addEventListener("DOMContentLoaded", function () {
  // Set today's date as default
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("orderDate").value = today;

  // IMPORTANT: Replace with your deployed Google Apps Script Web App URL
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbywMbuiGH_54KLbjBTNiXRellGZ4wRtIIWwuMyIHLHBtcoTi0WWIQM5Nq6jz4Uk-YqH/exec"; 

  // Load saved form data
  loadFormData();

  // Quantity controls
  document.querySelectorAll(".increase, .decrease").forEach((button) => {
    button.addEventListener("click", function () {
      const kitId = this.getAttribute("data-kit");
      const input = document.getElementById(kitId);
      let value = parseInt(input.value);

      if (this.classList.contains("increase")) {
        value++;
      } else if (this.classList.contains("decrease") && value > 0) {
        value--;
      }

      input.value = value;
      calculateTotals();
      saveFormData();
    });
  });

  // Input change listeners
  document.querySelectorAll("input, textarea").forEach((input) => {
    input.addEventListener("input", function () {
      if (this.id.startsWith("kit")) {
        calculateTotals();
      }
      saveFormData();
    });
  });

  // Form submission
  document.getElementById("orderForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    // Clear previous error messages
    hideNotification("error");

    // Basic and Custom Validation
    const companyName = document.getElementById("companyName");
    const gstNumber = document.getElementById("gstNumber");
    const mobile = document.getElementById("mobile");
    const email = document.getElementById("email");
    const orderDate = document.getElementById("orderDate");
    const billAddress = document.getElementById("billAddress");
    const shipAddress = document.getElementById("shipAddress");

    let isValid = true;
    const requiredFields = [
      companyName,
      gstNumber,
      mobile,
      email,
      orderDate,
      billAddress,
      shipAddress,
    ];

    requiredFields.forEach((field) => {
      if (!field.value.trim()) {
        isValid = false;
        field.style.borderColor = "#e74c3c";
      } else {
        field.style.borderColor = "#ddd";
      }
    });

    if (!validateMobile(mobile.value)) {
      isValid = false;
      mobile.style.borderColor = "#e74c3c";
      showNotification("error", "Please enter a valid 10-digit Indian mobile number (starts with 6,7,8,9).");
      return; // Stop further validation if mobile is invalid
    } else {
      mobile.style.borderColor = "#ddd";
    }

    if (!validateDate(orderDate.value)) {
      isValid = false;
      orderDate.style.borderColor = "#e74c3c";
      showNotification("error", "Order date cannot be in the future.");
      return; // Stop further validation if date is invalid
    } else {
      orderDate.style.borderColor = "#ddd";
    }

    if (!isValid) {
      showNotification("error", "Please fill in all required fields.");
      return;
    }

    // Prepare form data
    const formData = {
      companyName: companyName.value,
      gstNumber: gstNumber.value,
      mobile: mobile.value,
      email: email.value, // Added email
      orderDate: orderDate.value,
      billAddress: billAddress.value,
      shipAddress: shipAddress.value,
      kit3Qty: parseInt(document.getElementById("kit3").value) || 0,
      kit4Qty: parseInt(document.getElementById("kit4").value) || 0,
      kit5Qty: parseInt(document.getElementById("kit5").value) || 0,
      totalUnits: document.getElementById("total-units").textContent,
      subtotal: document.getElementById("subtotal").textContent,
      gst: document.getElementById("gst").textContent,
      grandTotal: document.getElementById("grand-total").textContent,
      paymentProofFilename: document.getElementById("paymentProof").files[0]
        ? document.getElementById("paymentProof").files[0].name
        : "No file uploaded",
    };

    // Send data to Google Apps Script
    try {
      const response = await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors", // Required for Google Apps Script as a web app
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      // No direct response can be read with no-cors, so assume success for now
      // A more robust solution would involve a server-side proxy or different Apps Script deployment.
      console.log("Form data sent to Apps Script. Response (if any) cannot be directly read due to no-cors mode.");
      showNotification("success", "Your order has been submitted successfully!");


      // Reset form and clear storage
      setTimeout(() => {
        document.getElementById("orderForm").reset();
        document.getElementById("orderDate").value = today;
        document
          .querySelectorAll('[id^="kit"]')
          .forEach((input) => (input.value = 0));
        calculateTotals();
        localStorage.removeItem("solarOrderFormData");
        hideNotification("success");
      }, 3000);

    } catch (error) {
      console.error("Error submitting form:", error);
      showNotification("error", "There was an error submitting your order. Please try again.");
    }
  });

  // Reset button
  document.getElementById("resetBtn").addEventListener("click", function () {
    if (confirm("Are you sure you want to reset the form?")) {
      document.getElementById("orderForm").reset();
      document.getElementById("orderDate").value = today;
      document
        .querySelectorAll('[id^="kit"]')
        .forEach((input) => (input.value = 0));
      calculateTotals();
      localStorage.removeItem("solarOrderFormData");
      hideNotification("success"); // Hide any success/error notifications
      hideNotification("error");
    }
  });

  // Initial calculation
  calculateTotals();
});

function calculateTotals() {
  const kit3Price = 121000;
  const kit4Price = 162000;
  const kit5Price = 194000;

  const kit3Qty = parseInt(document.getElementById("kit3").value) || 0;
  const kit4Qty = parseInt(document.getElementById("kit4").value) || 0;
  const kit5Qty = parseInt(document.getElementById("kit5").value) || 0;

  const kit3Total = kit3Qty * kit3Price;
  const kit4Total = kit4Qty * kit4Price;
  const kit5Total = kit5Qty * kit5Price;
  const totalUnits = kit3Qty + kit4Qty + kit5Qty;
  const subtotal = kit3Total + kit4Total + kit5Total;
  const gst = subtotal * 0.12;
  const grandTotal = subtotal + gst;

  document.getElementById(
    "kit3-summary"
  ).textContent = `${kit3Qty} × ₹${formatCurrency(
    kit3Price
  )} = ₹${formatCurrency(kit3Total)}`;
  document.getElementById(
    "kit4-summary"
  ).textContent = `${kit4Qty} × ₹${formatCurrency(
    kit4Price
  )} = ₹${formatCurrency(kit4Total)}`;
  document.getElementById(
    "kit5-summary"
  ).textContent = `${kit5Qty} × ₹${formatCurrency(
    kit5Price
  )} = ₹${formatCurrency(kit5Total)}`;
  document.getElementById("total-units").textContent = totalUnits;
  document.getElementById("subtotal").textContent = `₹${formatCurrency(
    subtotal
  )}`;
  document.getElementById("gst").textContent = `₹${formatCurrency(gst)}`;
  document.getElementById("grand-total").textContent = `₹${formatCurrency(
    grandTotal
  )}`;
}

function formatCurrency(amount) {
  return amount.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  });
}

function saveFormData() {
  const formData = {
    companyName: document.getElementById("companyName").value,
    gstNumber: document.getElementById("gstNumber").value,
    mobile: document.getElementById("mobile").value,
    email: document.getElementById("email").value, // Added email
    orderDate: document.getElementById("orderDate").value,
    billAddress: document.getElementById("billAddress").value,
    shipAddress: document.getElementById("shipAddress").value,
    kit3: document.getElementById("kit3").value,
    kit4: document.getElementById("kit4").value,
    kit5: document.getElementById("kit5").value,
  };

  localStorage.setItem("solarOrderFormData", JSON.stringify(formData));
}

function loadFormData() {
  const savedData = localStorage.getItem("solarOrderFormData");
  if (savedData) {
    const formData = JSON.parse(savedData);

    document.getElementById("companyName").value = formData.companyName || "";
    document.getElementById("gstNumber").value = formData.gstNumber || "";
    document.getElementById("mobile").value = formData.mobile || "";
    document.getElementById("email").value = formData.email || ""; // Added email
    document.getElementById("orderDate").value = formData.orderDate || "";
    document.getElementById("billAddress").value = formData.billAddress || "";
    document.getElementById("shipAddress").value = formData.shipAddress || "";
    document.getElementById("kit3").value = formData.kit3 || 0;
    document.getElementById("kit4").value = formData.kit4 || 0;
    document.getElementById("kit5").value = formData.kit5 || 0;

    calculateTotals();
  }
}

// Custom Validation Functions
function validateMobile(mobileNumber) {
  // Accepts 10 digits, starting with 6, 7, 8, or 9
  const mobileRegex = /^[6-9]\d{9}$/;
  return mobileRegex.test(mobileNumber);
}

function validateDate(dateString) {
  const selectedDate = new Date(dateString);
  const today = new Date();
  // Set hours, minutes, seconds, milliseconds to 0 for accurate date comparison
  today.setHours(0, 0, 0, 0); 
  selectedDate.setHours(0, 0, 0, 0);
  
  return selectedDate <= today;
}

// Notification functions
function showNotification(type, message) {
    const notification = document.getElementById("notification");
    const errorNotification = document.getElementById("errorNotification");
    const notificationSpan = type === "success" ? notification.querySelector('span') : errorNotification.querySelector('span');

    // Hide any currently displayed notification
    hideNotification("success");
    hideNotification("error");

    if (type === "success") {
        notificationSpan.textContent = message;
        notification.classList.add("show");
    } else { // type === "error"
        errorNotification.querySelector('span').textContent = message; // Update specific error message
        errorNotification.classList.add("show");
    }
}

function hideNotification(type) {
    const notification = document.getElementById("notification");
    const errorNotification = document.getElementById("errorNotification");

    if (type === "success") {
        notification.classList.remove("show");
    } else { // type === "error"
        errorNotification.classList.remove("show");
    }
}