import ids = require('./ids');
import aws = require('aws-sdk');

export async function handler(event: AWSLambda.DynamoDBStreamEvent): Promise<void> {
  const queueUrl = process.env[ids.Environment.OUTPUT_QUEUE_URL];
  const includeEventList = process.env[ids.Environment.INCLUDE_EVENTS];
  
  if (!queueUrl) { throw new Error(`${ids.Environment.OUTPUT_QUEUE_URL} is required`); }
  if (!includeEventList) { throw new Error(`${ids.Environment.INCLUDE_EVENTS} is required`); }
  
  const includeEvents = includeEventList.split(',');
  if (includeEvents.length === 0) {
    throw new Error(`INCLUDE_EVENTS cannot have zero events`);
  }
    
  const sqs = new aws.SQS();

  for (const record of event.Records) {
    if (!shouldInclude(record.eventName)) {
      console.log(`skipping record`, record);
      continue;
    }
    
    console.log(JSON.stringify(record, undefined, 2));

    await sqs.sendMessage({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(record)
    }).promise();  
  }

  function shouldInclude(eventName?: string) {
    for (const include of includeEvents) {
      if (eventName === include) {
        return true;
      }
    }
  
    return false;
  }  
}

