import client from "../main.js";

export default {
  timeout(displayName, duration, reason) {
    client.timeout("rendogtv", displayName, duration, reason);
  },
  deleteMessage(id) {
    client.deletemessage("rendogtv", id).then((val) => {
      console.log("Deleted message " + id);
    }).catch((error) => {
      console.log("ERROR: ");
      console.dir(error);
    });
  }
};
