import { db } from "../utilities/firestore.mjs";
import say from "../say.mjs";
import users from "../utilities/users.mjs";
import beverage from "../ChatFun/beverage.mjs";
import client from "../main.mjs";

let pointsMap = new Map();

export default {
  async getToken(username) {
    console.log("Getting token");
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
      "Use this to log in to the website at https://renthebot.web.app"
    );
  },
  getPoints(username) {
    let points = pointsMap.get(username);
    console.log("Points in map");
    console.log(points);
    if (points === undefined) {
      points = {
        points: 0,
        lastTime: 0,
        capsTimes: 0,
        langTimes: 0,
        repeatTimes: 0,
        topicTimes: 0,
        badwTimes: 0,
      };
    } else {
      const lastTime = points.lastTime;
      const diff = Date.now() - new Date(lastTime);
      points.points -= Math.round(diff / (1000 * 30));
      if (points.points < 0) points.points = 0;
    }
    return points;
  },
  async caps(username, msgId) {
    if (!username) {
      return "Usage !caps @username";
    }

    try {
      const username_lower = username.toLowerCase();
      let points = this.getPoints(username_lower);
      if (points.lastTime > Date.now() - 1000 * 10) return;
      console.log(points);
      let capsDoc = await db.collection("punishement").doc("caps").get();
      const data = capsDoc.data();

      const lastTime = points.lastTime;
      const diff = Date.now() - new Date(lastTime);

      points.capsTimes -= Math.round(diff / (1000 * 60 * 20));
      if (points.capsTimes < 0) points.capsTimes = 0;
      let capsPoints = data.points;
      let newPoints =
        points.points +
        (capsPoints +
          (points.capsTimes * capsPoints) /
            (1 / data.multiplier ? data.multiplier : 1));

      points.points = Math.round(newPoints);
      points.capsTimes += 1;
      points.lastTime = Date.now();
      if (points.points > 1500) points.points = 1000;
      pointsMap.set(username, points);
      return this.punish(username, data.message, data.reason, msgId);
    } catch (error) {
      console.log("Something bad happened. " + error);
      say("rendogtv", "I encountered a problem! @Bjornar97, help!");
    }
  },
  async lang(username, msgId) {
    if (!username) {
      return "Usage !lang @username";
    }

    try {
      const username_lower = username.toLowerCase();
      let points = this.getPoints(username_lower);
      if (points.lastTime > Date.now() - 1000 * 10) return;
      console.log(points);
      let langDoc = await db.collection("punishement").doc("lang").get();
      const data = langDoc.data();

      const lastTime = points.lastTime;
      const diff = Date.now() - new Date(lastTime);

      points.langTimes -= Math.round(diff / (1000 * 60 * 20));
      if (points.langTimes < 0) points.langTimes = 0;
      let langPoints = data.points;
      let newPoints =
        points.points +
        (langPoints +
          (points.langTimes * langPoints) /
            (1 / data.multiplier ? data.multiplier : 1));

      points.points = Math.round(newPoints);
      points.langTimes += 1;
      points.lastTime = Date.now();
      pointsMap.set(username, points);
      return this.punish(username, data.message, data.reason, msgId);
    } catch (error) {
      console.log("Something bad happened. " + error);
      say("rendogtv", "I encountered a problem! @Bjornar97, help!");
    }
  },
  async repeat(username, msgId) {
    if (!username) {
      return "Usage !repeat @username";
    }

    try {
      const username_lower = username.toLowerCase();
      let points = this.getPoints(username_lower);
      if (points.lastTime > Date.now() - 1000 * 10) return;
      console.log(points);
      let repeatDoc = await db.collection("punishement").doc("repeat").get();
      const data = repeatDoc.data();

      const lastTime = points.lastTime;
      const diff = Date.now() - new Date(lastTime);

      points.repeatTimes -= Math.round(diff / (1000 * 60 * 20));
      if (points.repeatTimes < 0) points.repeatTimes = 0;
      let repeatPoints = data.points;
      let newPoints =
        points.points +
        (repeatPoints +
          (points.repeatTimes * repeatPoints) /
            (1 / data.multiplier ? data.multiplier : 1));

      points.points = Math.round(newPoints);
      points.repeatTimes += 1;
      points.lastTime = Date.now();
      pointsMap.set(username_lower, points);
      return this.punish(username, data.message, data.reason, msgId);
    } catch (error) {
      console.log("Something bad happened. " + error);
      say("rendogtv", "I encountered a problem! @Bjornar97, help!");
    }
  },
  async topic(username, msgId) {
    if (!username) {
      return "Usage !topic @username";
    }

    try {
      const username_lower = username.toLowerCase();
      let points = this.getPoints(username_lower);
      if (points.lastTime > Date.now() - 1000 * 10) return;
      console.log(points);
      let topicDoc = await db.collection("punishement").doc("topic").get();
      const data = topicDoc.data();

      const lastTime = points.lastTime;
      const diff = Date.now() - new Date(lastTime);

      points.topicTimes -= Math.round(diff / (1000 * 60 * 20));
      if (points.topicTimes < 0) points.topicTimes = 0;

      let topicPoints = data.points;
      let newPoints =
        points.points +
        (topicPoints +
          (points.topicTimes * topicPoints) /
            (1 / data.multiplier ? data.multiplier : 1));

      points.points = Math.round(newPoints);
      points.topicTimes += 1;
      points.lastTime = Date.now();
      pointsMap.set(username_lower, points);
      return this.punish(username, data.message, data.reason, msgId);
    } catch (error) {
      console.log("Something bad happened. " + error);
      say("rendogtv", "I encountered a problem! @Bjornar97, help!");
    }
  },
  async badwords(username, msgId) {
    if (!username) {
      return "Usage !badw @username";
    }

    try {
      const username_lower = username.toLowerCase();
      let points = this.getPoints(username_lower);
      if (points.lastTime > Date.now() - 1000 * 10) return;
      console.log(points);
      let badwDoc = await db.collection("punishement").doc("badw").get();
      const data = badwDoc.data();

      const lastTime = points.lastTime;
      const diff = Date.now() - new Date(lastTime);

      points.badwTimes -= Math.round(diff / (1000 * 60 * 20));
      if (points.badwTimes < 0) points.badwTimes = 0;

      let badwPoints = data.points;
      let newPoints =
        points.points +
        (badwPoints +
          (points.badwTimes * badwPoints) /
            (1 / data.multiplier ? data.multiplier : 1));

      points.points = Math.round(newPoints);
      points.badwTimes += 1;
      points.lastTime = Date.now();
      pointsMap.set(username_lower, points);
      return this.punish(username, data.message, data.reason, msgId);
    } catch (error) {
      console.log("Something bad happened. " + error);
      say("rendogtv", "I encountered a problem! @Bjornar97, help!");
    }
  },
  async beg(username, msgId) {
    if (!username) {
      return "Usage !beg @username";
    }

    try {
      const username_lower = username.toLowerCase();
      let points = this.getPoints(username_lower);
      if (points.lastTime > Date.now() - 1000 * 10) return;
      console.log(points);
      let begDoc = await db.collection("punishement").doc("beg").get();
      const data = begDoc.data();

      const lastTime = points.lastTime;
      const diff = Date.now() - new Date(lastTime);

      points.begTimes -= Math.round(diff / (1000 * 60 * 20));
      if (points.begTimes < 0) points.begTimes = 0;

      let begPoints = data.points;
      let newPoints =
        points.points +
        (begPoints +
          (points.begTimes * begPoints) /
            (1 / data.multiplier ? data.multiplier : 1));

      points.points = Math.round(newPoints);
      points.begTimes += 1;
      points.lastTime = Date.now();
      pointsMap.set(username_lower, points);
      return this.punish(username, data.message, data.reason, msgId);
    } catch (error) {
      console.log("Something bad happened. " + error);
      say("rendogtv", "I encountered a problem! @Bjornar97, help!");
    }
  },
  async gib(username, msgId) {
    if (!username) {
      return "Usage !gib @username";
    }

    try {
      const username_lower = username.toLowerCase();
      let points = this.getPoints(username_lower);
      if (points.lastTime > Date.now() - 1000 * 10) return;
      console.log(points);
      let gibDoc = await db.collection("punishement").doc("gib").get();
      const data = gibDoc.data();

      const lastTime = points.lastTime;
      const diff = Date.now() - new Date(lastTime);

      points.gibTimes -= Math.round(diff / (1000 * 60 * 20));
      if (points.gibTimes < 0) points.gibTimes = 0;
      let gibPoints = data.points;
      let newPoints =
        points.points +
        (gibPoints +
          (points.gibTimes * gibPoints) /
            (1 / data.multiplier ? data.multiplier : 1));

      points.points = Math.round(newPoints);
      points.gibTimes += 1;
      points.lastTime = Date.now();
      pointsMap.set(username_lower, points);
      return this.punish(username, data.message, data.reason, msgId);
    } catch (error) {
      console.log("Something bad happened. " + error);
      say("rendogtv", "I encountered a problem! @Bjornar97, help!");
    }
  },
  punish(username, message, reason, msgId) {
    const username_lower = username.toLowerCase();

    let points = this.getPoints(username_lower);
    if (points.points < 100) {
      users.timeout(username, 1, reason);
      return `@${username} ${message} [Warning]`;
    }

    users.timeout(username, points.points * 2, reason);
    points.points -= 30;
    pointsMap.set(username_lower, points);

    if (message) {
      return `@${username} ${message} [Timeout ${points.points * 2} seconds]`;
    }
  },
};
