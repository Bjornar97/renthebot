import features from "../utilities/activeFeatures.mjs";
import commands from "../utilities/commands.mjs";
import subList from "../SubList/subList.mjs";
import line from "../ChatFun/line.mjs";
import say from "../say.mjs";

export default {
  onNewStream() {
    if (features.isEnabled("autoReset")) {
      subList.resetSubList();
    }

    if (features.isEnabled("autoResetLine")) {
      line.resetLine();
    }

    commands.restartListner();
    features.restartListner();
  },
};
