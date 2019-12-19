import request from "request";
import say from "../say";
import commands from "../utilities/commands";

let req = request.defaults({
  headers: {
    "Client-ID": "fwidrp0e5f0nza5cltuqgb19fx9f45",
    Authorization: "OAuth zrjuwb8rgcydcsvebw9k8n0nibhg1e",
    Accept: "application/vnd.twitchtv.v5+json"
  }
});

const url = "https://api.twitch.tv/kraken/streams/30600786";

let knownType = false;

let id = null;
let live = false;
let title = null;
let game = null;
let viewers = null;
let startedTime = null;

export default {
  getType() {
    return type();
  },
  getInfo() {
    return {
      id,
      live,
      title,
      type: this.getType(),
      game,
      viewers,
      startedTime
    };
  },
  isLive() {
    return live;
  }
};

const sendRequest = () => {
  req(url, (err, res, body) => {
    body = JSON.parse(body);
    const stream = body.stream;
    if (stream === null) {
      live = false;
    } else {
      if (live === false) {
        const prevStartTime = startedTime;
        const startTime = new Date(stream["created_at"]);
        if (startTime - prevStartTime > 60 * 60 * 1000) {
          const diff = Date.now() - startTime.getTime();
          if (diff < 310 * 1000) {
            setTimeout(() => {
              say(
                "rendogtv",
                `Welcome to the stream everyone! Today we are playing ${type()}`
              );
            }, 310 * 1000 - diff);
          }
        }
      }
      if (live !== true) live = true;
      if (id !== stream._id) id = stream._id;
      if (title === null) {
        title = stream.channel.status;
        if (knownType) commands.updateCommands(type(), false);
      } else if (title !== stream.channel.status) {
        title = stream.channel.status;
        if (knownType) commands.updateCommands(type(), true);
      }
      if (game !== stream.game) game = stream.game;
      if (viewers !== stream.viewers) viewers = stream.viewers;
      if (startedTime !== stream["created_at"])
        startedTime = stream["created_at"];

      console.log("Title: " + title);
    }
  });
};

let type = () => {
  if (title === null) {
    return "Nothing";
  }
  if (title.toLowerCase().includes("nitro")) {
    knownType = true;
    return "Nitro UHC";
  } else if (title.toLowerCase().includes("funcraft")) {
    knownType = true;
    return "FunCraft";
  } else if (title.toLowerCase().includes("hermitcraft")) {
    knownType = true;
    return "HermitCraft";
  } else if (game === "They Are Billions") {
    knownType = true;
    return "They are Billions";
  } else {
    knownType = false;
    return "something unusual, " + game;
  }
};

sendRequest();
setInterval(() => {
  sendRequest();
}, 100 * 1000);
