import say from "./say.js";
import commands from "./utilities/commands.js";
import poll from "./Strawpolls/poll.js";
import stringTools from "./utilities/strings";
import client from "./main.js";

export default async function WhisperHandler(username, user, message, self) {
  if (self) {
    return;
  }

  console.log("Got whisper");

  const displayName = user["display-name"];

  // Splitting the message into an array of words
  const commandArray = message.trim().split(" ");

  const msgLower = message.toLowerCase();

  // Checking if the first letter is !, if not, returns
  let commandName = commandArray[0].trim().toLowerCase();
  if (!stringTools.hasFirstLetter(commandName, "!")) return;

  // Make it work if they have a space between ! and the commandname, mobile automatically make that space
  if (commandName === "!") commandName = "!" + commandArray[1];

  let argumentsArray = [];
  let argumentsText = "Any";
  if (commandArray.length > 1) {
    argumentsText = stringTools.removeFirstWord(message);
    argumentsArray = message.split(" ");
    argumentsArray.shift();
  }

  let auth;
  let response = "";

  switch (commandName) {
    case "!vote":
      auth = commands.auth(
        "vote",
        displayName,
        user.mod,
        user.subscriber,
        user["id"]
      );
      if (auth.access) response = await poll.vote(displayName, argumentsText.trim());
      else if (auth.message) response = auth.message;
      break;

    default:
      break;
  }
  console.log("Trying to respond");
  client.whisper(username, "Your message");
}
