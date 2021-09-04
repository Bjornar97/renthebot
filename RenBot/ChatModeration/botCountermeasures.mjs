import chatControl from "../utilities/chatControl.mjs";
import users from "../utilities/users.mjs";
import say from "../say.mjs";

let messages = new Map();

let deployed = false;
let deployedTime;

let messagesPer10Seconds = 30;

export default {
  addMessage(msg, username) {
    if (msg.length < 10) {
      return;
    }

    let message = messages.get(msg);

    if (message) {
      message.number += 1;
      message.users.push(username);
      messages.set(message, message);
    } else {
      message = {
        number: 1,
        users: [username],
      };
      messages.set(msg, message);
    }

    if (message.number > messagesPer10Seconds) {
      this.deploy(message);
    }

    setTimeout(() => {
      let message = messages.get(msg);
      message.number -= 1;

      if (message.numer <= 0) {
        messages.delete(msg);
      } else {
        messages.set(message);
      }
    }, 10 * 1000);
  },
  deploy(message) {
    // 30 minutes have passed, so the bot attack should be over
    if (deployed && deployedTime > Date.now() + 30 * 60 * 1000) {
      deployed = false;
      chatControl.removeSlowmode();
      chatControl.removeFollowersMode();
      say(
        "rendogtv",
        "Bot attack hopefully over, disabling countermeasures oXo Bots! If you're listening, better not try that again!"
      );
    }

    //If not already deployed, deploying countermeasures
    if (!deployed) {
      say(
        "rendogtv",
        "ALARM!! Bot attack detected!!! oXo Countermeasures deployed oXo"
      );
      deployed = true;
      deployedTime = Date.now();

      chatControl.setSlowmode(60);
      chatControl.setFollowerMode(10);

      // Feature needs testing before we can start automatically banning people

      /*
      message.users.forEach((user) => {
        users.ban(
          user,
          "Likely involved in a bot attack, automated by RenTheBot"
        );
      });

      say(
        "rendogtv",
        "oXo Countermeasures fully deployed and users involved has been banned oXo"
      );
      */
    }
  },
};
