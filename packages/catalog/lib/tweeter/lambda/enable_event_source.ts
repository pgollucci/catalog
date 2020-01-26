import aws = require('aws-sdk');
import { env } from './lambda-util';
import ids = require('./ids');

export async function handler() {
  const lambda = new aws.Lambda();

  const updateEventSourceMapping: aws.Lambda.UpdateEventSourceMappingRequest = {
    UUID: env(ids.Environment.EVENT_SOURCE_ID),
    Enabled: true,
  };

  console.log(JSON.stringify({ updateEventSourceMapping }));
  await lambda.updateEventSourceMapping(updateEventSourceMapping).promise();
}