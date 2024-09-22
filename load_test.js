const axios = require("axios");
const { wrapper } = require("axios-cookiejar-support");
const tough = require("tough-cookie");

const loginUrl = "http://13.236.162.134/users/login";
const targetUrl = "http://13.236.162.134/images/convert";
const loginPayload = {
  username: "admin",
  password: "admin",
};
const payload = {
  inputFilePath: "/uploads/ASD (5).png",
  outputFormat: "webp",
};
const duration = 300000; // 5 minutes in milliseconds
const arrivalRate = 1; // requests per second

const cookieJar = new tough.CookieJar();
const client = wrapper(axios.create({ jar: cookieJar }));

async function login() {
  try {
    const response = await client.post(loginUrl, loginPayload, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("Login successful");
  } catch (error) {
    console.error("Error during login:", error.message);
    process.exit(1); // Exit the script if login fails
  }
}

async function sendRequest() {
  try {
    await client.post(targetUrl, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("Request sent successfully");
  } catch (error) {
    console.error("Error sending request:", error.message);
  }
  // Add a small delay
  await new Promise((resolve) => setTimeout(resolve, 100));
}

async function loadTest() {
  const endTime = Date.now() + duration;
  const interval = 1000 / arrivalRate;

  while (Date.now() < endTime) {
    for (let i = 0; i < arrivalRate; i++) {
      sendRequest();
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

async function main() {
  await login();
  await loadTest();
}

main();
