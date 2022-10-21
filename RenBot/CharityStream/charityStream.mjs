import sheetsConnection from "./sheetsConnection.mjs";
import tiltifyConnection from "./tiltifyConnection.mjs";

export default {
  async test() {
    try {
      sheetsConnection.append();
    } catch (error) {
      console.error(error);
      return "Something went wrong";
    }

    return "success?";
  },
  async testDonations() {
    try {
      await tiltifyConnection.updateDonations();

      await setTimeout(() => {
        sheetsConnection.appendMissingDonations();
      }, 3000);

      return "success?";
    } catch (error) {
      console.error(error);

      return "Error!";
    }
  },
};
