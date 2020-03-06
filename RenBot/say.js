import client from "./main.js";

let sayQueue = [];

setInterval(() => {
  if (sayQueue.length != 0) {
    let messageObject = sayQueue.shift();
    if (messageObject) {
      if (messageObject.channel && typeof messageObject.channel === "string") {
        if (
          messageObject.message &&
          typeof messageObject.message === "string"
        ) {
          client.say(messageObject.channel, messageObject.message);
        }
      }
    }
  }
}, 1200);

export default function say(channel, message) {
  sayQueue.push({ channel, message });
}
