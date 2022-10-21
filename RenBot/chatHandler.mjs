import say from "./say.mjs";
import chatSpeed from "./ChatSpeed/speed.mjs";
import stringTools from "./utilities/strings.mjs";
import info from "./StreamInfo/info.mjs";
import McName from "./McNames/McName.mjs";
import commands from "./utilities/commands.mjs";
import dice from "./ChatFun/dice.mjs";
import blame from "./ChatFun/blames.mjs";
import line from "./ChatFun/line.mjs";
import counts from "./ChatFun/counts.mjs";
import suggestion from "./ChatInteractions/suggestion.mjs";
import beverage from "./ChatFun/beverage.mjs";
import poll from "./Strawpolls/poll.mjs";
import strings from "./utilities/strings.mjs";
import activeFeatures from "./utilities/activeFeatures.mjs";
import timer from "./Timer/timer.mjs";
import client from "./main.mjs";
import users from "./utilities/users.mjs";
import botManagement from "./utilities/botManagement.mjs";
import modtools from "./ChatModeration/modtools.mjs";
import streamday from "./HermitCraft/streamday.mjs";
import countermeasures from "./ChatModeration/botCountermeasures.mjs";
import charityStream from "./CharityStream/charityStream.mjs";

let first = true;
let allowMessages = true;

let isTellingToWhisper = false;

