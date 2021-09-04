import { db } from "../utilities/firestore.mjs";
const subsCollection = db.collection("subs");

export default {
  addSub(displayName, months, task) {
    if (!task) task = "Any";
    try {
      task = task.charAt(0).toUpperCase() + task.substring(1);
      const docref = subsCollection.doc(displayName);
      docref.get().then((doc) => {
        if (doc.exists) {
          docref.update({
            name: displayName,
            months: months,
            will: task,
            timestamp: Date.now(),
          });
        } else {
          docref.set({
            name: displayName,
            months: months,
            will: task,
            selected: false,
            timestamp: Date.now(),
          });
        }
        // TODO: look into this: registered(displayName);
      });
    } catch (error) {
      console.log("ERROR:");
      console.dir(error);
    }
  },
  removeSub(displayName) {
    subsCollection.doc(displayName).delete();
  },
  resetSubList() {
    try {
      subsCollection.get().then((snapshot) => {
        snapshot.docs.forEach((doc) => {
          db.collection("subs").doc(doc.id).delete();
        });
      });
    } catch (error) {
      console.log("ERROR: ");
      console.dir(error);
    }
  },
};
