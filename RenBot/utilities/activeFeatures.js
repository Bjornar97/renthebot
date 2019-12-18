import { db } from "./firestore";

let activeFeaturesMap = new Map();

export default {
  isEnabled(id) {
    return activeFeaturesMap.get(id);
  }
};

db.collection("features").onSnapshot(snapshot => {
  snapshot.docChanges().forEach(value => {
    const enabled = value.doc.data().enabled;
    const id = value.doc.id;
    switch (value.type) {
      case "added":
      case "modified":
        activeFeaturesMap.set(id, enabled);
        break;

      case "removed":
        activeFeaturesMap.delete(id);
        break;

      default:
        break;
    }
  });
});
