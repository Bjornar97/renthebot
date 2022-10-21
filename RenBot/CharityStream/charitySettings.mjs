import { db } from "../utilities/firestore.mjs";

let settings;

db.collection("charity")
  .doc("settings")
  .onSnapshot((doc) => {
    settings = doc.data();
  });

export default {
  getLastId() {
    return settings.lastId;
  },
  isEnabled() {
    if (!settings) return false;

    return settings.enabled;
  },
  getMinAmount() {
    return settings.minAmount;
  },
};
