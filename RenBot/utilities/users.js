import client from "../index";

export default {
  timeout(displayName, duration, reason) {
    client.timeout("rendogtv", displayName, duration, reason);
  }
};
