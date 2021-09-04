import { db, admin } from "../utilities/firestore.mjs";

const rendogtvDoc = db.collection("channels").doc("rendogtv");

export default {
  addToLine(displayName) {
    rendogtvDoc.update({
      line: admin.firestore.FieldValue.arrayUnion(displayName),
    });
    return `@${displayName} You are now in the line, if you know what im sayin!`;
  },
  removeFromLine(displayName) {
    rendogtvDoc.update({
      line: admin.firestore.FieldValue.arrayRemove(displayName),
    });
    return `@${displayName} You left the line :(`;
  },
  async printLine() {
    const doc = await rendogtvDoc.get();
    let string = "The following is in the line: ";
    const line = doc.data().line;

    line.forEach((displayName) => {
      string += `@${displayName} `;
    });

    return string;
  },
  resetLine() {
    rendogtvDoc.update({ line: [] });
  },
};
