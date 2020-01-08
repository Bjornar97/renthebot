import say from "../say";
import features from "../utilities/activeFeatures";

let speed = 0;
let slowEnabled = false;
let length = 0;
let lastUpdate = 0;

export default {
  newMessage() {
    speed += 1;
    setTimeout(() => {
      speed -= 1;
    }, 30 * 1000);

    const slowFeature = features.isEnabled("autoslow");
    if (slowFeature) {
      if (Date.now() - lastUpdate > 5 * 60 * 1000) {
        if (speed > 60 && (!slowEnabled || length !== 60)) {
          say("rendogtv", "/slow 60");
          lastUpdate = Date.now();
        } else if (speed > 30 && (!slowEnabled || length !== 30)) {
          say("rendogtv", "/slow 30");
          lastUpdate = Date.now();
        } else if (slowEnabled) {
          say("rendogtv", "/slowoff");
          lastUpdate = Date.now();
        }
      }
    }
  },
  slowModeUpdate(channel, enabled, length) {
    slowEnabled = enabled;
    length = length;
    lastUpdate = Date.now();
  }
};
