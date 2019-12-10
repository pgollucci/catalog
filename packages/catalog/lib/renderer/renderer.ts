import { Construct, Duration } from "@aws-cdk/core";
import { NodeFunction } from "../util/node-function";
import s3 = require('@aws-cdk/aws-s3');
import ids = require('./lambda/ids');
import dynamo = require('@aws-cdk/aws-dynamodb');
import { SqsEventSource } from "@aws-cdk/aws-lambda-event-sources";
import { DynamoQueue, EventType } from "../dynamo-queue";

interface RendererProps {
  readonly source: dynamo.Table;
  readonly bucket: s3.IBucket;
  readonly objectPrefix?: string;
}

export class Renderer extends Construct {
  constructor(parent: Construct, id: string, props: RendererProps) {
    super(parent, id);

    const timeout = Duration.minutes(15);

    const handler = new NodeFunction(this, "Renderer", {
      timeout,
      codeDirectory: __dirname + "/lambda",
      memorySize: 1024,
      dependencies: [ 'cdk-docgen', 'fs-extra', 's3' ],
      environment: {
        [ids.Environment.BUCKET_NAME]: props.bucket.bucketName,
        [ids.Environment.BUCKET_URL]: props.bucket.bucketWebsiteUrl,
        [ids.Environment.OBJECT_PREFIX]: props.objectPrefix || '',
        [ids.Environment.TABLE_NAME]: props.source.tableName
      },
    });    

    const queue = new DynamoQueue(this, 'UpdateQueue', {
      source: props.source,
      visibilityTimeout: timeout,
      events: [ EventType.INSERT ] // only queue INSERT events
    });

    handler.addEventSource(new SqsEventSource(queue));
    props.bucket.grantReadWrite(handler);
    props.source.grantReadWriteData(handler);
  }
}
