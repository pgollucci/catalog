import aws = require('aws-sdk');

const s3 = new aws.S3();

export async function handler(event: AWSLambda.SQSEvent) {
  console.log(JSON.stringify(event, undefined, 2));

  // the s3 notifications test event doesn't have records
  if (!event.Records) {
    return;
  }

  for (const sqsRecord of event.Records) {
    console.log(JSON.stringify({ sqsRecord }, undefined, 2));

    const event = JSON.parse(sqsRecord.body) as AWSLambda.S3Event;

    for (const record of event.Records || []) {
      console.log(JSON.stringify({ record }, undefined, 2));

      const obj = await s3.getObject({
        Bucket: record.s3.bucket.name,
        Key: decodeURIComponent(record.s3.object.key),
      }).promise();
  
      if (!obj.Body) {
        throw new Error(`unable to read object ${record.s3.object.key}`);
      }
  
      const metadataText = obj.Body.toString('utf-8');
      const metadata = JSON.parse(metadataText);
      console.log(JSON.stringify({ metadata }, undefined, 2));
    }

  }
}
