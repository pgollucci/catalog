import aws = require('aws-sdk');

export async function handler(event: AWSLambda.S3Event) {
  const DEFAULT_DOCUMENT_NAME = process.env.DEFAULT_DOCUMENT_NAME;
  if (!DEFAULT_DOCUMENT_NAME) {
    throw new Error(`DEFAULT_DOCUMENT_NAME is required`);
  }

  for (const record of event.Records) {
    const sourceKey = record.s3.object.key;

    // ignore if this is not the default document
    const suffix = `/${DEFAULT_DOCUMENT_NAME}`;
    if (!sourceKey.endsWith(suffix)) {
      return;
    }

    const s3 = new aws.S3();

    const copyTo = async (target: string) => {
      const copyObject: aws.S3.CopyObjectRequest = {
        Bucket: record.s3.bucket.name,
        CopySource: `${record.s3.bucket.name}/${sourceKey}`,
        Key: target
      };
  
      console.log(JSON.stringify({ copyObject }, undefined, 2));
      await s3.copyObject(copyObject).promise();
    };

    const targetKey = decodeURIComponent(sourceKey.substring(0, sourceKey.length - suffix.length));
    await copyTo(targetKey);
    await copyTo(targetKey + '/');
  }
}
