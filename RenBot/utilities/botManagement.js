import client from "../main.js";

export default {
  restart() {
    try {
      client.say("rendogtv", "Restarting, dont use any commands right now");
      const fs = require("fs");
      fs.writeFileSync(
        "./restart.json",
        JSON.stringify({ restart: true, restartTime: Date.now() })
      );
      var child_process = require("child_process");
      setTimeout(() => {
        child_process.exec("pm2 restart all");
      }, 4000);
    } catch (error) {
      client.say(
        "rendogtv",
        "Restart failed, something bad happened! @Bjornar97 , you need to take a look at this."
      );
      console.dir(error);
    }
  },
};
