// Patient Registration
document
  .getElementById("patient-registration-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    // Clear any previous error messages
    clearPatientErrorMessages();

    const name = document.getElementById("patient-name").value;
    const email = document.getElementById("patient-email").value;
    const password = document.getElementById("patient-password").value;

    try {
      const response = await fetch("/api/patients/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors and display them on the page
        if (response.status === 400 && data.errors) {
          displayPatientErrorMessages(data.errors);
        } else {
          alert(data.message || "An error occurred");
        }
        return;
      }

      // If registration is successful, handle success (e.g., redirect or show a success message)
      alert(data.message);
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    }
  });

// Patient Login
document
  .getElementById("patient-login-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("patient-login-email").value;
    const password = document.getElementById("patient-login-password").value;

    try {
      const response = await fetch("/api/patients/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();

      if (result.patientId) {
        // Redirect to the patient's card page
        window.location.href = `/patientCard.html?patientId=${result.patientId}`;
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error("Error logging in patient:", error);
    }
  });

/// Example for the doctor registration form
document
  .getElementById("doctor-registration-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    // Clear any previous error messages
    clearDoctorErrorMessages();

    const name = document.getElementById("doctor-name").value;
    const email = document.getElementById("doctor-email").value;
    const password = document.getElementById("doctor-password").value;
    const specialty = document.getElementById("doctor-specialty").value;

    try {
      const response = await fetch("/api/doctors/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password, specialty }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors and display them on the page
        if (response.status === 400 && data.errors) {
          displayDoctorErrorMessages(data.errors);
        } else {
          alert(data.message || "An error occurred");
        }
        return;
      }

      // If registration is successful, handle success (e.g., redirect or show a success message)
      alert(data.message);
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    }
  });

// Function to display error messages
function displayPatientErrorMessages(errors) {
  const errorContainer = document.getElementById(
    "patient-error-container-register"
  );
  errors.forEach((error) => {
    const errorMessage = document.createElement("p");
    errorMessage.textContent = error.msg;
    errorMessage.style.color = "red";
    errorContainer.appendChild(errorMessage);
  });
}

function displayDoctorErrorMessages(errors) {
  const errorContainer = document.getElementById(
    "doctor-error-container-register"
  );
  errors.forEach((error) => {
    const errorMessage = document.createElement("p");
    errorMessage.textContent = error.msg;
    errorMessage.style.color = "red";
    errorContainer.appendChild(errorMessage);
  });
}

// Function to clear previous error messages
function clearPatientErrorMessages() {
  const errorContainer = document.getElementById(
    "patient-error-container-register"
  );
  errorContainer.innerHTML = ""; // Clear previous errors
}

function clearDoctorErrorMessages() {
  const errorContainer = document.getElementById(
    "doctor-error-container-register"
  );
  errorContainer.innerHTML = ""; // Clear previous errors
}

// Doctor Login
document
  .getElementById("doctor-login-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("doctor-login-email").value;
    const password = document.getElementById("doctor-login-password").value;

    try {
      const response = await fetch("/api/doctors/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();

      if (result.doctorId) {
        // Redirect to the doctor's card page
        window.location.href = `/doctorCard.html?doctorId=${result.doctorId}`;
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error("Error logging in doctor:", error);
    }
  });
