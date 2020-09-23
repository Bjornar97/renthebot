import { db, admin } from "../utilities/firestore";

const rendogtvDoc = db.collection("channels").doc("rendogtv");

export default {
  async butt() {
    console.log("Going into butt");
    try {
      let doc = await rendogtvDoc.get();
      rendogtvDoc.update({ butt: admin.firestore.FieldValue.increment(1) });
      return `Shake shake shake! Ren has said "butt" ${
        doc.data().butt + 1
      } time${doc.data().butt > 0 ? "s" : ""}!`;
    } catch (error) {
      console.log("ERROR: ");
      console.dir(error);
    }
  },
  resetButt() {
    db.collection("channels").doc("rendogtv").update({ butt: 0 });
  },
  async onemore() {
    console.log("Going into onemore");
    try {
      let doc = await rendogtvDoc.get();
      rendogtvDoc.update({ onemore: admin.firestore.FieldValue.increment(1) });
      return `Ren's "one more" count of the evening: ${doc.data().onemore + 1}`;
    } catch (error) {
      console.log("ERROR: ");
      console.dir(error);
    }
  },
  resetOnemore() {
    db.collection("channels").doc("rendogtv").update({ onemore: 0 });
  },
};
