//import request from "request";
import axios from "axios";
import say from "../say.mjs";
import commands from "../utilities/commands.mjs";
import newStream from "./newStream.mjs";
import { db } from "../utilities/firestore.mjs";

let knownType = false;

let stream = {
  id: null,
  live: null,
  title: null,
  startedAt: null,
  error: null,
  eventAt: null,
  gameId: null,
};

let game = null;
let type = null;

export default {
  getType() {
    return type;
  },
  getInfo() {
    return {
      ...stream,
      type,
      game,
    };
  },
  isLive() {
    return stream.live;
  },
  restartLiveListner() {
    if (liveListner) liveListner();
    startLiveListner();
  },
};

let liveListner;

startLiveListner();

function startLiveListner() {
  liveListner = db
    .collection("stream")
    .doc("live")
    .onSnapshot(async (doc) => {
      let data = doc.data();
      console.log("Stream updated:");
      console.dir(data);
      const prevStream = stream;
      console.log("Prev: ");
      console.dir(prevStream);
      if (data) stream = data;
      else return;
      if (stream.error === true) return;
      if (stream.live === false) {
        if (prevStream.live === true) {
          let date = new Date();
          let nextDay = "Tuesday";
          if (date.getUTCDay() < 2) nextDay = "Tuesday";
          else if (date.getUTCDay() < 5) nextDay = "Friday";
          else nextDay = "Sunday";
          say(
            "rendogtv",
            `The stream is now unfortunately over. Join us next time`
          );
        }
        return;
      }
      let game = null;
      try {
        //game = (await twitchRequest.get(`https://api.twitch.tv/helix/games?id=${stream.gameId}`)).data[0].name;
        //console.log(game);
      } catch (error) {
        console.error("Error: " + error);
        game = null;
      }
      knownType = false;
      type = getKnownType(stream.title, game);
      if (type === "Nothing" || type.includes("something unusual"))
        knownType = false;
      else knownType = true;

      if (prevStream.live === false) {
        newStream.onNewStream();
        const sinceStarted = Date.now() - new Date(stream.startedAt).getTime();
        if (sinceStarted < 5 * 60 * 1000) {
          if (knownType) commands.updateCommands(type, false);

          if (sinceStarted < 2 * 60 * 1000) {
            console.log("Saying live 1");
            say(
              "rendogtv",
              `We have gone live${
                type ? ", playing " + type : ""
              }. Congratz on being here before the stream even started!`
            );
          }

          setTimeout(async () => {
            if (stream.live) {
              let viewers = null;
              try {
                // viewers = (await twitchRequest.get("https://api.twitch.tv/helix/streams?user_id=30600786")).data.data[0].viewer_count;
                // console.log(viewers)
              } catch (error) {
                console.log("Error getting viewers " + error);
              }
              console.log("Saying live 2");
              say(
                "rendogtv",
                `Welcome to the stream, notification squad${
                  viewers ? ", " + viewers + " viewers atm" : ""
                } people! We are playing ${type}. Commands for this stream: !commands`
              );
            }
          }, 5 * 60 * 1000 - sinceStarted);
        }
      } else if (
        prevStream.title !== null &&
        prevStream.title !== stream.title
      ) {
        console.log("Switched title");
        if (knownType) commands.updateCommands(type, true);
      }
    });
}

function getKnownType(title, game) {
  if (title === null) {
    return "Nothing";
  }
  if (title.toLowerCase().includes("nitro")) {
    return "Nitro UHC";
  } else if (title.toLowerCase().includes("funcraft")) {
    return "FunCraft";
  } else if (title.toLowerCase().includes("hermitcraft")) {
    return "HermitCraft";
  } else if (game === "They Are Billions") {
    return "They are Billions";
  } else if (game === "Minecraft") {
    return "something unusual in Minecraft";
  } else if (typeof game === "string") {
    return "something unusual, " + game;
  } else {
    return "something unusual";
  }
}
