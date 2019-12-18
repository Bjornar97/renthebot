import { db, admin } from "../utilities/firestore";
const usersCollection = db.collection("users");

export default {
  async rollDice(displayName) {
    const sides = 6;
    const num = Math.floor(Math.random() * sides) + 1;
    const docRef = usersCollection.doc(displayName);
    const doc = await docRef.get();

    let total;
    let numberOfRolls;
    if (doc.exists) {
      total = doc.data().total + num;
      numberOfRolls = doc.data().number + 1;
      docRef.update({
        total: admin.firestore.FieldValue.increment(num),
        number: admin.firestore.FieldValue.increment(1)
      });
    } else {
      docRef.set({
        total: num,
        number: 1
      });
      total = num;
      numberOfRolls = 1;
    }

    return `@${displayName} You rolled a ${num}. Your average is ${Math.round(
      (total / numberOfRolls) * 100
    ) / 100}`;
  }
};
