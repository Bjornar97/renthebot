import { db } from "./firestore.mjs";
import strings from "./strings.mjs";

let activeFeaturesMap = new Map();

const featuresCollection = db.collection("features");

export default {
  isEnabled(id) {
    return activeFeaturesMap.get(id);
  },
  enableFeature(displayName, featureId) {
    if (featureId) {
      featureId = strings.removeFirstSymbol(featureId, "!");
      const feature = this.isEnabled(featureId);
      if (feature !== undefined && feature !== null) {
        if (feature) {
          return `@${displayName} The "${featureId}" feature is already enabled"`;
        }
        if (feature !== undefined && feature !== null) {
          featuresCollection.doc(featureId).update({ enabled: true });
          return `The "${featureId}" feature is now enabled`;
        } else {
          return `@${displayName} The feature ${featureId} does not exist`;
        }
      } else {
        return `@${displayName} The feature ${featureId} does not exist`;
      }
    } else {
      return `@${displayName} You need to supply which feature to enable. For example "!enable dice"`;
    }
  },
  disableFeature(displayName, featureId) {
    if (featureId) {
      featureId = strings.removeFirstSymbol(featureId, "!");
      const feature = this.isEnabled(featureId);
      if (feature !== undefined && feature !== null) {
        if (!feature) {
          return `@${displayName} The "${featureId}" feature is already enabled"`;
        }

        if (this.isEnabled(featureId)) {
          featuresCollection.doc(featureId).update({ enabled: false });
          return `The "${featureId}" feature is now disabled`;
        } else {
          return `@${displayName} The feature ${featureId} does not exist`;
        }
      } else {
        return `@${displayName} The feature ${featureId} does not exist`;
      }
    } else {
      return `@${displayName} You need to supply which feature to disable. For example "!disable dice"`;
    }
  },
  restartListner() {
    if (listner) {
      listner();
    }
    startListner();
  },
};

let listner;

function startListner() {
  db.collection("features").onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((value) => {
      console.log(`Updated ${value.doc.id} to ${value.doc.data().enabled}`);
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
}

startListner();
