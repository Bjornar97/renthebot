import say from "./say.js";
import chatSpeed from "./ChatSpeed/speed";
import stringTools from "./utilities/strings";
import info from "./StreamInfo/info";
import subList from "./SubList/subList";
import McName from "./McNames/McName";
import commands from "./utilities/commands";
import dice from "./ChatFun/dice";
import blame from "./ChatFun/blames";
import line from "./ChatFun/line";
import beverage from "./ChatFun/beverage";
import poll from "./Strawpolls/poll";
import strings from "./utilities/strings";
import activeFeatures from "./utilities/activeFeatures.js";

let first = true;

export default async function ChatHandler(channel, user, message, self) {
  chatSpeed.newMessage();
  if (self) {
    return;
  }

  if (first) {
    say(channel, "/color Firebrick");
    first = false;
  }

  // Splitting the message into an array of words
  const commandArray = message.trim().split(" ");

  // Checking if the first letter is !, if not, returns
  const commandName = commandArray[0].trim().toLowerCase();
  if (!stringTools.hasFirstLetter(commandName, "!")) return;

  let argumentsArray = [];
  let argumentsText = "Any";
  if (commandArray.length > 1) {
    argumentsText = stringTools.removeFirstWord(message);
    argumentsArray = message.split(" ");
    argumentsArray.shift();
  }

  const displayName = user["display-name"];
  let targetName;
  let badgeInfo = user["badge-info"];
  let months = null;
  if (badgeInfo) {
    months = badgeInfo.subscriber;
  } else {
    badgeInfo = {
      subscriber: null
    };
  }

  const targetString = argumentsArray[0];

  if (argumentsArray[0]) {
    targetName = stringTools.removeFirstSymbol(targetString, "@");
  }

  let customMatch = true;

  let response = null;

  let auth;

  // Custom commands
  switch (commandName) {
    case "!here":
      auth = commands.auth("here", displayName, user.mod, user.subscriber);
      if (auth.access) subList.addSub(displayName, months, argumentsArray[0]);
      else if (auth.message) response = auth.message;
      break;

    case "!fight":
      auth = commands.auth("fight", displayName, user.mod, user.subscriber);
      if (auth.access) subList.addSub(displayName, months, "Fight");
      else if (auth.message) response = auth.message;
      break;

    case "!mine":
      auth = commands.auth("mine", displayName, user.mod, user.subscriber);
      if (auth.access) subList.addSub(displayName, months, "Mine");
      else if (auth.message) response = auth.message;
      break;

    case "!leave":
      auth = commands.auth("leave", displayName, user.mod, user.subscriber);
      if (auth.access) subList.removeSub(displayName);
      else if (auth.message) response = auth.message;
      break;

    case "!mcname":
      auth = commands.auth("mcname", displayName, user.mod, user.subscriber);
      if (auth.access)
        response = McName.setMCName(displayName, argumentsArray[0]);
      else if (auth.message) response = auth.message;
      break;

    case "!removemcname":
      auth = commands.auth(
        "removemcname",
        displayName,
        user.mod,
        user.subscriber
      );
      if (auth.access) response = McName.removeMCName(displayName);
      else if (auth.message) response = auth.message;
      break;

    case "!reset":
      auth = commands.auth("reset", displayName, user.mod, user.subscriber);
      if (auth.access) response = subList.resetSubList();
      else if (auth.message) response = auth.message;
      break;

    case "!remove":
      auth = commands.auth("remove", displayName, user.mod, user.subscriber);
      if (auth.access) response = subList.removeSub(displayName);
      else if (auth.message) response = auth.message;
      break;

    case "!blameren":
      auth = commands.auth("blameren", displayName, user.mod, user.subscriber);
      if (auth.access) response = await blame.blameRen();
      else if (auth.message) response = auth.message;
      break;

    case "!blamechat":
      auth = commands.auth("blamechat", displayName, user.mod, user.subscriber);
      if (auth.access) response = await blame.blameChat();
      else if (auth.message) response = auth.message;
      break;

    case "!badidea":
      auth = commands.auth("badidea", displayName, user.mod, user.subscriber);
      if (auth.access) response = await blame.badIdea();
      else if (auth.message) response = auth.message;
      break;

    case "!resetblameren":
      auth = commands.auth(
        "resetblameren",
        displayName,
        user.mod,
        user.subscriber
      );
      if (auth.access) response = blame.resetBlameRen();
      else if (auth.message) response = auth.message;
      break;

    case "!resetblamechat":
      auth = commands.auth(
        "resetblamechat",
        displayName,
        user.mod,
        user.subscriber
      );
      if (auth.access) response = blame.resetBlameChat();
      else if (auth.message) response = auth.message;
      break;

    case "!resetbadidea":
      auth = commands.auth(
        "resetbadidea",
        displayName,
        user.mod,
        user.subscriber
      );
      if (auth.access) response = blame.resetBadIdea();
      else if (auth.message) response = auth.message;
      break;

    case "!inline":
      auth = commands.auth("inline", displayName, user.mod, user.subscriber);
      if (auth.access) response = line.addToLine(displayName);
      else if (auth.message) response = auth.message;
      break;

    case "!outofline":
      auth = commands.auth("outofline", displayName, user.mod, user.subscriber);
      if (auth.access) response = line.removeFromLine(displayName);
      else if (auth.message) response = auth.message;
      break;

    case "!line":
      auth = commands.auth("line", displayName, user.mod, user.subscriber);
      if (auth.access) response = await line.printLine();
      else if (auth.message) response = auth.message;
      break;

    case "!dice":
      auth = commands.auth("dice", displayName, user.mod, user.subscriber);
      if (auth.access) response = await dice.rollDice(displayName);
      else if (auth.message) response = auth.message;
      break;

    case "!setcooldown":
      auth = commands.auth(
        "setcooldown",
        displayName,
        user.mod,
        user.subscriber
      );
      if (auth.access)
        response = commands.setCooldown(argumentsArray[0], argumentsArray[1]);
      else if (auth.message) response = auth.message;
      break;

    case "!enable":
      auth = commands.auth("enable", displayName, user.mod, user.subscriber);
      if (auth.access)
        response = commands.enableCommand(displayName, targetName);
      else if (auth.message) response = auth.message;
      break;

    case "!disable":
      auth = commands.auth("disable", displayName, user.mod, user.subscriber);
      if (auth.access)
        response = commands.disableCommand(displayName, targetName);
      else if (auth.message) response = auth.message;
      break;

    case "!beverage":
      auth = commands.auth("beverage", displayName, user.mod, user.subscriber);
      if (auth.access)
        response = beverage.beverage(displayName, targetName, argumentsArray);
      else if (auth.message) response = auth.message;
      break;

    case "!vote":
      auth = commands.auth("vote", displayName, user.mod, user.subscriber);
      if (auth.access) response = poll.vote(displayName, argumentsText.trim());
      else if (auth.message) response = auth.message;
      break;

    case "!poll":
      auth = commands.auth("poll", displayName, user.mod, user.subscriber);
      if (auth.access) response = poll.getPoll(displayName);
      else if (auth.message) response = auth.message;
      break;

    case "!pollurl":
      auth = commands.auth("pollurl", displayName, user.mod, user.subscriber);
      if (auth.access) response = poll.getPollURL(displayName);
      else if (auth.message) response = auth.message;
      break;

    case "!commands":
      auth = commands.auth("commands", displayName, user.mod, user.subscriber);
      if (auth.access) response = commands.getCommands();
      else if (auth.message) response = auth.message;
      break;

    case "!modhow":
    case "!mod":
    case "!mods":
      // TODO: Call function to send commands by whisper if approved by twitch
      break;

    case "!timer":
      // TODO: Call function for timer
      break;
    case "!info":
      const information = info.getInfo();
      if (information.live) {
        response = `We are live and playing ${information.type}. To see the commands available for this stream, use !commands`;
      } else {
        response = `The stream is currently offline.`;
      }
      break;

    case "!restart":
      auth = commands.auth("restart", displayName, user.mod, user.subscriber);
      if (auth.access) {
        activeFeatures.restartListner();
        response = commands.restartListner();
      } else if (auth.message) response = auth.message;
      break;

    default:
      customMatch = false;
      break;
  }

  if (!customMatch) {
    // Static commands
    // TODO: Implement this through firestore
    const nameCommand = strings.removeFirstSymbol(commandName, "!");
    const commandObject = commands.getStaticCommand(nameCommand);
    if (commandObject !== null) {
      auth = commands.auth(nameCommand, displayName, user.mod, user.subscriber);
      if (auth.access) {
        if (commandObject.displayName) {
          if (targetName) {
            response = `@${targetName} ${commandObject.response}`;
          } else {
            response = `@${displayName} ${commandObject.response}`;
          }
        } else {
          response = commandObject.response;
        }
      } else if (auth.message) response = auth.message;
    }
  }

  if (response !== null) {
    say(channel, response);
  }
}
