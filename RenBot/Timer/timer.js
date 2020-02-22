import say from "../say";

let startTimes = new Map();
let intervals = {};
let lastGivenInfo = null;

export default {
    timer(comArray) {
        let index = comArray.findIndex((value) => value === "-n");
        let name = "default";
        if (index !== -1) name = comArray[index + 1];

        switch (comArray[0]) {
            case "info":
                if (lastGivenInfo !== null) {
                    if (Date.now() - lastGivenInfo < 5000) {
                        return;
                    }
                }
                lastGivenInfo = Date.now();
                if (startTimes.get(name)) {
                    return `TIMER ${name === "default" ? '': name}: ${this.getTime(startTimes.get(name))}`;
                } else {
                    return `The timer ${name === "default" ? '': name} is not started`;
                }
                
            case "start":
                let startTime = startTimes.get(name);
                if (typeof startTime === "number") {
                    return `{user} The timer ${name === "default" ? '': name} has alredy started. To stop it, !timer stop ${name === "default" ? '': " -n" + name}`;
                } else {
                    startTimes.set(name, Date.now());
                    let calloutIndex = comArray.findIndex((value) => value === "-c");
                    if (calloutIndex !== -1) {
                        try {
                            let intervalLenght = parseInt(comArray[calloutIndex + 1]) * 1000 * 60;
                            if (isNaN(intervalLenght)) intervalLenght = 1000*60;
                            if (intervalLenght < 1000*60) intervalLenght = 1000*60;

                            intervals[name] = setInterval(() => {
                                let minutes = Math.round((Date.now() - startTimes.get(name))/(1000*60));
                                say("rendogtv", `TIMER ${name === "default" ? '': name}: ${minutes} minute${minutes > 1 ? 's': ''} has passed!`);
                            }, intervalLenght);
                        } catch (error) {
                            startTimes.delete(name);
                            return `{user} There needs to be a number after -c, or remove -c`;
                        }
                    }
                    return `TIMER ${name === "default" ? '': name} started!`;
                }
                break;

            case "stop":
                if (comArray.includes("-a")) {
                    startTimes.forEach((startTime, name) => {
                        let time = this.getTime(startTime);
                        try {
                            clearInterval(intervals[name]);
                        } catch (error) {
                            console.log("Interval was prob not defined");
                        }

                        startTimes.delete(name);

                        say("rendogtv", `TIMER ${name === "default" ? '': name}: ${time} Stopped`);
                    });
                    return `{user} All timers have been stopped`;
                }

                try {
                    clearInterval(intervals[name]);
                } catch (error) {
                    console.log("Interval was prob not defined");
                }
                let time = this.getTime(startTimes.get(name));
                
                return `TIMER ${name === "default" ? '': name}: ${time} Stopped`;

            case "lap":
                return `{user} Lap has not been implemented yet.`;

            case "advanced":
                return `{user} Advanced timer usage: "!timer start -n <name>" for creating mulitple timers, 
                    where you switch out <name> with the name for the timer. "!timer start -c <minutes>", 
                    this will start a timer that calls out every time we hit <number> minutes`;
        
            default:
                return `{user} Usage for timer: "!timer start" to start timer, "!timer info" to see current time, "!timer stop" to stop timer. "!timer advanced" for advanced usage.`;
        }
    },
    getTime(timestamp) {
        if (timestamp > 0) {
            let diff = new Date(Date.now() - timestamp);
            let mins = diff.getMinutes() > 9 ? diff.getMinutes(): `0${diff.getMinutes()}`;
            let secs = diff.getSeconds() > 9 ? diff.getSeconds(): `0${diff.getSeconds()}`;
            return `${mins}:${secs}`;
        } else {
            return "ERROR";
        }
        
    }
  };
  