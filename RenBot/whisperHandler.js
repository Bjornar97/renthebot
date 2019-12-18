import say from "./say.js";

export default function WhisperHandler(username, user, message, self) {
  if (self) {
    return;
  }

  // Splitting the message into an array of words
  const commandArray = message.trim().split(" ");

  // Checking if the first letter is !, if not, returns
  const commandName = commandArray[0].trim().toLowerCase();
  if (commandName.trim().split("")[0] != "!") {
    return;
  }

  switch (commandName) {
    case "!mods":
    case "!mod":
    case "!modhelp":
      say(username, "Mods!");
      break;

    default:
      break;
  }
}
