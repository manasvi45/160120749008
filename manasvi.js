const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

let clientID = "";
let clientSecret = "";
let authorizationToken = "";

app.post("/train/register", async (req, res) => {
  const registrationData = req.body;

  try {
    const registrationResponse = await axios.post(
      "http://20.244.56.144/train/register",
      registrationData
    );

    clientID = registrationResponse.data.clientID;
    clientSecret = registrationResponse.data.clientSecret;
    companyName = registrationData.companyName;
    ownerName = registrationData.ownerName;
    ownerEmail = registrationData.ownerEmail;
    rollNo = registrationData.rollNo;

    const authResponse = await axios.post("http://20.244.56.144/train/auth", {
      companyName,
      ownerName,
      ownerEmail,
      rollNo,
      clientID,
      clientSecret,
    });

    authorizationToken = authResponse.data.access_token;
    console.log("Authorization successful:", authorizationToken);

    res.json({ message: "Registration and authorization successful" });
  } catch (error) {
    console.error("Registration or Authorization error:", error);
    res.status(500).json({ error: "Registration or Authorization error" });
  }
});

app.get("/train/trains", async (req, res) => {
  try {
    const trainDataResponse = await axios.get(
      "http://20.244.56.144/train/trains",
      {
        headers: {
          Authorization: `Bearer ${authorizationToken}`,
        },
      }
    );

    const processedTrainData = processTrainData(trainDataResponse.data);

    res.json(processedTrainData);
  } catch (error) {
    console.error("Error fetching train data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

function processTrainData(rawData) {
  const currentTime = new Date();
  const twelveHoursLater = new Date();
  twelveHoursLater.setHours(currentTime.getHours() + 12);

  const filteredTrains = rawData.filter((train) => {
    const departureTime = new Date(train.departureTime);
    return departureTime > currentTime && departureTime <= twelveHoursLater;
  });

  const processedData = filteredTrains.map((train) => {
    const { trainNumber, departureTime, seatAvailability, pricing } = train;

    return {
      trainNumber,
      departureTime,
      seatAvailability: {
        sleeper: seatAvailability.sleeper,
        AC: seatAvailability.AC,
      },
      pricing: {
        sleeper: pricing.sleeper,
        AC: pricing.AC,
      },
    };
  });

  return processedData;
}

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});