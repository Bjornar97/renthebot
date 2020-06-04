import { db } from "../utilities/firestore";
import say from "../say";
import users from "../utilities/users";

let pointsMap = new Map();

export default {
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
                topicTimes: 0
            }
        } else {
            const lastTime = points.lastTime;
            const diff = Date.now() - (new Date(lastTime));
            points.points -= Math.round(diff/(1000*30));
            if (points.points < 0) points.points = 0;
        }
        return points;
    },
    async caps(username, msgId) {
        try {
            let points = this.getPoints(username);
            console.log(points);
            let capsDoc = await db.collection("punishement").doc("caps").get();
            const data = capsDoc.data();

            const lastTime = points.lastTime;
            const diff = Date.now() - (new Date(lastTime));

            points.capsTimes -= Math.round(diff /(1000*60*20));
            if (points.capsTimes < 0) points.capsTimes = 0;
            let capsPoints = data.points;
            let newPoints = points.points + (capsPoints + ((points.capsTimes * capsPoints) / (1 / data.multiplier ? data.multiplier: 1)));
    
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
        try {
            let points = this.getPoints(username);
            console.log(points);
            let langDoc = await db.collection("punishement").doc("lang").get();
            const data = langDoc.data();

            const lastTime = points.lastTime;
            const diff = Date.now() - (new Date(lastTime));

            points.langTimes -= Math.round(diff /(1000*60*20));
            if (points.langTimes < 0) points.langTimes = 0;
            let langPoints = data.points;
            let newPoints = points.points + (langPoints + ((points.langTimes * langPoints) / (1 / data.multiplier ? data.multiplier: 1)));
    
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
        try {
            let points = this.getPoints(username);
            console.log(points);
            let repeatDoc = await db.collection("punishement").doc("repeat").get();
            const data = repeatDoc.data();

            const lastTime = points.lastTime;
            const diff = Date.now() - (new Date(lastTime));

            points.repeatTimes -= Math.round(diff /(1000*60*20));
            if (points.repeatTimes < 0) points.repeatTimes = 0;
            let repeatPoints = data.points;
            let newPoints = points.points + (repeatPoints + ((points.repeatTimes * repeatPoints) / (1 / data.multiplier ? data.multiplier: 1)));
    
            points.points = Math.round(newPoints);
            points.repeatTimes += 1;
            points.lastTime = Date.now();
            pointsMap.set(username, points);
            return this.punish(username, data.message, data.reason, msgId);
        } catch (error) {
            console.log("Something bad happened. " + error);
            say("rendogtv", "I encountered a problem! @Bjornar97, help!");
        }
    },
    async topic(username, msgId) {
        try {
            let points = this.getPoints(username);
            console.log(points);
            let topicDoc = await db.collection("punishement").doc("topic").get();
            const data = topicDoc.data();

            const lastTime = points.lastTime;
            const diff = Date.now() - (new Date(lastTime));

            points.topicTimes -= Math.round(diff /(1000*60*20));
            if (points.topicTimes < 0) points.topicTimes = 0;

            let topicPoints = data.points;
            let newPoints = points.points + (topicPoints + ((points.topicTimes * topicPoints) / (1 / data.multiplier ? data.multiplier: 1)));
    
            points.points = Math.round(newPoints);
            points.topicTimes += 1;
            points.lastTime = Date.now();
            pointsMap.set(username, points);
            return this.punish(username, data.message, data.reason, msgId);
        } catch (error) {
            console.log("Something bad happened. " + error);
            say("rendogtv", "I encountered a problem! @Bjornar97, help!");
        }
    },
    punish(username, message, reason, msgId) {
        let points = this.getPoints(username);
        say("rendogtv", `User: ${username}, points: ${points.points}`);
        if (points.points < 100) {
            users.deleteMessage(msgId);
            return `@${username} ${message} [Warning]`;
        }

        points.points -= 30;
        pointsMap.set(username, points);
        
        users.timeout(username, points.points * 2, reason);
        return `@${username} ${message} [Timeout ${points.points * 2} seconds]`;
    }
};