export default async function ChatHandler(channel, user, message, self) {
  chatSpeed.newMessage();
  if (self || !allowMessages) {
    return;
  }

  let response = null;

  if (first) {
    say(channel, "/color Firebrick");
    first = false;
  }

  const displayName = user["display-name"];

  // Splitting the message into an array of words
  const commandArray = message.trim().split(" ");

  const msgLower = message.toLowerCase();

  // ChatInteractions.smartResponse(msgLower, displayName);

  // Countermeasures against bots, exception for mods and subscribers to save computing time and ram usage
  if (!user.mod && !user.subscriber) {
    countermeasures.addMessage(message, user.username);
  }

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

  let targetName;
  let badgeInfo = user["badge-info"];
  let months = null;
  if (badgeInfo) {
    months = badgeInfo.subscriber;
  } else {
    badgeInfo = {
      subscriber: null,
    };
  }

  const targetString = argumentsArray[0];

  if (argumentsArray[0]) {
    targetName = stringTools.removeFirstSymbol(targetString, "@");
  }

  let customMatch = true;

  let auth;

  // Custom commands
  switch (commandName) {
    case "!mcname":
      auth = commands.auth(
        "mcname",
        displayName,
        user.mod,
        user.subscriber,
        user["id"]
      );
      if (auth.access)
        response = McName.setMCName(displayName, argumentsArray[0]);
      else if (auth.message) response = auth.message;
      break;

    case "!removemcname":
      auth = commands.auth(
        "removemcname",
        displayName,
        user.mod,
        user.subscriber,
        user["id"]
      );
      if (auth.access) response = McName.removeMCName(displayName);
      else if (auth.message) response = auth.message;
      break;

    case "!blameren":
      auth = commands.auth(
        "blameren",
        displayName,
        user.mod,
        user.subscriber,
        user["id"]
      );
      if (auth.access) response = await blame.blameRen();
      else if (auth.message) response = auth.message;
      break;

    case "!blamechat":
      auth = commands.auth(
        "blamechat",
        displayName,
        user.mod,
        user.subscriber,
        user["id"]
      );
      if (auth.access) response = await blame.blameChat();
      else if (auth.message) response = auth.message;
      break;

    case "!badidea":
      auth = commands.auth(
        "badidea",
        displayName,
        user.mod,
        user.subscriber,
        user["id"]
      );
      if (auth.access) response = await blame.badIdea();
      else if (auth.message) response = auth.message;
      break;

    case "!resetblameren":
      auth = commands.auth(
        "resetblameren",
        displayName,
        user.mod,
        user.subscriber,
        user["id"]
      );
      if (auth.access) response = blame.resetBlameRen();
      else if (auth.message) response = auth.message;
      break;

    case "!resetblamechat":
      auth = commands.auth(
        "resetblamechat",
        displayName,
        user.mod,
        user.subscriber,
        user["id"]
      );
      if (auth.access) response = blame.resetBlameChat();
      else if (auth.message) response = auth.message;
      break;

    case "!resetbadidea":
      auth = commands.auth(
        "resetbadidea",
        displayName,
        user.mod,
        user.subscriber,
        user["id"]
      );
      if (auth.access) response = blame.resetBadIdea();
      else if (auth.message) response = auth.message;
      break;

    case "!inline":
      auth = commands.auth(
        "inline",
        displayName,
        user.mod,
        user.subscriber,
        user["id"]
      );
      if (auth.access) response = line.addToLine(displayName);
      else if (auth.message) response = auth.message;
      break;

    case "!outofline":
      auth = commands.auth(
        "outofline",
        displayName,
        user.mod,
        user.subscriber,
        user["id"]
      );
      if (auth.access) response = line.removeFromLine(displayName);
      else if (auth.message) response = auth.message;
      break;

    case "!line":
      auth = commands.auth(
        "line",
        displayName,
        user.mod,
        user.subscriber,
        user["id"]
      );
      if (auth.access) response = await line.printLine();
      else if (auth.message) response = auth.message;
      break;

    case "!suggestion":
      auth = commands.auth(
        "suggestion",
        displayName,
        user.mod,
        user.subscriber,
        user["id"]
      );
      console.dir(auth);
      if (auth.access)
        response = await suggestion.suggestion(argumentsArray, displayName);
      else if (auth.message) response = auth.message;
      break;

    case "!dice":
      auth = commands.auth(
        "dice",
        displayName,
        user.mod,
        user.subscriber,
        user["id"]
      );
      if (auth.access) response = await dice.rollDice(displayName);
      else if (auth.message) response = auth.message;
      break;

    case "!setcooldown":
      auth = commands.auth(
        "setcooldown",
        displayName,
        user.mod,
        user.subscriber,
        user["id"]
      );
      if (auth.access)
        response = commands.setCooldown(argumentsArray[0], argumentsArray[1]);
      else if (auth.message) response = auth.message;
      break;

    case "!enable":
      auth = commands.auth(
        "enable",
        displayName,
        user.mod,
        user.subscriber,
        user["id"]
      );
      if (auth.access)
        response = commands.enableCommand(displayName, targetName);
      else if (auth.message) response = auth.message;
      break;

    case "!disable":
      auth = commands.auth(
        "disable",
        displayName,
        user.mod,
        user.subscriber,
        user["id"]
      );
      if (auth.access)
        response = commands.disableCommand(displayName, targetName);
      else if (auth.message) response = auth.message;
      break;

    case "!enablefeature":
      auth = commands.auth(
        "enablefeature",
        displayName,
        user.mod,
        user.subscriber,
        user["id"]
      );
      if (auth.access)
        response = activeFeatures.enableFeature(displayName, targetName);
      else if (auth.message) response = auth.message;
      break;

    case "!disablefeature":
      auth = commands.auth(
        "disablefeature",
        displayName,
        user.mod,
        user.subscriber,
        user["id"]
      );
      if (auth.access)
        response = activeFeatures.disableFeature(displayName, targetName);
      else if (auth.message) response = auth.message;
      break;

    case "!timer":
      auth = commands.auth(
        "timer",
        displayName,
        user.mod,
        user.subscriber,
        user["id"]
      );
      if (auth.access) response = timer.timer(argumentsArray);
      else if (auth.message) response = auth.message;
      break;

    case "!beverage":
      auth = commands.auth(
        "beverage",
        displayName,
        user.mod,
        user.subscriber,
        user["id"]
      );
      if (auth.access)
        response = beverage.beverage(displayName, targetName, argumentsArray);
      else if (auth.message) response = auth.message;
      break;

    case "!vote":
      if (!isTellingToWhisper) {
        isTellingToWhisper = true;
        // setTimeout(() => {
        //   isTellingToWhisper = false;
        //   say(
        //     channel,
        //     "IMPORTANT!: VOTE BY WHISPERING TO ME! DO NOT USE !vote IN CHAT!"
        //   );
        // }, 5000);
      }
      users.deleteMessage(user["id"]);
      break;

    case "!poll":
      auth = commands.auth(
        "poll",
        displayName,
        user.mod,
        user.subscriber,
        user["id"]
      );
      if (auth.access) response = poll.getPoll(displayName);
      else if (auth.message) response = auth.message;
      break;

    case "!pollurl":
      auth = commands.auth(
        "pollurl",
        displayName,
        user.mod,
        user.subscriber,
        user["id"]
      );
      if (auth.access) response = poll.getPollURL(displayName);
      else if (auth.message) response = auth.message;
      break;

    case "!commands":
      auth = commands.auth(
        "commands",
        displayName,
        user.mod,
        user.subscriber,
        user["id"]
      );
      if (auth.access) response = commands.getCommands(user.username);
      else if (auth.message) response = auth.message;
      break;

    case "!modhow":
    case "!mod":
    case "!mods":
      // TODO: Call function to send commands by whisper if approved by twitch
      break;

    case "!info":
      auth = commands.auth(
        "info",
        displayName,
        user.mod,
        user.subscriber,
        user["id"]
      );
      if (auth.access) {
        const information = info.getInfo();
        if (information.live) {
          response = `We are live and playing ${information.type}. To see the commands available for this stream, use !commands`;
        } else {
          response = `The stream is currently offline.`;
        }
      }
      break;

    case "!butt":
      auth = commands.auth(
        "butt",
        displayName,
        user.mod,
        user.subscriber,
        user["id"]
      );
      if (auth.access) response = await counts.butt();
      else if (auth.message) response = auth.message;
      break;

    case "!resetbutt":
      auth = commands.auth(
        "butt",
        displayName,
        user.mod,
        user.subscriber,
        user["id"]
      );
      if (auth.access) response = await counts.resetButt();
      else if (auth.message) response = auth.message;
      break;

    case "!onemore":
      auth = commands.auth(
        "onemore",
        displayName,
        user.mod,
        user.subscriber,
        user["id"]
      );
      if (auth.access) response = await counts.onemore();
      else if (auth.message) response = auth.message;
      break;

    case "!resetonemore":
      auth = commands.auth(
        "onemore",
        displayName,
        user.mod,
        user.subscriber,
        user["id"]
      );
      if (auth.access) response = await counts.resetOnemore();
      else if (auth.message) response = auth.message;
      break;

    case "!punishlist":
      auth = commands.auth(
        "punishlist",
        displayName,
        user.mod,
        user.subscriber,
        user["id"]
      );
      if (auth.access) response = modtools.listPunishments();
      else if (auth.message) response = auth.message;
      break;

    case "!reset":
      auth = commands.auth(
        "reset",
        displayName,
        user.mod,
        user.subscriber,
        user["id"]
      );
      console.log(auth);
      if (auth.access) response = modtools.wipePoints(targetName);
      else if (auth.message) response = auth.message;

      console.log(response);
      break;

    case "!caps":
      auth = commands.auth(
        "caps",
        displayName,
        user.mod,
        user.subscriber,
        user["id"]
      );
      if (auth.access)
        response = await modtools.punishment("caps", targetName, user["id"]);
      else if (auth.message) response = auth.message;
      break;

    case "!lang":
      auth = commands.auth(
        "lang",
        displayName,
        user.mod,
        user.subscriber,
        user["id"]
      );
      if (auth.access)
        response = await modtools.punishment("lang", targetName, user["id"]);
      else if (auth.message) response = auth.message;
      break;

    case "!gib":
      auth = commands.auth(
        "gib",
        displayName,
        user.mod,
        user.subscriber,
        user["id"]
      );
      if (auth.access)
        response = await modtools.punishment("gib", targetName, user["id"]);
      else if (auth.message) response = auth.message;
      break;

    case "!repeat":
      auth = commands.auth(
        "repeat",
        displayName,
        user.mod,
        user.subscriber,
        user["id"]
      );
      if (auth.access)
        response = await modtools.punishment("repeat", targetName, user["id"]);
      else if (auth.message) response = auth.message;
      break;

    case "!topic":
      auth = commands.auth(
        "topic",
        displayName,
        user.mod,
        user.subscriber,
        user["id"]
      );
      if (auth.access)
        response = await modtools.punishment("topic", targetName, user["id"]);
      else if (auth.message) response = auth.message;
      break;

    case "!badw":
      auth = commands.auth(
        "badw",
        displayName,
        user.mod,
        user.subscriber,
        user["id"]
      );
      if (auth.access)
        response = await modtools.punishment("badw", targetName, user["id"]);
      else if (auth.message) response = auth.message;
      break;

    case "!beg":
      auth = commands.auth(
        "beg",
        displayName,
        user.mod,
        user.subscriber,
        user["id"]
      );
      if (auth.access)
        response = await modtools.punishment("beg", targetName, user["id"]);
      else if (auth.message) response = auth.message;
      break;

    case "!next":
      auth = commands.auth(
        "next",
        displayName,
        user.mod,
        user.subscriber,
        user["id"]
      );
      if (auth.access) response = await streamday.getNextStreamer();
      else if (auth.message) response = auth.message;
      break;

    case "!reload":
      auth = commands.auth(
        "restart",
        displayName,
        user.mod,
        user.subscriber,
        user["id"]
      );
      if (auth.access) {
        activeFeatures.restartListner();
        response = commands.restartListner();
      } else if (auth.message) response = auth.message;
      break;

    case "!restart":
      if (!user.mod) break;
      allowMessages = false;
      botManagement.restart();
      break;

    case "!token":
      auth = commands.auth(
        "token",
        displayName,
        user.mod,
        user.subscriber,
        user["id"]
      );
      if (auth.access) await modtools.getToken(user.username);
      else if (auth.message) response = auth.message;
      break;

    case "!testsheets":
      auth = commands.auth(
        "testsheets",
        displayName,
        user.mod,
        user.subscriber,
        user["id"]
      );
      if (auth.access) response = await charityStream.test();
      else if (auth.message) response = auth.message;
      break;

    case "!testdonation":
      auth = commands.auth(
        "testdonation",
        displayName,
        user.mod,
        user.subscriber,
        user["id"]
      );
      if (auth.access) response = await charityStream.testDonations();
      else if (auth.message) response = auth.message;
      break;

    default:
      customMatch = false;
      break;
  }

  if (!customMatch) {
    // Static commands
    const nameCommand = strings.removeFirstSymbol(commandName, "!");
    const commandObject = commands.getStaticCommand(nameCommand);
    if (commandObject !== null) {
      auth = commands.auth(
        nameCommand,
        displayName,
        user.mod,
        user.subscriber,
        user["id"]
      );
      if (auth.access) {
        if (commandObject.displayName || targetName) {
          if (targetName) {
            if (targetName !== "-a") {
              response = `@${targetName} ${commandObject.response}`;
            } else {
              response = commandObject.response;
            }
          } else {
            response = `@${displayName} ${commandObject.response}`;
          }
        } else {
          response = commandObject.response;
        }
      } else if (auth.message) response = auth.message;
    }
  }

  if (response) {
    response = response.replace("{user}", `@${displayName}`);
    say(channel, response);
  }
}
