import { createTwitterClient } from "./util";

(async () => {
  const client = await createTwitterClient();
  const status = await client.get('application/rate_limit_status', { });
  console.log(JSON.stringify(status, undefined, 2));
})().catch(e => {
  console.error(e);
  process.exit(1);
});