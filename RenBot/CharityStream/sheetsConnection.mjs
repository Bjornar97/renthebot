import { google } from "googleapis";
import charityDonations from "./charityDonations.mjs";
import { db } from "../utilities/firestore.mjs";

const sheets = google.sheets("v4");
const spreadsheetId = "1OYh7lAFQJEfQMV5iHVuglVHzRGystWdBt3xP73pKnzY";
const sheetId = "0";

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

    const border = {
      style: "SOLID",
      colorStyle: {
        rgbColor: {
          red: 0,
          green: 0,
          blue: 0,
        },
      },
    };

    const formattedValues = values.map((row) => {
      return {
        values: row.map((value, index) => {
          const cellValue = {};

          if (typeof value === "number") {
            cellValue.numberValue = value;
          } else {
            cellValue.stringValue = value;
          }

          let textFormat = {
            fontSize: 12,
          };
          let numberFormat = {};

          let horizontalAlignment = "LEFT";
          let verticalAlignment = "MIDDLE";

          let padding = {
            top: 10,
            left: 20,
            right: 20,
            bottom: 10,
          };

          let wrapStrategy = "CLIP";

          if (index === 2) {
            textFormat.fontSize = 18;
            textFormat.bold = true;
            numberFormat.type = "CURRENCY";
            numberFormat.pattern = '"$"#,##0.00';
            horizontalAlignment = "CENTER";
          }

          if (index === 3 || index === 4) {
            wrapStrategy = "WRAP";
          }

          return {
            userEnteredValue: cellValue,
            userEnteredFormat: {
              backgroundColor: {
                red: 0.93,
                green: 0.47,
                blue: 0.47,
              },
              borders: {
                top: border,
                bottom: border,
                left: border,
                right: border,
              },
              numberFormat,
              textFormat,
              horizontalAlignment,
              verticalAlignment,
              padding,
              wrapStrategy,
            },
          };
        }),
      };
    });

    const requests = [
      {
        appendCells: {
          rows: formattedValues,
          sheetId,
          fields: "userEnteredValue,userEnteredFormat",
        },
      },
    ];

    await sheet.spreadsheets.batchUpdate({
      auth,
      spreadsheetId,
      resource: {
        requests,
      },
    });

    await sheet.spreadsheets.batchUpdate({
      auth,
      spreadsheetId,
      resource: {
        requests: [
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId,
                dimension: "ROWS",
                startIndex: 1,
              },
            },
          },
        ],
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

    try {
      const valuesToAppend = [];
      const docIdsToAppend = [];

      donations.forEach((doc) => {
        try {
          const data = doc.data();

          valuesToAppend.push([data.name, "", data.amount, data.comment, ""]);

          docIdsToAppend.push(doc.id);
        } catch (error) {
          console.error(error);
        }
      });

      this.append(valuesToAppend);

      docIdsToAppend.forEach(async (id) => {
        await charityDonations.getDonationsCollectionRef().doc(id).update({
          addedToSheet: true,
        });
      });
    } catch (error) {
      console.error(error);
    }
  },
};
