("use strict");
const tmi = require("tmi.js");
var admin = require("firebase-admin");
require("dotenv").config();
const fs = require("fs");
var serviceAccount = require("./adminKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://rendogtv-viewers-bot.firebaseio.com"
});

const express = require("express");

// Constants
const PORT = 8085;
const HOST = "0.0.0.0";

// App
const app = express();
app.get("/", (req, res) => {
  res.send("The bot is running\n");
});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);

var db = admin.firestore();

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

let blameRenCount = 0;
let badIdeaCount = 0;

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

  let commandText = "Any";
  if (commandArray.length > 1) {
    commandText = commandArray[1].trim();
  }

  // If the command is known, let's execute it
  if (commandName === "!here") {
    if (context.subscriber) {
      if (
        context["badge-info"].subscriber &&
        context["badge-info"].subscriber != ""
      ) {
        const docref = db.collection("subs").doc(context["display-name"]);
        docref.get().then(doc => {
          let mcname = "";
          if (mcnames[context["display-name"]]) {
            mcname = mcnames[context["display-name"]];
          }
          if (doc.exists) {
            docref.update({
              name: context["display-name"],
              months: context["badge-info"].subscriber,
              will:
                commandText.charAt(0).toUpperCase() + commandText.substring(1),
              timestamp: Date.now(),
              mcname: mcname
            });
          } else {
            docref.set({
              name: context["display-name"],
              months: context["badge-info"].subscriber,
              will:
                commandText.charAt(0).toUpperCase() + commandText.substring(1),
              selected: false,
              timestamp: Date.now(),
              mcname: mcname
            });
          }
        });

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
          timeoutGoing = false;
          setTimeout(() => {
            client.say(
              target,
              "If you should be in the list, but arent, please run the command again."
            );
          }, 2000);
        }, 20000);
      }
    }
    console.log(`* Executed ${commandName} command`);
  } else if (commandName === "!leave") {
    db.collection("subs")
      .doc(context["display-name"])
      .delete();
  } else if (commandName === "!mcname") {
    let name = commandArray[1];
    if (name) {
      const subs = db.collection("subs");
      const mcnamescoll = db.collection("mcnames");
      mcnames[context["display-name"]] = {
        twitchname: context["display-name"],
        mcname: name
      };

      subs
        .doc(context["display-name"])
        .update({ mcname: name })
        .catch(error => {
          console.log("Error whle adding mcname");
          console.dir(error);
        });

      mcnamescoll.doc(context["display-name"]).set({
        twitch: context["display-name"],
        mcname: name
      });
      mcnames[context["display-name"]] = name;
    } else {
      client.say(
        target,
        `@${
          context["display-name"]
        } Usage: "!mcname <your mc-name>" This way you can tell rendog that your mc-name is different from your twitch name. Minecraft names are CASE SENSITIVE!`
      );
    }
  } else if (commandName === "!removemcname") {
    mcnames[context["display-name"]] = null;
    db.collection("subs")
      .doc(context["display-name"])
      .update({ mcname: null });

    db.collection("mcnames")
      .doc(context["display-name"])
      .delete();
  } else if (commandName === "!reset") {
    if (context.mod) {
      db.collection("subs")
        .get()
        .then(snapshot => {
          snapshot.docs.forEach(doc => {
            db.collection("subs")
              .doc(doc.id)
              .delete();
          });
        });
      client.say(target, "Reset registered");
    } else {
      client.say(
        target,
        `@${
          context["display-name"]
        } You are not a mod, and does not have access to that command`
      );
    }
  } else if (commandName === "!remove") {
    if (!context.mod) {
      client.say(
        `@${name} You are not a mod, and cannot use this command. To remove yourselft use !leave`
      );
    } else {
      let selectName = commandArray[1];
      if (selectName.split("")[0] == "@") {
        selectName = commandArray[1].substring(1);
      }

      console.log("Name: " + selectName);

      db.collection("subs")
        .doc(selectName)
        .delete();

      client.say(target, `Deleted ${selectName}`);
    }
  } else if (commandName === "!blameren") {
    blameRenCount += 1;
    client.say(
      target,
      `Rendog has been blamed ${blameRenCount} times this stream`
    );
  } else if (commandName === "!resetblameren") {
    if (context.mod) {
      blameRenCount = 0;
      client.say(
        target,
        `@${context["display-name"]} Blame ren has been reset`
      );
    }
  } else if (commandName === "!badidea") {
    badIdeaCount += 1;
    client.say(target, `${badIdeaCount} people think that is a bad idea!`);
  } else if (commandName === "!resetbadidea") {
    if (context.mod) {
      badIdeaCount = 0;
      client.say(
        target,
        `@${context["display-name"]} Bad Idea Count has been reset`
      );
    }
  } else if (commandName === "!dice") {
    let num = rollDice();
    if (context["display-name"] === "DTGKosh") {
      num = 6;
    }
    client.say(target, `@${context["display-name"]} You rolled a ${num}`);
  } else if (commandName === "!important") {
    console.log(msg);

    if (context.mod) {
      const textArray = msg.split(" ");
      textArray.shift();
      const text = textArray.join(" ");
      db.collection("important").add({
        from: `@${context["display-name"]}`,
        color: context.color,
        text: text,
        timestamp: Date.now()
      });
      console.log("Important message recieved");
    }
  } else if (commandName === "!removelastimportant") {
    if (context.mod) {
      try {
        db.collection("important")
          .where("from", "==", `@${context["display-name"]}`)
          .orderBy("timestamp", "desc")
          .get()
          .then(snapshot => {
            if (snapshot.docs.length != 0) {
              snapshot.docs[0].ref.delete();
            }
          });
      } catch (error) {
        console.dir(error);
      }
    }
  } else if (commandName === "!resetimportant") {
    if (context.mod) {
      db.collection("important")
        .get()
        .then(docs => {
          docs.forEach(doc => {
            doc.ref.delete();
          });
        });
    }
  } else if (commandName === "!how") {
    client.say(
      target,
      `Here are the available commands for subs: 
                        | ¤ \"!here <action>\" to tell rendog you are in chat. Action is optional and can be \"fight\" or \"mine\"
                        | ¤ \"!leave\" so you dont get used
                        | ¤ "!mcname <minecraft-name>" to tell rendog your minecraft-name is different from your twitch name. MC-NAMES ARE CASE SENSITIVE!`
    );
  } else if (commandName === "!modhow") {
    client.say(
      target,
      `Mods can use these commands: 
                    | ¤ "!reset" to delete everyone from the list, use with caution 
                    | ¤ "!remove <name>" to remove a specific user from the list (you can use @)
                    | ¤ "!important <message>" To inform rendog of something important. DO NOT ABUSE!
                    `
    );
  } else if (commandName === "!facecam") {
    client.say(
      target,
      `@${
        context["display-name"]
      } Rendog does not use facecam this stream because hes chillin and its 13 C in his house, and therefore he is covered in blankets...`
    );
  } else if (commandName === "!pack") {
    client.say(target, "!fun");
  } else if (commandName === "!schedule") {
    client.say(
      target,
      "Rendog's streaming-schedule is highly irregular, sometimes he gets caught up in hermitcraft and doesnt stream, " +
        "and sometimes he streams a day which is not on his schedule.He tries however to stream Tuesdays, thursdays and sundays."
    );
  } else {
    console.log(`* Unknown command ${commandName}`);
  }
}

function rollDice() {
  const sides = 6;
  return Math.floor(Math.random() * sides) + 1;
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler(addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
}
