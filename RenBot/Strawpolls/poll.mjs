import { db } from "../utilities/firestore.mjs";
import say from "../say.mjs";

let activePollId = null;
let pollData = null;

let results = [];
let saving = false;

export default {
  async vote(displayName, letter) {
    const code = letter.toUpperCase().charCodeAt(0) - 65;
    if (letter > 1) {
      return `@${displayName} You need to supply exactly one letter, for example: "!vote A"`;
    } else {
      if (!/^[A-Z]$/i.test(letter)) {
        return `@${displayName} You have to send a letter, for example "!vote A"`;
      }
    }

    if (activePollId) {
      try {
        if (pollData.options.length > code) {
          const doc = db
            .collection("polls")
            .doc(activePollId)
            .collection("votes")
            .doc(displayName);

          let val = await doc.get();
          if (val.exists) {
            results[val.data().vote] -= 1;
            doc.update({
              vote: code,
            });
          } else {
            doc.set({
              vote: code,
            });
          }

          results[code] += 1;
          if (!saving) {
            saving = true;
            setTimeout(() => {
              saving = false;
              let pollDoc = db.collection("polls").doc(activePollId);
              pollDoc.update({
                result: results,
              });
            }, 2000);
          }
        } else {
          return `@${displayName} You tried to vote for a non-existent option. Please pick a valid option, use "!poll" to get the options or visit https://renthebot.web.app/ap`;
        }
      } catch (error) {
        console.log("Error on vote:");
        console.dir(error);
      }
    } else {
      return `@${displayName} No active strawpoll at the moment`;
    }
  },
  getPoll(displayName) {
    if (!activePollId) {
      return `@${displayName} No active strawpoll`;
    }
    let output = "";
    output += getPollOptions();
    output += `Use !pollurl for link to live votes`;
    return output;
  },
  getPollURL(displayName) {
    if (!activePollId) {
      return `@${displayName} No active strawpoll. Previous strawpolls: https://renthebot.web.app/polls`;
    }

    return "Link to active poll: https://renthebot.web.app/ap";
  },
};

function stateEndedPoll(id) {
  let max = 0;
  let total = 0;
  let winners = [];
  db.collection("polls")
    .doc(id)
    .get()
    .then((doc) => {
      const data = doc.data();
      data.result
        .forEach((res, index) => {
          total += res;
          if (res > max) {
            max = res;
            winners = [];
            winners.push(index);
          } else if (res === max) {
            winners.push(index);
          }
        })
        .catch((error) => {
          console.log("ERROR: ");
          console.dir(error);
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
      }
      output += `. Details at https://renthebot.web.app/poll/${id}`;

      say("rendogtv", output);
    });
}

function getPollOptions() {
  if (activePollId === null)
    return "No active strawpoll. Previous strawpolls: https://renthebot.web.app/polls";
  let output = `${pollData.question} The options are: `;
  pollData.options.forEach((option, index) => {
    output += `${String.fromCharCode(index + 65)} - ${option} | `;
  });
  output += `Vote IN WHISPER: !vote 'letter'. For example "!vote A"`;
  return output;
}

function startPoll() {
  let output = `Strawpoll started. `;
  output += getPollOptions();
  output += ". Live results: https://renthebot.web.app/ap";
  say("rendogtv", output);
}

db.collection("polls")
  .where("inProgress", "==", true)
  .where("deleted", "==", false)
  .onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const data = change.doc.data();
      switch (change.type) {
        case "added":
          activePollId = change.doc.id;
          pollData = data;
          startPoll();
          results = [];
          if (data.result) {
            results = data.result;
          } else {
            for (let i = 0; i < data.options.length; i++) {
              results.push(0);
            }
          }
          break;

        case "removed":
          stateEndedPoll(change.doc.id);
          activePollId = null;
          pollData = null;
          break;

        default:
          break;
      }
    });
  });
