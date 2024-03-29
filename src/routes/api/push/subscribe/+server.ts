import { error, json, type RequestHandler } from "@sveltejs/kit";
import type { D1Database } from "@cloudflare/workers-types";
import { sha256 } from "$lib/notifications/notificationUtils.ts";
import { dev } from "$app/environment";
import { createNotificationsTable } from "$lib/server/notifications/notification-server-tools.ts";

export const POST = (async ({platform, request}) => {

  const db: D1Database = platform?.env?.DB;
  if(!db) throw error(503, "Database missing");

  if(dev) {
    await createNotificationsTable(db);
  }

  const subscription: PushSubscription = await request.json();
  const subscriptionString = JSON.stringify(subscription);

  const endpoint_hash = await sha256(subscription.endpoint);

  const alreadySubscribed = await db.prepare("select * from notifications where subscription=?")
    .bind(subscriptionString).all().then(r => r.results.length > 0);

  if(alreadySubscribed) {
    return json({message: "Already Subscribed"}, {status: 400});
  }

  return json(
    await db.prepare("insert into notifications (subscription, endpoint_hash) values(?, ?)")
      .bind(JSON.stringify(subscription), endpoint_hash)
      .run()
  )



}) satisfies RequestHandler;