import { extractPackageStream, toDynamoItem } from './lambda-util';
import { env } from './lambda-util';
import ids = require('./ids');
import aws = require('aws-sdk');
import Twitter = require('twitter');

interface TwitterCredentials {
  consumer_key: string;
  consumer_secret: string;
  access_token_key: string;
  access_token_secret: string;
}

interface PostTweetResponse {
  id_str: string;

}

const TABLE_NAME = env(ids.Environment.TABLE_NAME);
const TWITTER_SECRET_ARN = env(ids.Environment.TWITTER_SECRET_ARN);


const secrets = new aws.SecretsManager();
const dynamodb = new aws.DynamoDB();

export async function handler(event: AWSLambda.SQSEvent) {
  console.log(JSON.stringify(event, undefined, 2));

  const getSecretOutput = await secrets.getSecretValue({
    SecretId: TWITTER_SECRET_ARN,
  }).promise();
  
  if (!getSecretOutput.SecretString) {
    throw new Error(`cannot retrieve twitter credentials from secrets manager`);
  }

  const credentials = JSON.parse(getSecretOutput.SecretString) as TwitterCredentials;
  const twitter = new Twitter({
    ...credentials
  });
  
  for (const pkg of extractPackageStream(event)) {
    console.log(JSON.stringify({ record: pkg }, undefined, 2));

    if (!pkg.url) {
      throw new Error(`"url" field is expected on all records`);
    }
    
    const desc = pkg.metadata.description || '';
    const hashtags = (pkg.metadata.keywords || []).map(k => `#${k}`).join(' ');
    const title = `${pkg.name.replace(/@/g, '')} ${pkg.version}`;
    const resp = await twitter.post('statuses/update', {
      status: `${title} ${desc} ${hashtags} ${pkg.url}`
    }) as PostTweetResponse;

    console.log(JSON.stringify({ tweet: resp }));

    const putItem: aws.DynamoDB.PutItemInput = {
      TableName: TABLE_NAME,
      Item: toDynamoItem({
        ...pkg,
        tweetid: resp.id_str
      })
    };

    console.log(JSON.stringify({ putItem }, undefined, 2));
    await dynamodb.putItem(putItem).promise();
  }
}

