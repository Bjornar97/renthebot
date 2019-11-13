const tmi = require("tmi.js");
var admin = require("firebase-admin");
require("dotenv").config();
var serviceAccount = require("./adminKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://rendogtv-viewers-bot.firebaseio.com"
});

var db = admin.firestore();
const subsCollection = db.collection("subs");
const rendogtvDoc = db.collection("channels").doc("rendogtv");

let registeredArray = [];
let timeoutGoing = false;

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

console.dir(opts);

// Create a client with our options
const client = new tmi.client(opts);

// Register our event handlers (defined below)
client.on("message", onMessageHandler);
client.on("connected", onConnectedHandler);

// Connect to Twitch:
client.connect();

let first = true;
let mcnames = {};

try {
  db.collection("mcnames")
    .get()
    .then(docs => {
      docs.forEach(doc => {
        mcnames[doc.data().twitch] = doc.data().mcname;
      });
    });
} catch (error) {
  console.log("error");
}

// Called every time a message comes in
function onMessageHandler(target, context, msg, self) {
  if (first) {
    client.say(target, "/color green");
    first = false;
  }

  if (self) {
    return;
  } // Ignore messages from the bot

  const commandArray = msg.trim().split(" ");

  const commandName = commandArray[0].trim().toLowerCase();
  if (commandName.trim().split("")[0] != "!") {
    return;
  }

  // TODO: Change this to include whole message
  let argumentsArray = [];
  let argumentsText = "Any";
  if (commandArray.length > 1) {
    argumentsArray = msg.split(" ");
    argumentsArray.shift();
    argumentsText = argumentsArray.join(" ");
  }

  const displayName = context["display-name"];
  let badgeInfo = context["badge-info"];
  let months = null;
  if (badgeInfo) {
    months = badgeInfo.subscriber;
  } else {
    badgeInfo = {
      subscriber: null
    };
  }

  switch (commandName) {
    case "!here":
      if (badgeInfo.subscriber && badgeInfo.subscriber != "") {
        addSub(displayName, months, argumentsText);
      } else {
        send(target, `@${displayName} Only subs can use that command`);
      }
      break;

    case "!fight":
      if (badgeInfo.subscriber && badgeInfo.subscriber != "") {
        addSub(displayName, months, "Fight");
      } else {
        send(target, `@${displayName} Only subs can use that command`);
      }
      break;

    case "!mine":
      if (badgeInfo.subscriber && badgeInfo.subscriber != "") {
        addSub(displayName, months, "Fight");
      } else {
        send(target, `@${displayName} Only subs can use that command`);
      }
      break;

    case "!leave":
      removeSub(displayName);
      send(target, `@${displayName} You have left, and removed from the list.`);
      break;

    case "!mcname":
      setMCName(displayName, argumentsArray[0]);
      send(
        target,
        `@${displayName} Your minecraft-name "${argumentsArray[0]}" was added.`
      );
      break;

    case "!removemcname":
      removeMCName(displayName);
      send(target, `@${displayName} Your minecraft-name was removed.`);
      break;

    case "!reset":
      if (context.mod) {
        resetSubs();
        send(target, `@${displayName} Sublist has been reset.`);
      } else {
        send(target, `@${displayName} Only mods can use the command "!reset"`);
      }
      break;

    case "!remove":
      if (context.mod) {
        removeSub(argumentsArray[0]);
      } else {
        send(target, `@${displayName} Only mods can use the command "!remove"`);
      }
      break;

    case "!blameren":
      blame(target);
      break;

    case "!blamechat":
      blameChat(target);
      break;

    case "!badidea":
      badIdea(displayName);
      break;

    case "!resetblameren":
      if (context.mod) {
        resetBlameRen();
        send(target, `@${displayName} Blame Ren Count has been reset.`);
      } else {
        send(
          target,
          `@${displayName} Only mods can use the "!reset..." commands`
        );
      }
      break;

    case "!resetblamechat":
      if (context.mod) {
        resetBlameChat();
      } else {
        send(
          target,
          `@${displayName} Only mods can use the "!reset..." commands`
        );
      }
      break;

    case "!resetbadidea":
      if (context.mod) {
        resetBadIdea();
        send(target, `@${displayName} Bad Idea Count has been reset.`);
      } else {
        send(
          target,
          `@${displayName} Only mods can use the "!reset..." commands`
        );
      }

      break;

    case "!dice":
      let num = rollDice();
      if (displayName === "DTGKosh") {
        num = 6;
      }
      send(target, `@${displayName} You rolled a ${num}`);
      break;

    case "!important":
      if (context.mod) {
        addImportant(displayName, context.color, argumentsText);
        send(target, `@${displayName} The important message has been sent.`);
      } else {
        send(
          target,
          `@${displayName} Only mods can use the command "!important"`
        );
      }
      break;

    case "!removelastimportant":
      if (context.mod) {
        removeLastImportant();
        send(
          target,
          `@${displayName} Last important message from you were removed.`
        );
      } else {
        send(
          target,
          `@${displayName} Only mods can use the command "!removelastimportant"`
        );
      }
      break;

    case "!resetimportant":
      if (context.mod) {
        resetImportant();
      } else {
        send(
          target,
          `@${displayName} Only mods can use the command "!resetimportant"`
        );
      }
      break;

    case "!commands":
      send(
        target,
        `Here are the available commands for subs: 
                        | ¤ \"!here <action>\" to tell rendog you are in chat. Action is optional and can be \"fight\" or \"mine\"
                        | ¤ \"!leave\" so you dont get used
                        | ¤ "!mcname <minecraft-name>" to tell rendog your minecraft-name is different from your twitch name. MC-NAMES ARE CASE SENSITIVE!`
      );
      break;

    case "!help":
    case "!how":
      send(
        target,
        `@${displayName} To start the tutoral write "!tutorial". For a list of commands, write "!commands"`
      );
      break;

    case "!tutorial":
      if (badgeInfo.subscriber) {
        tutorial(displayName, true);
      } else {
        tutorial(displayName, false);
      }
      break;

    case "!skip":
      skipStep(displayName);
      break;

    case "!modhow":
      send(
        target,
        `Mods can use these commands: 
                    | ¤ "!reset" to delete everyone from the list, use with caution 
                    | ¤ "!remove <name>" to remove a specific user from the list (you can use @)
                    | ¤ "!important <message>" To inform rendog of something important. DO NOT ABUSE!
                    `
      );
      break;

    case "!pack":
      send(
        target,
        `@${displayName} This is FunCraft, a new modpack crafted by Iskall and his team, and creates a new way for viewers to interact with the streamer in-game, 
         get the pack here: https://www.curseforge.com/minecraft/modpacks/funcraft-fc 
         - Use "!fun" for more info.
        `
      );
      break;

    case "!sos":
    case "!sosafrica":
      send(
        target,
        `Rendog is donating 10% of donations he gets from FunCraft to SOS Africa. 
                    Check them out here: https://www.sosafrica.com/`
      );
      break;

    case "!schedule":
      send(
        target,
        "Rendog's streaming-schedule is highly irregular, sometimes he gets caught up in hermitcraft and doesnt stream, " +
          "and sometimes he streams a day which is not on his schedule.He tries however to stream Tuesdays, thursdays and sundays."
      );
      break;

    case "!site":
      send(
        target,
        "See the website where the magic happens: https://rendogtv-viewers-bot.web.app/"
      );
      break;

    default:
      console.log(`Unknown command: ${commandName}`);
      break;
  }
}

