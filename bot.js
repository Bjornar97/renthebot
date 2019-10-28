const tmi = require("tmi.js");
var admin = require('firebase-admin');
require("dotenv").config();

var serviceAccount = require("./adminKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://rendogtv-viewers-bot.firebaseio.com"
});

var db = admin.firestore();

let registeredArray = [];
let timeoutGoing = false;

// Define configuration options

const opts = {
  identity: {
    username: process.env.BOT_USERNAME,
    password: process.env.OAUTH_TOKEN
  },
  channels: [process.env.CHANNEL_NAME]
};

// Create a client with our options
const client = new tmi.client(opts);

// Register our event handlers (defined below)
client.on("message", onMessageHandler);
client.on("connected", onConnectedHandler);

// Connect to Twitch:
client.connect();

let first = true;

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

  let commandText = "Any";
  if (commandArray.length > 1) {
    commandText = commandArray[1].trim();
  }

  // If the command is known, let's execute it
  if (commandName === "!here") {
    if (context.subscriber) {
      if (context["badge-info"].subscriber && context["badge-info"].subscriber != "") {
        const docref = db.collection("subs").doc(context["display-name"]);
        docref.get().then((doc) => {
          if (doc.exists) {
            docref.update({
              name: context["display-name"],
              months: context["badge-info"].subscriber,
              will: commandText.charAt(0).toUpperCase() + commandText.substring(1),
              timestamp: admin.firestore.Timestamp.fromDate(new Date())
            });
          } else {
            docref.set({
              name: context["display-name"],
              months: context["badge-info"].subscriber,
              will: commandText.charAt(0).toUpperCase() + commandText.substring(1),
              selected: false,
              timestamp: admin.firestore.Timestamp.fromDate(new Date())
            });
          }
        })

        registeredArray.push(context["display-name"]);
      }

      if (!timeoutGoing) {
        timeoutGoing = true;
        setTimeout(() => {
          let output = "Registered names: ";
          let usedNames = [];
          registeredArray.forEach(name => {
            if (!usedNames.includes(name)) {
              output += `@${name} `;
              usedNames.push(name);
            }
          });
          client.say(target, output);
          registeredArray = [];
          setTimeout(() => {
            client.say(target, "If you should be in the list, but arent, please run the command again.");
          }, 2000);
        }, 10000);
      }
    }
    console.log(`* Executed ${commandName} command`);
  } else if (commandName === "!leave") {
    db.collection("subs").doc(name).delete();
  } else if (commandName === "!reset") {
    if (context.mod) {
      db.collection("subs").get().then((snapshot) => {
        snapshot.docs.forEach((doc) => {
          db.collection("subs").doc(doc.id).delete();
        });
      })
      client.say(target, "Reset registered");
    } else {
      client.say(target, `@${context["display-name"]} You are not a mod, and does not have access to that command`);
    }
  } else if (commandName === "!remove") {
    if (!context.mod) {
      client.say(`@${name} You are not a mod, and cannot use this command. To remove yourselft use !leave`);
    } else {
      let selectName = commandArray[1];
      if (selectName.split("")[0] == "@") {
        selectName = commandArray[1].substring(1);
      }

      db.collection("subs").doc(selectName).delete();
      client.say(`Deleted ${selectName}`);
    }
  } else if (commandName === "!dice") {
    const num = rollDice();
    client.say(target, `@${context["display-name"]} You rolled a ${num}`);
  } else if (commandName === "!how") {
    client.say(target, `I have 3 commands: ¤ \"!here <action>\" to tell rendog you are in his sack and chat. Action is optional and can be \"fight\", \"cauldron\" or \"mine\". 
                        You need to be a subscriber to use this command | ¤ \"!leave\" to remove yourself from the list so you dont get used ¤ \"!dice\" to roll a dice and see what you get `);
  } else if (commandName === "!modhow") {
    client.say(`Mods can use these commands: ¤ "!reset" to delete everyone from the list, use with caution | ¤ "!remove <name>" to remove a specific user from the list, you can use @`);
  } else {
    console.log(`* Unknown command ${commandName}`);
  } 
}

function rollDice () {
  const sides = 6;
  return Math.floor(Math.random() * sides) + 1;
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler(addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
}
