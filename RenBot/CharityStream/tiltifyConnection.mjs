import tiltifyApi from "../../tiltifyAPI.mjs";
import axios from "axios";
import charitySettings from "./charitySettings.mjs";
import charityDonations from "./charityDonations.mjs";
import { db } from "../utilities/firestore.mjs";

let bearer = tiltifyApi.bearerToken;

let campaignId = 460726;
let url = `https://tiltify.com/api/v3/campaigns/${campaignId}/donations`;

const maxAttempts = 20;
const countPerPage = 50;

let lastId;

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
  async getAllDonations() {
    console.log("Getting donations");
    let donations = [];

    let response;

    let maxTries = maxAttempts;

    let beforeId;

    let isFirst = true;

    do {
      maxTries--;
      response = await this.sendDonationsRequestBefore(beforeId);

      if (response.data.data.length > 0) {
        beforeId = response.data.data.at(-1).id;

        if (isFirst) {
          console.log(`Set last id to ${beforeId}`);
          lastId = response.data.data[0].id;
          isFirst = false;
        }
      }

      response.data.data.forEach((donation) => {
        donations.push(donation);
      });
    } while (response.data.data.length > 0 && maxTries > 0);

    return donations;
  },
  async getNextDonations(afterId) {
    console.log("Getting next donations");
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
        console.log(`Last ID: ${lastId}`);
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

    const prevLastId = charityDonations.getLastId();

    let donations;

    if (!prevLastId) {
      donations = await this.getAllDonations();
    } else {
      donations = await this.getNextDonations(prevLastId);
    }

    console.log({ donations });

    if (donations.length <= 0) {
      return;
    }

    try {
      await db.runTransaction(async (t) => {
        let shouldWrite = [];

        for (const donation of donations) {
          const doc = await charityDonations
            .getDonationsCollectionRef()
            .doc(donation.id.toString())
            .get();

          if (!doc.exists) {
            console.log(`Pushing ${donation.id}`);
            shouldWrite.push(donation);
          }
        }

        console.log({ shouldWrite });

        for (const donation of shouldWrite) {
          console.log(`Setting ${donation.id}`);

          await charityDonations
            .getDonationsCollectionRef()
            .doc(donation.id.toString())
            .set({
              name: donation.name,
              amount: donation.amount,
              comment: donation.comment,
              completedAt: donation.completedAt,
              addedToSheet: donation.amount < charitySettings.getMinAmount(),
            });
        }

        console.log(`lastId: ${lastId}`);

        await charityDonations.getDonationInfoRef().update({
          lastId: lastId,
        });
      });
    } catch (error) {
      console.error(error);
    }
  },
};
