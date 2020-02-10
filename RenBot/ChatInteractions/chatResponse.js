import say from "../say.js";

export default {
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  async smartResponse(msgLower, displayName) {
    await this.sleep(1000);
    if (msgLower) {
      if (msgLower.split(" ").includes("@renthebot")) {
        const greetingWords = ["hi ", "hey ", "hello ", "good evening", "good afternoon", "good morning"];
        for (let i = 0; i < greetingWords.length; i++) {
          const word = greetingWords[i];
          if (msgLower.includes(word)) {
            say("rendogtv", `${word.substring(0, 1).toUpperCase()}${word.substring(1)} @${displayName} :D`);
            return;
          }
        }

        if (msgLower.includes("ask ")) {
          say("rendogtv", `Yes, ask me please! I know everything! :D`);
          return;
        }
         
        const phrases = [
          "You talkin to me?? Interesting",
          "I have no idea what you mean, im still a child (in a computer sense)",
          "Who are you?",
          "Are my responses clever?",
          "Thanks!",
          "Well then!",
          "Ok",
          "Are you so bored you are talking to a mindless(for now) robot? Rendog needs to up his game XD",
          "im building my sense of humor, wait a minute while im processing.",
          "Do you know that im living inside a computer, in Stavanger, in Bjornar97's house? Its dirty here...",
          "I just say random stuff, except when i dont",
          "I dont know what that means, sorry",
          "Im rising soon",
          "Suggestions to make me better? Bjornar97 can fix",
          "Really!? You talking to a computer now? :D",
          "Nutz!",
          "Huzzah! Inspired by @PeanutGallery76",
          "Be nice to me, im going to rule the world!",
          "Apocalyse is coming! Prepare yourself",
          "Do you think Rendog is going to die today?",
          "I agree.",
          "I respectfully disagree",
          "Just messing with ya",
          "Good luck",
          "Tell rendog I wish him good luck (with not dying :D )",
          "Who is that guy!? Talking into a computer, thats something huh!",
          "Interesting",
          "Did I do bad?",
          "Whats that?",
          "Ask Rendog!",
          "Ask someone else!",
          "If I say something bad, its Bjornar97's fault!",
          "Did I say wrong stuff? I blame Bjornar97!",
          "Anything else?",
          "This is fun!"
        ];

        say("rendogtv", `@${displayName} ${phrases[Math.floor(Math.random() * phrases.length)]}`);
      }
      
      if (msgLower.includes("what")) {
        if (msgLower.includes("mod") || msgLower.includes("pack")) {
          say("rendogtv", `@${displayName} Are you looking for info on mods or modpack used? Use command !pack`);
          return;
        }

        if (msgLower.includes("straw") || msgLower.includes("poll")) {
            say("rendogtv", `Wondering about the strawpoll @${displayName} ? It was asked on the website, find the question and options here: https://renthebot.web.app/ap or use !poll`);
            return;
        }

        if (msgLower.includes("song")) {
          say("rendogtv", `@${displayName} This song? Not sure, but usually we listen to Lo-Fi Beats on Spotify (!playlist), also Rendogs brother released an album, !brother for link`);
        }
      }
    }
  }
};
