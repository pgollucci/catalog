import ids = require('./ids');
import aws = require('aws-sdk');

const sns = new aws.SNS();

export async function handler(event: AWSLambda.DynamoDBStreamEvent): Promise<void> {
  const topicArn = process.env[ids.Environment.TOPIC_ARN];
  const includedEventList = process.env[ids.Environment.INCLUDE_EVENTS];

  if (!topicArn) { throw new Error(`${ids.Environment.TOPIC_ARN} is required`); }
  if (!includedEventList) { throw new Error(`${ids.Environment.INCLUDE_EVENTS} is required`); }
  
  const includedEvents = includedEventList.split(',');
  if (includedEvents.length === 0) {
    throw new Error(`INCLUDE_EVENTS cannot have zero events`);
  }

  for (const record of event.Records) {
    if (!shouldInclude(record.eventName)) {
      console.log(`skipping record`, record);
      continue;
    }
    
    console.log(JSON.stringify(record, undefined, 2));

    await sns.publish({
      TopicArn: topicArn,
      Message: JSON.stringify(record),
    }).promise();
  }

  function shouldInclude(eventName?: string) {
    for (const include of includedEvents) {
      if (eventName === include) {
        return true;
      }
    }
  
    return false;
  }  
}

