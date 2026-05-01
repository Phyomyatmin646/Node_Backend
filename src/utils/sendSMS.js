const twilio = require("twilio");

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);

const sendSMS = async (to, message) => {
  try {
    let formattedNumber = to;
    if (to.startsWith("09")) {
      formattedNumber = "+959" + to.substring(2);
    }

    const response = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE,
      to: formattedNumber,
    });

    console.log(
      `SMS sent successfully to ${formattedNumber}. SID: ${response.sid}`,
    );
    return response;
  } catch (err) {
    console.log(`Twilio SMS error [${err.code}]: ${err.message}`);
    throw err;
  }
};

module.exports = sendSMS;
