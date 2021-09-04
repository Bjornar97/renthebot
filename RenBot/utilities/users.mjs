import client from "../main.mjs";

export default {
  ban(username, reason) {
    client.ban("rendogtv", username, reason);
  },
  timeout(displayName, duration, reason) {
    client.timeout("rendogtv", displayName, duration, reason);
  },
  deleteMessage(id) {
    client
      .deletemessage("rendogtv", id)
      .then((val) => {
        console.log("Deleted message " + id);
      })
      .catch((error) => {
        console.log("ERROR: ");
        console.dir(error);
      });
  },
};
