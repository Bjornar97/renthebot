//import request from "request";
import axios from "axios";
import say from "../say";
import commands from "../utilities/commands";
import newStream from "./newStream";
import { db } from "../utilities/firestore";

// let req = request.defaults({
//   headers: {
//     "Client-ID": "fwidrp0e5f0nza5cltuqgb19fx9f45",
//     Authorization: "OAuth zrjuwb8rgcydcsvebw9k8n0nibhg1e",
//     Accept: "application/vnd.twitchtv.v5+json"
//   }
// });
// let req = request.defaults({
//   headers: {
//     "Client-ID": "fwidrp0e5f0nza5cltuqgb19fx9f45",
//     Authorization: "Bearer zrjuwb8rgcydcsvebw9k8n0nibhg1e",
//   }
// });

const twitchRequest = axios.create({
  headers: {
    "Client-ID": "fwidrp0e5f0nza5cltuqgb19fx9f45",
    Authorization: "Bearer zrjuwb8rgcydcsvebw9k8n0nibhg1e",
  }
});

//const url = "https://api.twitch.tv/kraken/streams/30600786";
const url = "https://api.twitch.tv/helix/users?id=30600786";
const webhookUrl = "https://api.twitch.tv/helix/webhooks/hub";

let knownType = false;

let stream = {
  id: null,
  live: null,
  title: null,
  startedAt: null,
  error: null,
  eventAt: null,
  gameId: null
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
      game
    }
  },
  isLive() {
    return live;
  },
  startWebhook() {
    twitchRequest.post(webhookUrl, {
        "hub.callback": "https://renthebot.web.app/webhooks/stream",
        "hub.mode": "subscribe",
        "hub.topic": "https://api.twitch.tv/helix/streams?user_id=30600786",
        "hub.lease_seconds": 60*60*24*7
    }).then((res) => {
      if (res.status !== 202) {
        console.log("ERROR: Something went wrong");
        console.dir(res.data);
      } else {
        console.log(`Created WebHook. Status: ${res.status} ${res.statusText}`);
      }
    }).catch((error) => {
      console.log("Proper error: " + error);
    });
  },
  restartLiveListner() {
    if (liveListner) liveListner();
    startLiveListner();
    this.startWebhook();
  }
};

let liveListner;

startLiveListner();

function startLiveListner() {
  liveListner = db.collection("stream").doc("live").onSnapshot(async (doc) => {
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
        say("rendogtv", `The stream is now unfortunately over. Join us next time, probably on ${nextDay}`);
      }
      return;
    };
    let game = null;
    try {
      game = (await twitchRequest.get(`https://api.twitch.tv/helix/games?id=${stream.gameId}`)).data[0].name;
      console.log(game);
    } catch (error) {
      game = null;
    }
    knownType = false;
    type = getKnownType(stream.title, game);
    if (type === "Nothing" || type.includes("something unusual")) knownType = false;
    else knownType = true;

    if (prevStream.live === false) {
      newStream.onNewStream();
      if (stream.startedAt > Date.now() - 2*60*1000) {
        if (knownType) commands.updateCommands(type, false);
        console.log("Saying live 1");
        say("rendogtv", `We have gone live${type ? ', playing ' + type: ''}. Congratz on being here before the stream even started!`);
        setTimeout(async () => {
          if (stream.live) {
            let viewers = null;
            try {
              viewers = (await twitchRequest.get("https://api.twitch.tv/helix/streams?user_id=30600786")).data.data[0].viewer_count;
              console.log(viewers)
            } catch (error) {
              console.log("Error getting viewers " + error);
            }
            console.log("Saying live 2");
            say("rendogtv", `Welcome to the stream, notification squad${viewers ? ', ' + viewers + ' viewers atm': ''} people! We are playing ${type}. Commands for this stream: !commands`);
          }
        }, 1000*10);
      }
    } else if ( prevStream.title !== null && prevStream.title !== stream.title){
      console.log("Switched title");
      if (knownType) commands.updateCommands(type, true);
    }
  });
}

// const sendRequest = () => {
//   req(url, (err, res, body) => {
//     let success = true;
//     if (res.statusCode !== 200) {
//       console.log("Not 200! Status code is " + res.statusCode);
//       return;
//     }
//     console.log(`Status Code: ${res.statusCode}, statusMessage: ${res.statusMessage}`);
//     try {
//       body = JSON.parse(body);
//       if (body == null || body == undefined) {
//         live = false;
//         return;
//       }
//       console.dir(body);
//       return;
//       success = true;
//     } catch (error) {
//       console.dir(error);
//       success = false;
//     }
    
//     const stream = body.stream;
//     if (stream === undefined || success === false) {
//       live = false;
//       return;
//     }

//     if (stream === null) {
//       live = false;
//     } else {
//       console.log("stream is not null");
//       if (live === false) {
//         console.log("live was false");
//         const prevStartTime = startedTime;
//         console.log("Prev start time: " + prevStartTime)
//         const startTime = new Date(stream["created_at"]);
//         console.log(`Startime: ${startTime}, prevStartTime: ${prevStartTime}, diff: ${startTime - prevStartTime}`);
//         if (startTime - prevStartTime > 60 * 60 * 1000) {
//           const diff = Date.now() - startTime.getTime();
//           if (diff < 600 * 1000) {
//             console.log("Diff is small");
//             setTimeout(() => {
//               say(
//                 "rendogtv",
//                 `Welcome to the stream everyone! Today we are playing ${type()}`
//               );
//             }, 600 * 1000 - diff);
//           }
//         }
//       }

//       if (live !== true) {
//         live = true;
//         newStream.onNewStream();
//         console.log("New stream");
//       }

//       if (id !== stream._id) id = stream._id;

//       if (title === null) {
//         console.log("Title was null");
//         console.log(`Known Type: ${knownType}`);
//         title = stream.channel.status;
//         knownType = title !== "Nothing";
//         if (knownType) commands.updateCommands(type(), false);
//       } else if (title !== stream.channel.status) {
//         console.log("New title");
//         title = stream.channel.status;
//         if (knownType) commands.updateCommands(type(), true);
//       }

//       if (game !== stream.game) game = stream.game;

//       if (viewers !== stream.viewers) viewers = stream.viewers;

//       if (startedTime !== stream["created_at"])
//         startedTime = stream["created_at"];

//       console.log("Title: " + title);
//     }
//   });
// };

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
};

// sendRequest();
// setInterval(() => {
//   sendRequest();
// }, 100 * 1000);
