import type {PageLoad} from "./$types";
import {wait} from "$lib/utils";
import { browser } from "$app/environment";
import { getCookie } from "$lib/cookieUtils";

export const load = (async ({fetch, params, url}) => {
    const now = new Date();

    let cacheBusting;
    if((now.getUTCDay() === 5 && now.getUTCHours() > 19) || (now.getUTCDay() === 6 && now.getUTCHours() < 10)) {
        cacheBusting = "?d=" + now.getTime();
    } else {
        cacheBusting = "";
    }

    const oldHistory = url.searchParams.has("old") ? import("$lib/history/oldHistory.ts") : undefined;
    const records = fetch("/api/history/records").then(r => r.json());
    const currentYear = await fetch("/api/history/year/" + now.getFullYear() + cacheBusting).then(r => r.json());

    // only wait 50ms extra for records. If they aren't done fetching by then,
    //  just return the promise so sveltekit can stream it when it does finish
    const returned = await Promise.any([records, wait(50)]);


    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    let viewType: number | null = Number(params.__c__viewType);
    if(isNaN(viewType) && browser) viewType = Number(getCookie("historyViewType"))
    if(isNaN(viewType)) viewType = null;

    const recordsDone = !!returned;
    return {
        history: {
            currentYear,
            records: recordsDone ? await records : records,
            viewType,
            oldHistory: oldHistory ? await oldHistory : undefined
        }
    }
}) satisfies PageLoad;