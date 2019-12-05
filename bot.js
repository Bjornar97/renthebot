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

let cooldown = 120;
let userDiceTimestamp = {};

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

// Register our event handlers (defined below)
client.on("message", onMessageHandler);
client.on("connected", onConnectedHandler);

// Connect to Twitch:
client.connect();

let first = true;
let mcnames = {};

let todayMessage = "";

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

// Timer
let timer = {};

// Called every time a message comes in
function onMessageHandler(target, context, msg, self) {
  if (first) {
    client.say(target, "/color green");
    first = false;
  }

  // Ignores messages from the bot
  if (self) {
    return;
  }

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

  let displayName = context["display-name"];
  const originalDisplayName = displayName;
  let badgeInfo = context["badge-info"];
  let months = null;
  if (badgeInfo) {
    months = badgeInfo.subscriber;
  } else {
    badgeInfo = {
      subscriber: null
    };
  }

  if (argumentsArray[0]) {
    if (argumentsArray[0].charAt(0) === "@") {
      displayName = argumentsArray[0].substring(1);
    }
  }

  switch (commandName) {
    case "!hello":
    case "!today":
      send(target, `Welcome to the stream @${displayName}. ${todayMessage}`);
      break;

    case "!settoday":
      if (context.mod) {
        todayMessage = argumentsText;
        send(target, `@${displayName} The message of today has been set.`);
      } else {
        send(
          target,
          `@${originalDisplayName} Only mods can use the command "!settoday"`
        );
      }
      break;

    case "!here":
      if (badgeInfo.subscriber && badgeInfo.subscriber != "") {
        addSub(originalDisplayName, months, argumentsText);
      } else {
        send(target, `@${originalDisplayName} Only subs can use that command`);
      }
      break;

    case "!fight":
      if (badgeInfo.subscriber && badgeInfo.subscriber != "") {
        addSub(originalDisplayName, months, "Fight");
      } else {
        send(target, `@${originalDisplayName} Only subs can use that command`);
      }
      break;

    case "!mine":
      if (badgeInfo.subscriber && badgeInfo.subscriber != "") {
        addSub(originalDisplayName, months, "Mine");
      } else {
        send(target, `@${originalDisplayName} Only subs can use that command`);
      }
      break;

    case "!leave":
      removeSub(originalDisplayName);
      send(
        target,
        `@${originalDisplayName} You have left, and removed from the list.`
      );
      break;

    case "!mcname":
      if (!argumentsArray[0]) {
        send(target, `@${displayName} Usage: "!mcname your-minecraft-name"`);
      } else if (argumentsArray[0].trim() === "") {
        send(target, `@${displayName} Usage: "!mcname your-minecraft-name"`);
      } else {
        setMCName(originalDisplayName, argumentsArray[0]);
        send(
          target,
          `@${originalDisplayName} Your minecraft-name "${argumentsArray[0]}" was added.`
        );
      }
      break;

    case "!removemcname":
      removeMCName(originalDisplayName);
      send(target, `@${originalDisplayName} Your minecraft-name was removed.`);
      break;

    case "!reset":
      if (context.mod) {
        resetSubs();
        send(target, `@${originalDisplayName} Sublist has been reset.`);
      } else {
        send(
          target,
          `@${originalDisplayName} Only mods can use the command "!reset"`
        );
      }
      break;

    case "!remove":
      if (context.mod) {
        removeSub(argumentsArray[0]);
      } else {
        send(
          target,
          `@${originalDisplayName} Only mods can use the command "!remove"`
        );
      }
      break;

    case "!blameren":
      blame(target);
      break;

    case "!blamechat":
      blameChat(target);
      break;

    case "!badidea":
      badIdea(target);
      break;

    case "!resetblameren":
      if (context.mod) {
        resetBlameRen();
        send(target, `@${originalDisplayName} Blame Ren Count has been reset.`);
      } else {
        send(
          target,
          `@${originalDisplayName} Only mods can use the "!reset..." commands`
        );
      }
      break;

    case "!resetblamechat":
      if (context.mod) {
        resetBlameChat();
      } else {
        send(
          target,
          `@${originalDisplayName} Only mods can use the "!reset..." commands`
        );
      }
      break;

    case "!resetbadidea":
      if (context.mod) {
        resetBadIdea();
        send(target, `@${originalDisplayName} Bad Idea Count has been reset.`);
      } else {
        send(
          target,
          `@${originalDisplayName} Only mods can use the "!reset..." commands`
        );
      }

      break;

    case "!inline":
      addToLine(originalDisplayName);
      send(
        target,
        `@${originalDisplayName} You are now in line, if you know what im sayin!`
      );
      break;

    case "!outofline":
      removeFromLine(originalDisplayName);
      send(target, `@${originalDisplayName} You left the line :(`);
      break;

    case "!line":
      printLine();
      break;

    case "!song":
    case "!music":
    case "!playlist":
      send(
        target,
        "This is the LoFi Beats on Spotify. Link: https://open.spotify.com/playlist/37i9dQZF1DWWQRwui0ExPn?si=nbSsUSOnSJeSxMZu7ZY3nQ"
      );
      break;

    case "!donate":
    case "!tip":
      send(
        target,
        `To donate to Rendog: https://streamlabs.com/rendogtv/tip PS: If you donate 20$ or more, you will become a trader in-game.`
      );
      break;

    case "!dice":
      let user = userDiceTimestamp[originalDisplayName];
      if (user) {
        if (user.time > Date.now()) {
          if (user.warning) {
            timeout(
              target,
              displayName,
              "You are using the !dice command too often.",
              Math.round(cooldown / 2)
            );
            userDiceTimestamp[originalDisplayName] = null;
          } else {
            userDiceTimestamp[originalDisplayName].warning = true;
            send(
              target,
              `@${originalDisplayName} The dice command has a cooldown of ${cooldown}s. Please dont use it too often. [Warning]`
            );
          }
        } else {
          userDiceTimestamp[originalDisplayName] = {
            time: Date.now() + cooldown * 1000,
            warning: false
          };

          rollDice(originalDisplayName);
        }
      } else {
        userDiceTimestamp[originalDisplayName] = {
          time: Date.now() + cooldown * 1000,
          warning: false
        };
        rollDice(originalDisplayName);
      }

      break;

    case "!setcooldown":
      if (context.mod) {
        if (parseInt(argumentsArray[0]) != "NaN") {
          cooldown = parseInt(argumentsArray[0]);
          send(
            target,
            `@${originalDisplayName} Cooldown was set to ${argumentsArray[0]} seconds.`
          );
        } else {
          send(
            target,
            `@${originalDisplayName} ${argumentsArray[0]} is not a valid number`
          );
        }
      } else {
        send(
          target,
          `@${originalDisplayName} Only mods can use the command "!setcooldown".`
        );
      }
      break;

    case "!beverage":
      if (!argumentsArray[0]) {
        send(target, `@${originalDisplayName} enjoys a tasty beverage!`);
      } else {
        let endString = "a tasty beverage";
        if (argumentsArray[1]) {
          endString = "";
          for (let i = 1; i < argumentsArray.length; i++) {
            const element = argumentsArray[i];
            endString += " " + element;
          }
        }
        send(
          target,
          `@${originalDisplayName} sends @${displayName} ${endString}`
        );
      }
      break;

    case "!vote":
      if (argumentsText.trim().length > 1) {
        send(
          target,
          `@${originalDisplayName} You need to supply exactly one letter, for example: "!vote A"`
        );
      } else {
        if (!/^[A-Z]$/i.test(argumentsText.trim())) {
          send(
            target,
            `@${originalDisplayName} You have to send a letter, for example "!vote A"`
          );
        } else {
          vote(originalDisplayName, argumentsText.trim());
        }
      }

      break;

    case "!poll":
      statePoll(displayName);
      break;

    case "!commands":
      send(
        target,
        `Commands: "!mcname your-minecraft-name", "!playlist", "!sos", "!donate, "!today", "!dice", "!blameren", "!blamechat", "!badidea", "!timer". Subs only: "!here", "!fight", "!mine"`
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
    case "!mod":
    case "!mods":
      if (context.mod) {
        send(target, `@${displayName} Commands sent by whisper`);
        const messages = [
          "You as a moderator can use the following commands: ",
          `"!setcooldown <number>" to change the cooldown of the !dice command.`,
          `"!reset" to remove all subs from the fight/mine list`,
          `"!resetblameren" resets the blameren count`,
          `"!resetblamechat" and "!resetbadidea" works the same way as above.`,
          `"!timer start" to start the timer.`,
          `"!timer stop" to stop the timer`
        ];
        for (let i = 0; i < messages.length; i++) {
          const message = messages[i];
          setTimeout(() => {
            console.log("sending whisper to " + displayName);
            client
              .raw(`PRIVMSG #${context.username} :/w ${message}`)
              .catch(error => {
                console.dir(error);
              });
          }, i * 1200);
        }
      } else {
        send(target, `@${displayName} Only mods can see commands for mods.`);
      }

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

    case "!schedule":
      send(
        target,
        "Rendog's streaming-schedule is highly irregular, sometimes he gets caught up in hermitcraft and doesnt stream, " +
          "and sometimes he streams a day which is not on his schedule.He tries however to stream Tuesdays, thursdays and sundays."
      );
      break;
    case "!wiki":
      send(
        target,
        `@${displayName} The Dogcraft wiki can be found here: https://wiki.dogcraft.net/`
      );
      break;

    case "!timer":
      switch (argumentsArray[0]) {
        case "start":
          if (context.mod) {
            if (timer.start) {
              send(
                target,
                `@${displayName} There is already a timer going. Please stop that one first.`
              );
            } else {
              timer.start = Date.now();
              send(target, `Timer started.`);
            }
          } else {
            send(
              target,
              `@${displayName} Only mods can start and stop timers.`
            );
          }
          break;

        case "stop":
          if (context.mod) {
            if (timer.start == null) {
              send(target, `@${displayName} There is no timer to stop.`);
            } else {
              const result = Date.now() - timer.start;
              const timeString = convertMillisecToString(result);

              timer.start = null;

              send(target, `TIMER: Stopped, ${timeString}`);
            }
          } else {
            send(
              target,
              `@${displayName} Only mods can start and stop timers.`
            );
          }
          break;
        default:
          const result = Date.now() - timer.start;
          const timeString = convertMillisecToString(result);
          timer.start = null;
          send(target, `TIMER: Current time: ${timeString}`);
          break;
      }
      break;

    case "!site":
      send(
        target,
        "See the website where the magic happens: https://rendogtv-viewers-bot.web.app/"
      );
      break;

    case "!break":
      if (context.mod) {
        send(
          target,
          `RENDOG RENDOG RENDOG!!! Break time, ordered by @${originalDisplayName}`
        );
      } else {
        client.deletemessage(target, context["id"]);
      }
      break;

    default:
      console.log(`Unknown command: ${commandName}`);
      break;
  }
}

let activePollId = null;
let pollData = null;

db.collection("polls")
  .where("inProgress", "==", true)
  .where("deleted", "==", false)
  .onSnapshot(snapshot => {
    snapshot.docChanges().forEach(change => {
      const data = change.doc.data();
      switch (change.type) {
        case "added":
          activePollId = change.doc.id;
          pollData = data;
          statePoll();
          break;

        case "removed":
          console.dir(data);
          stateEndedPoll(change.doc.id);
          activePollId = null;
          pollData = null;
          break;

        default:
          break;
      }
    });
  });

function convertMillisecToString(milliseconds) {
  console.log(milliseconds);
  const date = new Date(milliseconds);
  const hrs =
    date.getUTCHours() < 10 ? "0" + date.getUTCHours() : date.getUTCHours();
  const min =
    date.getUTCMinutes() < 10
      ? "0" + date.getUTCMinutes()
      : date.getUTCMinutes();
  const sec =
    date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();

  return `${hrs !== "00" ? hrs + "h" : ""}${
    hrs !== "00" || min !== "00" ? min + "m" : ""
  }${sec}s`;
}

function statePoll(displayName = "") {
  if (activePollId) {
    let output = `Strawpoll started. "${pollData.question}" The options are: `;
    pollData.options.forEach((option, index) => {
      output += `${String.fromCharCode(index + 65)} - "${option}". `;
    });
    output += `Vote by writing "!vote 'letter'" where 'letter' is the coresponding option. For example "!vote A"`;
    send("rendogtv", output);
    send(
      "rendogtv",
      `To follow the votes, go to https://rendogtv-viewers-bot.web.app/poll/${activePollId}`
    );
  } else {
    send("rendogtv", `@${displayName} No active strawpoll at the moment`);
  }
}

function stateEndedPoll(id) {
  let max = 0;
  let total = 0;
  let winners = [];
  db.collection("polls")
    .doc(id)
    .get()
    .then(doc => {
      const data = doc.data();
      data.result.forEach((res, index) => {
        total += res;
        if (res > max) {
          max = res;
          winners = [];
          winners.push(index);
        } else if (res === max) {
          winners.push(index);
        }
      });
      let output = "";
      if (winners.length === 1) {
        output = `The strawpoll has ended. The winner is option ${String.fromCharCode(
          winners[0] + 65
        )}: "${data.options[winners[0]]}" with ${max} votes (${Math.round(
          (max / total) * 100
        )}%)`;
      } else {
        output = `Strawpoll ended. It is a tie between `;
        for (let i = 0; i < winners.length; i++) {
          output += `${String.fromCharCode(winners[i] + 65)} - "${
            data.options[winners[i]]
          }"`;
          if (i === winners.length - 2) {
            output += " and ";
          } else if (i !== winners.length - 1) {
            output += ", ";
          }
        }
        output += `, each with ${max} votes (${Math.round(
          (max / total) * 100
        )}%)`;

        output += `. Details at https://rendogtv-viewers-bot.web.app/poll/${id}`;
      }

      send("rendogtv", output);
    });
}

let sayQueue = [];

function send(channel, message) {
  sayQueue.push({ channel, message });
}

setInterval(() => {
  if (sayQueue.length != 0) {
    let messageObject = sayQueue.shift();
    client.say(messageObject.channel, messageObject.message);
  }
}, 1200);

function timeout(channel, displayName, reason = "", time = 120) {
  client.timeout(channel, displayName, time, reason);
}

function vote(displayName, letter) {
  const code = letter.toUpperCase().charCodeAt(0) - 65;
  if (activePollId) {
    if (pollData.options.length > code) {
      const doc = db
        .collection("polls")
        .doc(activePollId)
        .collection("votes")
        .doc(displayName);

      doc.get().then(val => {
        if (val.exists) {
          doc.update({
            vote: code
          });
        } else {
          doc.set({
            vote: letter.toUpperCase().charCodeAt(0) - 65
          });
        }
      });
    } else {
      send(
        "rendogtv",
        `@${displayName} You voted for a non-existent option. Please pick a valid option, use "!poll" to get the options or visit https://rendogtv-viewers-bot.web.app/poll/${activePollId}`
      );
    }
  } else {
    send("rendogtv", `@${displayName} No active strawpoll at the moment`);
  }
}

function addSub(displayName, months, task) {
  try {
    task = task.charAt(0).toUpperCase() + task.substring(1);
    const docref = subsCollection.doc(displayName);
    docref.get().then(doc => {
      if (doc.exists) {
        docref.update({
          name: displayName,
          months: months,
          will: task,
          timestamp: Date.now()
        });
      } else {
        docref.set({
          name: displayName,
          months: months,
          will: task,
          selected: false,
          timestamp: Date.now()
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

  if (step === 2) {
    step += 1;
    send("rendogtv", `@${displayName} ${steps[step]}`);
  }

  step += 1;

  if (tutorialPeople[displayName].step >= steps.length) {
    delete tutorialPeople[displayName];
  } else {
    tutorialPeople[displayName].step = step;
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
  db.collection("channels")
    .doc("rendogtv")
    .update({ blame: 0 });
}

function resetBlameChat() {
  db.collection("channels")
    .doc("rendogtv")
    .update({ blameChat: 0 });
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
  setTimeout(() => {
    done(displayName, 0);
  }, 500);
}

function removeMCName(displayName) {
  MCNamesCollection.doc(displayName).delete();
}

const usersCollection = db.collection("users");

async function rollDice(displayName) {
  const sides = 6;
  const num = Math.floor(Math.random() * sides) + 1;
  const docRef = usersCollection.doc(displayName);
  const doc = await docRef.get();

  let total;
  let numberOfRolls;
  if (doc.exists) {
    total = doc.data().total + num;
    numberOfRolls = doc.data().number + 1;
    docRef.update({
      total: admin.firestore.FieldValue.increment(num),
      number: admin.firestore.FieldValue.increment(1)
    });
  } else {
    docRef.set({
      total: num,
      number: 1
    });
    total = num;
    numberOfRolls = 1;
  }

  send(
    "rendogtv",
    `@${displayName} You rolled a ${num}. Your average is ${Math.round(
      (total / numberOfRolls) * 100
    ) / 100}`
  );
}

function addToLine(displayName) {
  rendogtvDoc.update({
    line: admin.firestore.FieldValue.arrayUnion(displayName)
  });
}

function removeFromLine(displayName) {
  rendogtvDoc.update({
    line: admin.firestore.FieldValue.arrayRemove(displayName)
  });
}

async function printLine() {
  const doc = await rendogtvDoc.get();
  let string = "The following is in the line: ";
  const line = doc.data().line;

  line.forEach(displayName => {
    string += `@${displayName} `;
  });

  send("rendogtv", string);
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler(addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
}