let sayQueue = [];

function send(channel, message) {
  console.log("Pushing: ");
  console.dir({ channel, message });
  sayQueue.push({ channel, message });
}

setInterval(() => {
  if (sayQueue.length != 0) {
    let messageObject = sayQueue.shift();
    console.log(
      `Saying: ${messageObject.message} in channel: ${messageObject.channel}`
    );
    client.say(messageObject.channel, messageObject.message);
  }
}, 1200);

function addSub(displayName, months, task) {
  try {
    task = task.charAt(0).toUpperCase() + task.substring(1);
    const docref = subsCollection.doc(displayName);
    docref.get().then(doc => {
      let mcname = "";
      if (displayName) {
        getMCName(displayName);
      }
      if (doc.exists) {
        docref.update({
          name: displayName,
          months: months,
          will: task,
          timestamp: Date.now(),
          mcname: mcname
        });
      } else {
        docref.set({
          name: displayName,
          months: months,
          will: task,
          selected: false,
          timestamp: Date.now(),
          mcname: mcname
        });
      }
      registered(displayName);
      done(displayName, 1);
    });
  } catch (error) {
    console.log("ERROR:");
    console.dir(error);
  }
}

function registered(displayName) {
  try {
    registeredArray.push(displayName);
    if (!timeoutGoing) {
      timeoutGoing = true;
      setTimeout(() => {
        let output = "Registered subs: ";
        registeredArray.forEach(name => {
          output += `@${name} `;
        });
        send("rendogtv", output);
        registeredArray = [];
        timeoutGoing = false;
      }, 10000);
    }
  } catch (error) {
    console.log("ERROR: ");
    console.dir(error);
  }
}

let tutorialPeople = {};
const steps = [
  `
  If your Minecraft-name is different from your twitch name, please use "!mcname your-minecraft-name".
  To skip this step, use "!skip".
  `,
  `
  To get yourself added to the list of subs, use "!here fight" if you wanna fight or "!here mine" if you wanna mine for Rendog. 
  To skip this step, use "!skip".
  `,
  `If you are leaving the stream at any point, please use the "!leave" command to remove yourself from the list. Use "!skip" to go to next step.`,
  `You are done! To see yourself on the website go to: https://rendogtv-viewers-bot.web.app/`
];

