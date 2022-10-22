import tiltifyApi from "../../tiltifyAPI.mjs";
import axios from "axios";
import charitySettings from "./charitySettings.mjs";
import charityDonations from "./charityDonations.mjs";
import { db } from "../utilities/firestore.mjs";

let bearer = tiltifyApi.bearerToken;

let campaignId = 460726;
let url = `https://tiltify.com/api/v3/campaigns/${campaignId}/donations`;

const maxAttempts = 10;
const countPerPage = 50;

let lastId;

const firstId = 6322738;

export default {
  async sendRequest(params) {
    return await axios.get(url, {
      headers: {
        Authorization: `Bearer ${bearer}`,
      },
      params,
    });
  },
  async sendDonationsRequestAfter(after = null) {
    let params = {};

    if (after !== null) {
      params.after = after;
    }

    params.count = countPerPage;

    return await this.sendRequest(params);
  },
  async sendDonationsRequestBefore(before = null) {
    let params = {};

    if (before !== null) {
      params.before = before;
    }

    params.count = countPerPage;

    return await this.sendRequest(params);
  },
  async getNextDonations(afterId) {
    let donations = [];

    let maxTries = maxAttempts;

    let response;

    do {
      maxTries--;
      response = await this.sendDonationsRequestAfter(afterId);

      if (response.data.data.length > 0) {
        afterId = response.data.data[0].id;
      }

      const lastEntry = response.data.data.at(-1);

      if (lastEntry) {
        lastId = lastEntry.id;
      }

      response.data.data.forEach((donation) => {
        donations.push(donation);
      });
    } while (response.data.data.length > 0 && maxTries > 0);

    return donations;
  },
  async updateDonations() {
    if (!charitySettings.isEnabled()) {
      return;
    }

    let prevLastId = charityDonations.getLastId();

    let donations;

    if (!prevLastId) {
      prevLastId = firstId;
    }

    donations = await this.getNextDonations(prevLastId);

    if (donations.length <= 0) {
      return;
    }

    try {
      await db.runTransaction(async (t) => {
        let shouldWrite = [];

        let readPromises = [];

        for (const donation of donations) {
          readPromises.push(
            new Promise(async (resolve, reject) => {
              const doc = await charityDonations
                .getDonationsCollectionRef()
                .doc(donation.id.toString())
                .get();

              if (!doc.exists) {
                shouldWrite.push(donation);
              }

              resolve();
            })
          );
        }

        await Promise.all(readPromises);

        let writePromises = [];

        for (const donation of shouldWrite) {
          writePromises.push(
            charityDonations
              .getDonationsCollectionRef()
              .doc(donation.id.toString())
              .set({
                name: donation.name,
                amount: donation.amount,
                comment: donation.comment,
                completedAt: donation.completedAt,
                addedToSheet: donation.amount < charitySettings.getMinAmount(),
              })
          );
        }

        await Promise.all(writePromises);

        await charityDonations.getDonationInfoRef().update({
          lastId: lastId,
        });
      });
    } catch (error) {
      console.error(error);
    }
  },
};
