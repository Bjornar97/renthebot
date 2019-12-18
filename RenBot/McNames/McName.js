import { db } from "../utilities/firestore";
const MCNamesCollection = db.collection("mcnames");

export default {
  setMCName(displayName, MCName) {
    MCNamesCollection.doc(displayName).set({
      twitch: displayName,
      mcname: MCName
    });
    return `@${displayName} Your Minecraft-name "${MCName}" was added to the website.`;
  },
  removeMCName(displayName) {
    MCNamesCollection.doc(displayName).delete();
    return `@${displayName} Your Minecraft-name was removed from the website.`;
  }
};
