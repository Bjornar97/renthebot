import { db, admin } from "../utilities/firestore";

const rendogtvDoc = db.collection("channels").doc("rendogtv");

export default {
  async blameRen() {
    console.log("Going into blameren");
    try {
      let doc = await rendogtvDoc.get();
      rendogtvDoc.update({ blame: admin.firestore.FieldValue.increment(1) });
      return `${doc.data().blame + 1} has blamed Rendog!`;
    } catch (error) {
      console.log("ERROR: ");
      console.dir(error);
    }
  },

  async blameChat() {
    try {
      let doc = await rendogtvDoc.get();
      rendogtvDoc.update({
        blameChat: admin.firestore.FieldValue.increment(1)
      });
      return `${doc.data().blameChat + 1} has blamed chat!`;
    } catch (error) {
      console.log("ERROR: ");
      console.dir(error);
    }
  },

  async badIdea() {
    try {
      const doc = await rendogtvDoc.get();
      rendogtvDoc.update({ badIdea: admin.firestore.FieldValue.increment(1) });
      return `${doc.data().badIdea + 1} think that is a bad idea.`;
    } catch (error) {
      console.log("ERROR: ");
      console.dir(error);
    }
  },
  resetBlameRen() {
    db.collection("channels")
      .doc("rendogtv")
      .update({ blame: 0 });
  },
  resetBlameChat() {
    db.collection("channels")
      .doc("rendogtv")
      .update({ blameChat: 0 });
  },
  resetBadIdea() {
    db.collection("channels")
      .doc("rendogtv")
      .update({ badIdea: 0 });
  }
};
