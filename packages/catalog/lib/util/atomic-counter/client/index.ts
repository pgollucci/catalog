import aws = require('aws-sdk');
import consts = require('./auto-reset-lambda/consts');
import { env } from './lambda-util';

const TABLE_NAME = env(consts.Environment.TABLE_NAME);
const dynamodb = new aws.DynamoDB();

/**
 * Atomically decrements the counter by 1. If counter cannot be decremented
 * (value is 0) this function throws a `ConditionalCheckFailedException`
 * exception.
 * 
 * @throws ConditionalCheckFailedException if counter is zero
 */
export async function decrement() {
  const req = {
    TableName: TABLE_NAME,
    Key: {
      [consts.Schema.PARTITION_KEY]: { S: consts.Schema.PARTITION_KEY_VALUE }
    },
    ConditionExpression: '#counter > :zero',
    UpdateExpression: 'SET #counter = #counter - :value',
    ExpressionAttributeValues: {
      ':zero': { N: '0' },
      ':value': { N: '1' }
    },
    ExpressionAttributeNames: {
      '#counter': consts.Schema.VALUE_KEY
    }
  };

  console.log(`decrement counter by 1`, JSON.stringify(req));
  await dynamodb.updateItem(req).promise();
}

export async function tryDecrement() {
  try {
    await decrement();
    return true;
  } catch (e) {
    if (e.code === `ConditionalCheckFailedException`) {
      return false;
    }
    throw e;
  }
}