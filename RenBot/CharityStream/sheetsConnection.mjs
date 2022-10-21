import { google } from "googleapis";
import charityDonations from "./charityDonations.mjs";
import { db } from "../utilities/firestore.mjs";

const sheets = google.sheets("v4");
const spreadsheetId = "1OYh7lAFQJEfQMV5iHVuglVHzRGystWdBt3xP73pKnzY";

let sheetInstance;
let auth;

export default {
  async getSheetInstance() {
    if (sheetInstance) {
      return sheetInstance;
    }

    auth = new google.auth.GoogleAuth({
      keyFile: "adminKey.json",
      scopes: "https://www.googleapis.com/auth/spreadsheets",
    });

    const authClientObject = await auth.getClient();

    const googleSheetsInstance = google.sheets({
      version: "v4",
      auth: authClientObject,
    });

    sheetInstance = googleSheetsInstance;

    return sheetInstance;
  },
  async append(values) {
    const sheet = await this.getSheetInstance();

    await sheet.spreadsheets.values.append({
      auth,
      spreadsheetId,
      range: "APITest!A:E",
      valueInputOption: "USER_ENTERED",
      resource: {
        values,
      },
    });
  },
  async appendMissingDonations() {
    const donations = await charityDonations
      .getDonationsCollectionRef()
      .where("addedToSheet", "==", false)
      .get();

    if (donations.empty) {
      console.log("No missing donations");
      return;
    }

    const valuesToAppend = [];

    donations.forEach(async (doc) => {
      try {
        const data = doc.data();

        valuesToAppend.push([data.name, "", data.amount, data.comment, ""]);

        await charityDonations.getDonationsCollectionRef().doc(doc.id).update({
          addedToSheet: true,
        });
      } catch (error) {
        console.error(error);
      }
    });

    this.append(valuesToAppend);
  },
};
