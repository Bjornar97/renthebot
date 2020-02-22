import request from "request";
import say from "../say";
import commands from "../utilities/commands";
import newStream from "./newStream";

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
    let success = true;
    try {
      body = JSON.parse(body);
      if (body == null || body == undefined) {
        live = false;
        return;
      }
      success = true;
    } catch (error) {
      console.dir(error);
      success = false;
    }
    
    const stream = body.stream;
    if (stream === undefined || success === false) {
      console.log("Stream is undefined");
      live = false;
      return;
    }

    if (stream === null) {
      console.log("Stream is undefined");
      live = false;
    } else {
      console.log("stream is not null");
      if (live === false) {
        console.log("live was false");
        const prevStartTime = startedTime;
        console.log("Prev start time: " + prevStartTime)
        const startTime = new Date(stream["created_at"]);
        console.log(`Startime: ${startTime}, prevStartTime: ${prevStartTime}, diff: ${startTime - prevStartTime}`);
        if (startTime - prevStartTime > 60 * 60 * 1000) {
          const diff = Date.now() - startTime.getTime();
          if (diff < 600 * 1000) {
            console.log("Diff is small");
            setTimeout(() => {
              say(
                "rendogtv",
                `Welcome to the stream everyone! Today we are playing ${type()}`
              );
            }, 600 * 1000 - diff);
          }
        }
      }

      if (live !== true) {
        live = true;
        newStream.onNewStream();
        console.log("New stream");
      }

      if (id !== stream._id) id = stream._id;

      if (title === null) {
        console.log("Title was null");
        console.log(`Known Type: ${knownType}`);
        title = stream.channel.status;
        knownType = title !== "Nothing";
        if (knownType) commands.updateCommands(type(), false);
      } else if (title !== stream.channel.status) {
        console.log("New title");
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

  } else if (game === "Minecraft") {
    knownType = false;
    return "something unusual in Minecraft";
  } else {
    knownType = false;
    return "something unusual, " + game;
  }
};

sendRequest();
setInterval(() => {
  sendRequest();
}, 100 * 1000);
