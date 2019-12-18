export default {
  removeFirstSymbol(string, symbol) {
    if (string.charAt(0) === symbol) {
      return string.substring(1);
    } else {
      return string;
    }
  },
  hasFirstLetter(string, letter) {
    if (string.charAt(0) === letter) {
      return true;
    } else {
      return false;
    }
  },
  removeFirstWord(string) {
    let array = string.split(" ");
    array.shift();
    return array.join(" ");
  }
};
