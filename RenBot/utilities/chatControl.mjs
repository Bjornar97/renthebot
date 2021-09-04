import client from "../main.mjs";

export default {
  setFollowerMode(minutes = 30) {
    client.followersonly("rendogtv", minutes);
  },
  removeFollowersMode() {
    client.followersonlyoff("rendogtv");
  },
  setSlowmode(seconds) {
    client.slow("rendogtv", seconds);
  },
  removeSlowmode() {
    client.slowoff("rendogtv");
  },
};
