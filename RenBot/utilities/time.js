export default function convertMillisecToString(milliseconds) {
  console.log(milliseconds);
  const date = new Date(milliseconds);
  const hrs =
    date.getUTCHours() < 10 ? "0" + date.getUTCHours() : date.getUTCHours();
  const min =
    date.getUTCMinutes() < 10
      ? "0" + date.getUTCMinutes()
      : date.getUTCMinutes();
  const sec =
    date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();

  return `${hrs !== "00" ? hrs + "h" : ""}${
    hrs !== "00" || min !== "00" ? min + "m" : ""
  }${sec}s`;
}
