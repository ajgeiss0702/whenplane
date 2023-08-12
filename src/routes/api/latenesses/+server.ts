import type { RequestHandler } from "@sveltejs/kit";
import { error, json } from "@sveltejs/kit";

export const GET = (async ({platform}) => {

  const meta = platform?.env?.META;
  if(!meta) throw error(503, "Missing meta KV!");

  const averageLateness = meta.get("averageLateness", {type: 'json'});
  const medianLateness = meta.get("medianLateness", {type: 'json'});

  return json(
    {
      averageLateness: await averageLateness,
      medianLateness: await medianLateness
    }
  );

}) satisfies RequestHandler;