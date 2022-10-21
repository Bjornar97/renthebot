import { db } from "../utilities/firestore.mjs";
import say from "../say.mjs";
import users from "../utilities/users.mjs";
import client from "../main.mjs";

let pointsMap = new Map();

db.collection("botdata")
  .doc("userPunishPointsMap")
  .get()
  .then((doc) => {
    if (!doc.exists) {
      return;
    }

    const data = doc.data().data;

    data.forEach((user) => {
      pointsMap.set(user.username, user.data);
    });
  });

const modTools = {
  async getToken(username) {
    let tokensCol = db.collection("tokens");
    let tokendoc = await tokensCol.where("for", "==", username).get();

    if (!tokendoc.empty) {
      tokendoc = tokendoc.docs[0];
    } else {
      tokendoc = await tokensCol.add({
        for: username,
        valid: true,
      });
    }

    client.whisper(username, `Token: ${tokendoc.id}`);
    client.whisper(
      username,
      "Use this to log in to the website at https://renbot.net/moderators"
    );
  },
  getPoints(username) {
    let points = pointsMap.get(username);

    if (points === undefined) {
      points = {
        points: 0,
        lastTime: 0,
      };
    }

    return points;
  },
  listPunishments() {
    return "{user} Moderator punishment alternatives: !caps, !lang, !badw, !beg, !gib, !repeat, !topic and !reset";
  },
  wipePoints(username) {
    if (!username) {
      return `Usage: !reset @username`;
    }

    const points = this.getPoints(username.toLowerCase());

    points.points = 0;

    pointsMap.set(username.toLowerCase(), points);

    this.saveMap();

    return `Punishment seconds for user ${username} has been reset to 0`;
  },
  async punishment(type, username, msgId) {
    if (!username) {
      return `Usage: !${type} @username`;
    }

    try {
      const username_lower = username.toLowerCase();

      let points = this.getPoints(username_lower);
      if (points.lastTime > Date.now() - 1000 * 10) {
        return;
      }

      let punishDoc = await db.collection("punishement").doc(type).get();
      const data = punishDoc.data();

      return this.punish(username, data.message, data.reason, data);
    } catch (error) {
      console.log("Something bad happened. " + error);
      say("rendogtv", "I encountered a problem! @Bjornar97, help!");
    }
  },
  punish(username, message, reason, doc) {
    const username_lower = username.toLowerCase();

    const points = this.getPoints(username_lower);
    points.points = (points.points + doc.points) * doc.multiplier;
    points.lastTime = Date.now();

    const maxTimeoutTime = 60 * 60 * 24 * 14;

    if (points.points > maxTimeoutTime) {
      points.points = maxTimeoutTime;
    }

    pointsMap.set(username_lower, points);

    setTimeout(() => {
      this.saveMap();
    }, 1000);

    users.timeout(username, points.points, reason);

    if (message) {
      if (points.points === maxTimeoutTime)
        setTimeout(() => {
          say(
            "rendogtv",
            `@mods I advise banning @${username}, they reached max timeout oXo`
          );
        }, 1000);
      return `@${username} ${message} [Timeout ${points.points} seconds]`;
    }
  },
  saveMap() {
    let data = [];

    pointsMap.forEach(function (value, key) {
      // Only keep the once that has had an offense last 2 weeks
      if (
        value.points > 0 &&
        value.lastTime > Date.now() - 1000 * 60 * 60 * 24 * 14
      ) {
        data.push({ username: key, data: value });
      }
    });

    db.collection("botdata").doc("userPunishPointsMap").set({
      data,
    });
  },
  onTimeoutUser(channel, username, reason, duration, userstate) {
    const username_lower = username.toLowerCase();

    const points = modTools.getPoints(username_lower);

    points.points += duration;

    pointsMap.set(username_lower, points);

    modTools.saveMap();
  },
};

export default modTools;