function tutorial(displayName, sub = undefined) {
  console.dir(tutorialPeople);
  console.log("Tutorial for " + displayName);
  let step = 0;
  const person = tutorialPeople[displayName];
  console.dir(person);
  if (person) {
    step = person.step;
    sub = person.sub;
  } else {
    tutorialPeople[displayName] = {
      step: 0,
      sub: sub
    };
  }

  console.log("Step: " + step);
  console.dir(tutorialPeople[displayName]);

  if (!sub && step === 1) step = 2;

  send("rendogtv", `@${displayName} ${steps[step]}`);

  if (tutorialPeople[displayName].step >= steps.length) {
    delete tutorialPeople[displayName];
  } else {
    tutorialPeople[displayName].step += 1;
  }
}

function skipStep(displayName) {
  if (tutorialPeople[displayName]) {
    tutorial(displayName);
  }
}

function done(displayName, step) {
  if (tutorialPeople[displayName]) {
    if (tutorialPeople[displayName].step === step + 1) {
      tutorial(displayName);
    }
  }
}

function removeSub(name) {
  subsCollection.doc(name).delete();
}

function resetSubs() {
  try {
    db.collection("subs")
      .get()
      .then(snapshot => {
        snapshot.docs.forEach(doc => {
          db.collection("subs")
            .doc(doc.id)
            .delete();
        });
      });
  } catch (error) {
    console.log("ERROR: ");
    console.dir(error);
  }
}

function addImportant(displayName, color, message) {
  try {
    db.collection("important").add({
      from: `@${displayName}`,
      color: color,
      text: message,
      timestamp: Date.now()
    });
    console.log("Important message recieved");
  } catch (error) {
    console.log("ERROR: ");
    console.dir(error);
  }
}

function removeLastImportant(displayName) {
  try {
    db.collection("important")
      .where("from", "==", `@${displayName}`)
      .orderBy("timestamp", "desc")
      .get()
      .then(snapshot => {
        if (snapshot.docs.length != 0) {
          snapshot.docs[0].ref.delete();
        }
      });
  } catch (error) {
    console.log("ERROR: ");
    console.dir(error);
  }
}

function resetImportant() {
  try {
    db.collection("important")
      .get()
      .then(docs => {
        docs.forEach(doc => {
          doc.ref.delete();
        });
      });
  } catch (error) {
    console.log("ERROR: ");
    console.dir(error);
  }
}

async function blame(channelName) {
  console.log("Going into blameren");
  try {
    let doc = await rendogtvDoc.get();
    send(channelName, `${doc.data().blame + 1} has blamed Rendog!`);
    rendogtvDoc.update({ blame: admin.firestore.FieldValue.increment(1) });
  } catch (error) {
    console.log("ERROR: ");
    console.dir(error);
  }
}

async function blameChat(channelName) {
  try {
    let doc = await rendogtvDoc.get();
    send(channelName, `${doc.data().blameChat + 1} has blamed chat!`);
    rendogtvDoc.update({ blameChat: admin.firestore.FieldValue.increment(1) });
  } catch (error) {
    console.log("ERROR: ");
    console.dir(error);
  }
}

async function badIdea(channelName) {
  console.log("Going into badidea");
  try {
    const doc = await rendogtvDoc.get();
    send(channelName, `${doc.data().badIdea + 1} think that is a bad idea.`);
    rendogtvDoc.update({ badIdea: admin.firestore.FieldValue.increment(1) });
  } catch (error) {
    console.log("ERROR: ");
    console.dir(error);
  }
}

function resetBlameRen() {
  blamers = [];
  db.collection("channels")
    .doc("rendogtv")
    .update({ blame: 0 });
}

function resetBadIdea() {
  badIdeers = [];
  db.collection("channels")
    .doc("rendogtv")
    .update({ badIdea: 0 });
}

const MCNamesCollection = db.collection("mcnames");

function setMCName(displayName, MCName) {
  MCNamesCollection.doc(displayName).set({
    twitch: displayName,
    mcname: MCName
  });
  updateSubMCName(displayName, MCName);
  setTimeout(() => {
    done(displayName, 0);
  }, 500);
}

function updateSubMCName(displayName, MCName) {
  subsCollection.doc(displayName).update({ mcname: MCName });
}

async function getMCName(displayName) {
  const doc = await MCNamesCollection.doc(displayName).get();
  return doc.data().mcname;
}

function removeMCName(displayName) {
  MCNamesCollection.doc(displayName).delete();
  subsCollection.doc(displayName).update({ mcname: null });
}

function rollDice() {
  const sides = 6;
  return Math.floor(Math.random() * sides) + 1;
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler(addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
}
