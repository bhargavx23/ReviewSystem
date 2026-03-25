require("dotenv").config({ path: __dirname + "/.env" });
const { sendOtpEmail } = require("./utils/email");

(async () => {
  try {
    const ok = await sendOtpEmail(
      "hemaswarupbande5@gmail.com",
      Math.floor(100000 + Math.random() * 900000).toString(),
    );
    console.log("sendOtpEmail returned:", ok);
  } catch (err) {
    console.error("sendOtpEmail error:", err);
  }
})();
