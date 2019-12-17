import Twitter = require("twitter");
import { createTwitterClient } from "./util";

/* eslint-disable */
async function deleteAll(client: Twitter) {
  while (true) {
    const tweets = await client.get('statuses/user_timeline', {
      screen_name: 'awscdkio'
    });

    if (tweets.length === 0) {
      break;
    }

    for (const t of tweets as any[]) {
      console.log(`destroy ${t.id_str}`);
      await client.post('statuses/destroy', { id: t.id_str });
      await sleep(250);
    }
  }
}

async function main() {
  const client = await createTwitterClient();
  await deleteAll(client);
}

async function sleep(ms: number) {
  return new Promise(ok => setTimeout(ok, ms));
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});

