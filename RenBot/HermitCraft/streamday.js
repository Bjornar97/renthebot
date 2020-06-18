import { db } from "../utilities/firestore";
import say from "../say";

const streamdayCollection = db.collection("hermitcraft").doc("livestreamdays").collection("days");

export default {
    async getNextStreamDayID() {
        let date = new Date();
        const dateString =
            `${date.getUTCFullYear()}-${date.getUTCMonth() + 1 > 9 ? date.getUTCMonth() + 1: `0${date.getUTCMonth() + 1}`}-${date.getUTCDate() > 9 ? date.getUTCDate() : `0${date.getUTCDate()}`}`;

        try {
            const streamday = await streamdayCollection.where("end", ">=", date).limit(1).get();
            console.log(streamday.docs);
            return streamday.docs[0].id;
        } catch (error) {
            console.log("Error: " + error);
            return null;
        }
    },
    async getNextStreamer() {
        let streamdayid = await this.getNextStreamDayID();
        console.log("Streamday ID: " + streamdayid);
        if (streamdayid === null) {
            return "No streamday is active";
        }

        let date = new Date();
        try {
            let streamer = await streamdayCollection.doc(streamdayid).collection("streamers").where("start", ">=", date).orderBy("start").limit(1).get();
            let streamerDoc = streamer.docs[0];
            console.log(streamerDoc);

            console.log(streamerDoc.data());
            let startDate = streamerDoc.data().start.toDate();


            let startStrings = [];
            const timeZones = ["UTC"];

            timeZones.forEach(timezone => {
                if (startDate.getUTCDate() === date.getUTCDate() && Math.abs(date.getTime() - startDate.getTime()) < 1000*60*60*24*1) {    
                    startStrings.push(startDate.toLocaleTimeString('en-GB',
                        { hour: '2-digit', minute: '2-digit', timeZone: timezone, timeZoneName: "short" }
                    ));
                } else {
                    startStrings.push(startDate.toLocaleDateString('en-GB',
                    { weekday: 'short', month: 'short', day: 'numeric' }
                ));
                }
            });

            let string = `${streamerDoc.id.charAt(0).toUpperCase() + streamerDoc.id.slice(1)} is up next. Starting at `;

            startStrings.forEach((timeString) => {
                string = string + `${timeString}, `;
            });

            string = string.substring(0, string.length - 2);

            return string;
        } catch (error) {
            console.log("Error: " + error);
            return "No streamer is up next";
        }
    }
};
