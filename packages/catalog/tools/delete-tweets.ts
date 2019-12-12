/* eslint-disable */

import Twitter = require('twitter');
import aws = require('aws-sdk');
import env = require('../env');

const secretArn = env.prod.twitterCredentialsSecretArn;
const secrets = new aws.SecretsManager({ region: env.prod.env.region });

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
  const resp = await secrets.getSecretValue({ SecretId: secretArn }).promise();
  if (!resp.SecretString) { throw new Error('no secret'); }
  const credentials = JSON.parse(resp.SecretString);

  const client = new Twitter(credentials);

  await deleteAll(client);
}

async function sleep(ms: number) {
  return new Promise(ok => setTimeout(ok, ms));
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});

