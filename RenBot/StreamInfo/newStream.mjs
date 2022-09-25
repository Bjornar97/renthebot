import features from "../utilities/activeFeatures.mjs";
import commands from "../utilities/commands.mjs";
import line from "../ChatFun/line.mjs";
import say from "../say.mjs";

export default {
  onNewStream() {
    if (features.isEnabled("autoResetLine")) {
      line.resetLine();
    }

    commands.restartListner();
    features.restartListner();
  },
};
