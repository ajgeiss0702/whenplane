import type {RequestHandler} from "@sveltejs/kit";
import {error, json} from "@sveltejs/kit";

export const GET = (async ({platform, params}) => {
    const history = platform?.env?.HISTORY;
    if(!history) throw error(503, "History not available");

    const year = params.year;
    if(!year) throw error(400, "Need a year!");

    const keyNames: string[] = []

    const keys: {
        name: string,
        metadata: {
            [key: string]: string | number
        }
    }[] = [];
    let list_complete = false;
    let cursor: string | undefined = undefined;

    while(!list_complete) {
        const list: KVListResponse = await history.list({
            prefix: year+"",
            cursor
        })

        for (const k of list.keys) {
            if(k.name.includes(":")) {
                const parts = k.name.split(":");
                if(keyNames.includes(parts[0])) continue;
                keyNames.push(parts[0]);
                keys.push({
                    name: parts[0],
                    metadata: {
                        preShowStart: await history.get(parts[0] + ":preShowStart"),
                        mainShowStart: await history.get(parts[0] + ":mainShowStart"),
                        showEnd: await history.get(parts[0] + ":showEnd")
                    }
                });
            } else {
                keyNames.push(k.name)
                keys.push(k)
            }
        }
        list_complete = list.list_complete;
        cursor = list.cursor;
    }

    return json(keys);

}) satisfies RequestHandler;