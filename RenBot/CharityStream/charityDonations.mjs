import { db } from "../utilities/firestore.mjs";

let info;

db.collection("charity")
  .doc("donationsInfo")
  .onSnapshot((doc) => {
    info = doc.data();
  });

export default {
  getLastId() {
    return info.lastId;
  },
  async getDonationsNotInSheet() {
    const donations = await this.getDonationsCollectionRef()
      .where("addedToSheet", "==", false)
      .get();

    return donations;
  },
  getDonationInfoRef() {
    return db.collection("charity").doc("donationsInfo");
  },
  getDonationsCollectionRef() {
    return this.getDonationInfoRef().collection("donations");
  },
};
