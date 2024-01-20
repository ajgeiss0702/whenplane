import { error, type RequestHandler } from "@sveltejs/kit";

import { PUSH_KEY } from "$env/static/private"
import type { NotificationRows } from "../../settings/+server.ts";
import type { D1Database, Queue } from "@cloudflare/workers-types";
import { getClosestWan, getUTCDate } from "$lib/timeUtils.ts";

import type {PushMessage} from '@block65/webcrypto-web-push';

export const POST = (async ({platform, params, request}) => {

  const { key } = await request.json();

  const name = params.name;

  if(key != PUSH_KEY && name != "test") throw error(401);

  if(!name) throw error(400);

  const db: D1Database = platform?.env?.DB;
  if(!db) throw error(503, "Database missing");

  const message = messages[name];
  if(!message) throw error(400);

  let subs;

  if(name === "test") {
    subs = await db.prepare("select * from notifications where endpoint_hash = ?")
      .bind("0132821ddbce0ced2f6109c772b06097557642fb3497fd8e7a754cdfe761dbd6")
      .all()
      .then(r => r.results as unknown as NotificationRows[]);
  } else {
    subs = await db.prepare("select * from notifications where ? = 1")
      .bind(name)
      .all()
      .then(r => r.results as unknown as NotificationRows[]);
  }


  const pushMessages: NotificationMessage[] = subs.filter(sub => sub.subscription).map(sub => {
    return {
      type: name,
      subscription: JSON.parse(<string>sub.subscription) as PushSubscription,
      message
    }
  });

  const queue: Queue<NotificationMessage> = platform?.env?.NOTIFICATION_QUEUE;

  let batch: NotificationMessage[] = [];
  for (const pushMessage of pushMessages) {
    batch.push(pushMessage);

    if(batch.length >= 99) {
      await queue.sendBatch(batch.map(body => {
        return { body };
      }));
      batch = [];
    }
  }

  return new Response("", {status: 204});
}) satisfies RequestHandler;


const messages: {[key: string]: PushMessage} = {
  imminent: {
    data: {
      title: "The WAN show is imminent!",
      body: "The pre show should be starting in the next 10 minutes. Get ready!"
    },
    options: {
      ttl: 60,
      urgency: 'high',
      topic: "imminent-" + getUTCDate(getClosestWan())
    }
  },

  preshow_live: {
    data: {
      title: "The WAN pre-show has started!",
      body: "The pre-show is now live (everywhere except for youtube)"
    },
    options: {
      ttl: 60,
      urgency: 'high',
      topic: "preshow_live-" + getUTCDate(getClosestWan())
    }
  },

  mainshow_live: {
    data: {
      title: "The WAN show has started!",
      body: "The main show is now live everywhere."
    },
    options: {
      ttl: 60,
      urgency: 'high',
      topic: "wanshow_live-" + getUTCDate(getClosestWan())
    }
  },

  other_streams: {
    data: {
      title: "A non-wan stream has started",
      body: "{TODO: insert title here}"
    },
    options: {
      ttl: 60,
      urgency: 'high',
      topic: "imminent-" + getUTCDate(getClosestWan())
    }
  },

  test: {
    data: {
      title: "Test Notification",
      body: "Yeah, it works!"
    },
    options: {
      ttl: 60,
      urgency: 'high',
      topic: "test-" + new Date().getUTCMinutes()
    }
  }
}

export type NotificationMessage = {
  id?: number,
  type: string,
  subscription: PushSubscription,
  message: PushMessage,
  isDummy?: boolean
}