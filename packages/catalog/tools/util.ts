import Twitter = require('twitter');
import aws = require('aws-sdk');
import config = require('../config');


export async function createTwitterClient() {
  const secretArn = config.prod.twitterSecretArn;
  if (!secretArn) { throw new Error(`twitterSecretArn is required`); }

  const secrets = new aws.SecretsManager({ region: config.prod.env?.region });
    const resp = await secrets.getSecretValue({ SecretId: secretArn }).promise();
  if (!resp.SecretString) { throw new Error('no secret'); }
  const credentials = JSON.parse(resp.SecretString);

  return new Twitter(credentials);
}