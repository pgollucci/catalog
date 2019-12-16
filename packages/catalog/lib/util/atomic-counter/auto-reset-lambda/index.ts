import { env  } from './lambda-util';
import consts = require('./consts');
import aws = require('aws-sdk');

const TABLE_NAME = env(consts.Environment.TABLE_NAME);
const RESET_VALUE = env(consts.Environment.AUTO_RESET_VALUE);
const TOPIC_ARN = env(consts.Environment.TOPIC_ARN);

export async function handler() {
  const dynamodb = new aws.DynamoDB();
  const sns = new aws.SNS();
  const putItem: aws.DynamoDB.PutItemInput = {
    TableName: TABLE_NAME,
    Item: {
      [consts.Schema.PARTITION_KEY]: { S: consts.Schema.PARTITION_KEY_VALUE },
      [consts.Schema.VALUE_KEY]: { N: RESET_VALUE },
    }
  };
  console.log(JSON.stringify({ putItem }));
  await dynamodb.putItem(putItem).promise();

  const publish: aws.SNS.PublishInput = {
    TopicArn: TOPIC_ARN,
    Message: 'Counter auto-reset'
  };

  console.log(JSON.stringify({ publish }));
  await sns.publish(publish).promise();
}