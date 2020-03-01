import features from "../utilities/activeFeatures";
import commands from "../utilities/commands";
import subList from "../SubList/subList";
import line from "../ChatFun/line";
import say from "../say";

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
  }
};
