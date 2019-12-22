import client from "../index";

export default {
  timeout(displayName, duration, reason) {
    client.timeout("rendogtv", displayName, duration, reason);
  },
  deleteMessage(id) {
    client.deletemessage("rendogtv", id);
  }
};
