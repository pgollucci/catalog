import ids = require('./ids');
import aws = require('aws-sdk');
import { env } from './lambda-util';

const QUEUE_URL = env(ids.Environment.OUTPUT_QUEUE_URL);
const INCLUDE_EVENTS = env(ids.Environment.INCLUDE_EVENTS);

const includeEvents = INCLUDE_EVENTS.split(',');
if (includeEvents.length === 0) {
  throw new Error(`INCLUDE_EVENTS cannot have zero events`);
}

export async function handler(event: AWSLambda.DynamoDBStreamEvent): Promise<void> {
  const sqs = new aws.SQS();

  for (const record of event.Records) {
    if (!shouldInclude(record.eventName)) {
      console.log(`skipping record`, record);
      continue;
    }
    
    console.log(JSON.stringify(record, undefined, 2));

    await sqs.sendMessage({
      QueueUrl: QUEUE_URL,
      MessageBody: JSON.stringify(record)
    }).promise();  
  }
}

function shouldInclude(eventName?: string) {
  for (const include of includeEvents) {
    if (eventName === include) {
      return true;
    }
  }

  return false;
}
