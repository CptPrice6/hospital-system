document.addEventListener("DOMContentLoaded", () => {
  // Registration Form Submission
  document
    .getElementById("registerForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault(); // Prevent form from submitting the default way

      const name = document.getElementById("name").value;
      const email = document.getElementById("registerEmail").value;
      const password = document.getElementById("registerPassword").value;

      try {
        const response = await fetch("/api/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await response.json();

        if (response.ok) {
          document.getElementById(
            "registerResponse"
          ).innerHTML = `<p style="color:green;">${data.message}</p>`;
        } else {
          document.getElementById(
            "registerResponse"
          ).innerHTML = `<p style="color:red;">${
            data.message || data.errors.map((err) => err.msg).join(", ")
          }</p>`;
        }
      } catch (error) {
        console.error("Error during registration:", error);
      }
    });

  // Login Form Submission
  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault(); // Prevent form from submitting the default way

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        document.getElementById(
          "loginResponse"
        ).innerHTML = `<p style="color:green;">${data.message}</p>`;
      } else {
        document.getElementById(
          "loginResponse"
        ).innerHTML = `<p style="color:red;">${
          data.message || data.errors.map((err) => err.msg).join(", ")
        }</p>`;
      }
    } catch (error) {
      console.error("Error during login:", error);
    }
  });
});
