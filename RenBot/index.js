import chatSpeed from "./ChatSpeed/speed";
import admin from "firebase-admin";
const serviceAccount = require("../adminKey.json");

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://rendogtv-viewers-bot.firebaseio.com"
  });
} catch (error) {}

import tmi from "tmi.js";
require("dotenv").config();

// Define configuration options
const opts = {
  identity: {
    username: process.env.BOT_USERNAME,
    password: process.env.OAUTH_TOKEN
  },
  connection: {
    secure: false,
    reconnect: true
  },
  channels: [process.env.CHANNEL_NAME]
};

// Create a client with our options
const client = new tmi.client(opts);
export default client;

console.log("Created Client");

import ChatHandler from "./chatHandler";
import WhisperHandler from "./whisperHandler";

client.on("chat", ChatHandler);
client.on("whisper", WhisperHandler);
client.on("slowmode", chatSpeed.slowModeUpdate);

// Connect to Twitch:
client.connect();
