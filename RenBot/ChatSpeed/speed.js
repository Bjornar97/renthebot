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

    const slowFeature = features.isEnabled("autoSlow");
    if (slowFeature) {
      if (Date.now() - lastUpdate > 1 * 60 * 1000 ) {
        if (speed > 100 && (!slowEnabled || length !== 120)) {
          say("rendogtv", "/slow 120");
          this.slowModeUpdate(true, 120)
        } else if (speed > 60 && (!slowEnabled || length !== 60)) {
          say("rendogtv", "/slow 60");
          this.slowModeUpdate(true, 60)
        } else if (speed > 30 && (!slowEnabled || length !== 30)) {
          say("rendogtv", "/slow 30");
          this.slowModeUpdate(true, 30)
        } else if (slowEnabled === true) {
          console.log("Slowmode: " + slowEnabled)
          say("rendogtv", "/slowoff");
          this.slowModeUpdate(false, 0);
        }  
      }
    }
  },
  slowModeUpdate(enabled, length) {
    slowEnabled = enabled;
    length = length;
    lastUpdate = Date.now();
  }
};
