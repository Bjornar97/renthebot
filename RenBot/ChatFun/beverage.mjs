export default {
  beverage(displayName, targetName, argumentsArray) {
    if (!argumentsArray[0]) {
      return `@${displayName} enjoys a tasty beverage!`;
    } else {
      let endString = "a tasty beverage";
      if (argumentsArray[1]) {
        endString = "";
        for (let i = 1; i < argumentsArray.length; i++) {
          const element = argumentsArray[i];
          endString += " " + element;
        }
      }
      return `@${displayName} sends @${targetName} ${endString}`;
    }
  }
};
