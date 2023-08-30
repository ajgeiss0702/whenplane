import type {RequestHandler} from "@sveltejs/kit";
import {json} from "@sveltejs/kit";
import type { IsThereWanResponse } from "../isThereWan/+server";
import type { HasDoneResponse } from "../../hasDone/+server";
import type { TwitchResponse } from "../twitch/+server";
import type { YoutubeResponse } from "../youtube/+server";

export const GET = (async ({url, fetch, locals}) => {
    const fast = url.searchParams.get("fast");

    const isThereWan = fetch("/api/isThereWan").then(r => r.json());
    const hasDone = fetch("/api/hasDone").then(r => r.json());

    let twitchTime: number | undefined;
    const twitch = (async () => {
        const start = Date.now();
        const response = await fetch("/api/twitch?short&fast=" + fast)
          .then(r => r.json());
        twitchTime = Date.now() - start;
        return response;
    })();

    // const fpStart = Date.now();
    // const floatplane = await fetch("/api/floatplane?short&fast=" + fast)
    //     .then(r => r.json());
    // const fpTime = Date.now() - fpStart;

    let ytTime: number | undefined;
    const youtube = (async () => {
        const start = Date.now();
        const response = await fetch("/api/youtube?short&fast=" + fast)
          .then(r => r.json());
        ytTime = Date.now() - start;
        return response;
    })();

    const response: AggregateResponse = {
        twitch: await twitch,
        // floatplane,
        youtube: await youtube,
        isThereWan: await isThereWan,
        hasDone: await hasDone
    }

    locals.addTiming({id: "twitch", duration: twitchTime ?? -1});
    locals.addTiming({id: "youtube", duration: ytTime ?? -1});

    return json(response)
}) satisfies RequestHandler;

export type AggregateResponse = {
    twitch: TwitchResponse,
    youtube: YoutubeResponse,
    isThereWan: IsThereWanResponse,
    hasDone: HasDoneResponse
}