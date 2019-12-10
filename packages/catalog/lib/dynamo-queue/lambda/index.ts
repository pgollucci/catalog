import ids = require('./ids');
import aws = require('aws-sdk');

const QUEUE_URL = process.env[ids.Environment.OUTPUT_QUEUE_URL]!;
if (!QUEUE_URL) {
  throw new Error(`${ids.Environment.OUTPUT_QUEUE_URL} is required`);
}

export async function handler(event: AWSLambda.DynamoDBStreamEvent) {
  const sqs = new aws.SQS();

  for (const record of event.Records) {
    console.log(JSON.stringify(record, undefined, 2));

    await sqs.sendMessage({
      QueueUrl: QUEUE_URL,
      MessageBody: JSON.stringify(record)
    }).promise();  
  }
}