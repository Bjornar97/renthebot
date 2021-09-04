import { db } from "../utilities/firestore.mjs";
const MCNamesCollection = db.collection("mcnames");

export default {
  setMCName(displayName, MCName) {
    if (MCName) {
      MCNamesCollection.doc(displayName).set({
        twitch: displayName,
        mcname: MCName,
      });
      return `@${displayName} Your Minecraft-name "${MCName}" was added to the website.`;
    } else {
      return `@${displayName} Usage: "!mcname your-minecraft-name" to add yourself to this website: https://renthebot.web.app/mc-names`;
    }
  },
  removeMCName(displayName) {
    MCNamesCollection.doc(displayName).delete();
    return `@${displayName} Your Minecraft-name was removed from the website.`;
  },
};
