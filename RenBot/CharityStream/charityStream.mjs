import sheetsConnection from "./sheetsConnection.mjs";
import tiltifyConnection from "./tiltifyConnection.mjs";
import charitySettings from "./charitySettings.mjs";
import say from "../say.mjs";

let tiltifyStarted = false;
let sheetsStarted = false;

const charityStream = {
  gatherTiltifyDonations() {
    if (!charitySettings.isEnabled()) {
      return;
    }

    try {
      tiltifyConnection.updateDonations();
    } catch (error) {
      say(
        "rendogtv",
        "Gathering donations from Tiltify failed! I need help, @Bjornar97"
      );
    }
  },
  putDonationsInSheet() {
    if (!charitySettings.isEnabled()) {
      return;
    }

    try {
      sheetsConnection.appendMissingDonations();
    } catch (error) {
      say(
        "rendogtv",
        "Putting donations into spreadsheet failed! I need help, @Bjornar97"
      );
    }
  },
};

if (!tiltifyStarted) {
  tiltifyStarted = true;
  setInterval(() => {
    charityStream.gatherTiltifyDonations();
  }, 20000);
}

if (!sheetsStarted) {
  sheetsStarted = true;
  setTimeout(() => {
    setInterval(() => {
      charityStream.putDonationsInSheet();
    }, 20000);
  }, 10000);
}

export default charityStream;
