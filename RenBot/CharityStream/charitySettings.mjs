import { db } from "../utilities/firestore.mjs";
import activeFeatures from "../utilities/activeFeatures.mjs";
let settings;

db.collection("charity")
  .doc("settings")
  .onSnapshot((doc) => {
    settings = doc.data();
  });

export default {
  getLastId() {
    if (!settings) return false;

    return settings.lastId;
  },
  isEnabled() {
    return activeFeatures.isEnabled("charitySpreadsheet");
  },
  getMinAmount() {
    if (!settings) return false;

    return settings.minAmount;
  },
};
