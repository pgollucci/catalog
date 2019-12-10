import { Construct, Duration } from "@aws-cdk/core";
import { NodeFunction } from "../util/node-function";
import s3 = require('@aws-cdk/aws-s3');
import ids = require('./lambda/ids');
import dynamo = require('@aws-cdk/aws-dynamodb');
import { SqsEventSource } from "@aws-cdk/aws-lambda-event-sources";
import { DynamoQueue } from "../dynamo-queue";

interface RendererProps {
  readonly source: dynamo.Table;
  readonly bucket: s3.IBucket;
  readonly objectPrefix?: string;
}

export class Renderer extends Construct {
  constructor(parent: Construct, id: string, props: RendererProps) {
    super(parent, id);

    const handler = new NodeFunction(this, "Renderer", {
      codeDirectory: __dirname + "/renderer-lambda",
      deps: [ 'cdk-docgen', 'fs-extra', 's3' ],
      environment: {
        [ids.Environment.BUCKET_NAME]: props.bucket.bucketName,
        [ids.Environment.OBJECT_PREFIX]: props.objectPrefix || ''
      },
      timeout: Duration.seconds(30), // TODO: Match to queue timeout
    });

    const queue = new DynamoQueue(this, 'UpdateQueue', {
      source: props.source
    });

    handler.addEventSource(new SqsEventSource(queue));
    props.bucket.grantReadWrite(handler);
  }
}
