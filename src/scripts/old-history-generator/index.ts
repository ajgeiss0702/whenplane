// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import {fetchFloatplaneShows, FloatplanePost} from "./floatplane-fetcher.ts";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import {fileExists} from "./utils.ts";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import {fetchYoutubeShows, SpecificData} from "./youtube-fetcher.ts";

import 'dotenv/config'
import type {HistoricalEntry} from "$lib/utils";
import fs from "node:fs/promises";

export const floatplaneDataPath = "src/scripts/old-history-generator/floatplane-wan-vods.json"
export const youtubeDataPath = "src/scripts/old-history-generator/youtube-wan-vods.json";
export const outputDataPath = "src/scripts/old-history-generator/output.json";

if(!await fileExists(floatplaneDataPath)) {
    console.log("Missing floatplane vod data! I'm going to fetch it from floatplane. This can take a bit");
    await fetchFloatplaneShows()
} else {
    console.log("Floatplane data already exists. Skipping download");
}

if(!await fileExists(youtubeDataPath)) {
    console.log("Missing youtube vod data! I'm going to fetch it from youtube's api. This can take a bit");
    await fetchYoutubeShows()
} else {
    console.log("Youtube data already exists. Skipping download");
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const floatplaneData = (await import("./floatplane-wan-vods.json", {assert: {type: 'json'}})).default as unknown as {[key: string]: FloatplanePost};
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const youtubeData = (await import("./youtube-wan-vods.json", {assert: {type: 'json'}})).default as unknown as {[key: string]: SpecificData};

const youtubeNumber = Object.keys(youtubeData).length;

console.log(Object.keys(floatplaneData).length + " floatplane videos");
console.log(youtubeNumber + " youtube videos");

const oldShows: HistoricalEntry[] = [];

let i = 0;
for (const date in youtubeData) {
    const floatplaneVod = floatplaneData[date];
    const youtubeVod = youtubeData[date];

    if(!youtubeVod.liveStreamingDetails) {
        console.warn(date + " is missing liveStreamingDetails!");
        continue;
    }

    if(!floatplaneVod) {
        console.warn(date + " is missing floatplane entry!")
    }

    const mainShowStart = youtubeVod.liveStreamingDetails.actualStartTime;
    const showEnd = youtubeVod.liveStreamingDetails.actualEndTime;
    let preShowStart;

    if(floatplaneVod) {
        const floatplaneLength = floatplaneVod.metadata.videoDuration * 1000;
        const youtubeLength = new Date(youtubeVod.liveStreamingDetails.actualEndTime).getTime() - new Date(youtubeVod.liveStreamingDetails.actualStartTime).getTime();

        const preShowLength = floatplaneLength - youtubeLength;

        preShowStart = new Date(mainShowStart);
        preShowStart.setMilliseconds(preShowStart.getMilliseconds() - preShowLength);
    }

    const rawTitle = youtubeVod.snippet?.title;
    let title;
    if(rawTitle) {
        const parts = rawTitle.split(" - ");
        parts.pop(); // do a pop to only remove the stuff after the *last* dash
        title = parts.join(" - ");
    }

    oldShows.push({
        name: date,
        metadata: {
            preShowStart: preShowStart ? preShowStart.toISOString() : undefined,
            mainShowStart,
            showEnd,
            title,
            vods: {
                floatplane: floatplaneVod ? floatplaneVod.id : undefined,
                youtube: youtubeVod.id
            },
            snippet: youtubeVod.snippet
        }
    });


    i++;
    if(i % 50 == 0) {
        console.log("Status: " + i + "/" + youtubeNumber + " shows processed (" + (Math.floor((i/youtubeNumber) * 1000) / 10) + "%)")
    }
}

await fs.writeFile(outputDataPath, JSON.stringify(oldShows, undefined, '\t'))
console.log("Done!")





