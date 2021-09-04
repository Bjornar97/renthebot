import { db } from "../utilities/firestore.mjs";
export default {
  async suggestion(argumentsArray, displayName) {
    console.log("Got into suggestion");
    if (argumentsArray[0] && argumentsArray[1]) {
      if (argumentsArray[0].trim().toLowerCase() == "link") {
        return this.linkSuggestion(argumentsArray[1].trim(), displayName);
      }
    }

    return await this.getSuggestion();
  },
  async getSuggestion() {
    const suggestionsCollection = db.collection("suggestions");
    const random = Math.round(Math.random() * 64000) + 100000;
    const randomBit = Math.round(Math.random());
    let suggestion = await suggestionsCollection
      .where("random", ">=", random)
      .orderBy("random", randomBit === 1 ? "asc" : "desc")
      .limit(1)
      .get();

    if (suggestion.empty) {
      suggestion = await suggestionsCollection
        .where("random", "<=", random)
        .orderBy("random", randomBit === 1 ? "asc" : "desc")
        .limit(1)
        .get();
    }

    if (suggestion.empty) {
      return "No suggestions yet. Have a suggestion? Go to https://renthebot.web.app/suggestion/new";
    }

    let data = suggestion.docs[0].data();

    return `SUGGESTION${data.user ? " by @" + data.user : ""}: ${
      data.text
    } | Do you have a suggestion for HermitCraft 7? Go to https://renthebot.web.app/suggestion/new`;
  },
  async linkSuggestion(code, displayName) {
    try {
      const suggestionsCollection = db.collection("suggestions");
      let query = await suggestionsCollection
        .where("random", "=", parseInt(code, 10))
        .limit(1)
        .get();
      if (query.docs[0].empty) {
        return `{user} That suggestion does not exist, please check that you have the correct number`;
      }

      if (query.docs[0].data().user) {
        return `{user} This suggestion is already linked`;
      }

      await suggestionsCollection
        .doc(query.docs[0].id)
        .update({ user: displayName });
      return `{user} Successfully linked you to the suggestion.`;
    } catch (error) {
      console.dir(error);
      return "{user} An unkown error occured, try again";
    }
  },
};
