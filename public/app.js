// Patient Registration
document
  .getElementById("patient-registration-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

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
      const result = await response.json();
      alert(result.message);
    } catch (error) {
      console.error("Error registering patient:", error);
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

// Doctor Registration
document
  .getElementById("doctor-registration-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

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
      const result = await response.json();
      alert(result.message);
    } catch (error) {
      console.error("Error registering doctor:", error);
    }
  });

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
