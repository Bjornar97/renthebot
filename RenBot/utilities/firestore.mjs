import admin from "firebase-admin";
import serviceAccount from "../../adminKey.mjs";

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://rendogtv-viewers-bot.firebaseio.com",
  });
} catch (error) {}
let db;

db = admin.firestore();

const subsCollection = db.collection("subs");
const rendogtvDoc = db.collection("channels").doc("rendogtv");

const commandsCollection = db.collection("commands");

export { db, admin };
