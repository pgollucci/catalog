import { DynamoDB } from 'aws-sdk';

const ddb = new DynamoDB();
const TABLE_NAME = process.env.TABLE_NAME;

export async function handler(event: AWSLambda.DynamoDBStreamEvent): Promise<void> {
  if (!TABLE_NAME) {
    throw new Error('TABLE_NAME is required');
  }
  
  console.log(`TABLE_NAME: ${TABLE_NAME}`);
  console.log(`EVENT: ${JSON.stringify(event, null, 2)}`);

  for (const record of event.Records ?? []) {
    if (!record.dynamodb?.NewImage) {
      continue;
    }

    const putItem: DynamoDB.PutItemInput = {
      TableName: TABLE_NAME,
      Item: record.dynamodb.NewImage,
    };

    await ddb.putItem(putItem).promise();
  }
}