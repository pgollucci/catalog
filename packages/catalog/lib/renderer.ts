import { Construct, Duration } from "@aws-cdk/core";
import { NodeFunction } from "./node-function";
import { Queue } from "@aws-cdk/aws-sqs";
import s3 = require('@aws-cdk/aws-s3');
import { IEventSource } from "@aws-cdk/aws-lambda";
import ids = require('./renderer-lambda/ids');
import dynamo = require('@aws-cdk/aws-dynamodb');
import { SqsEventSource } from "@aws-cdk/aws-lambda-event-sources";
import { DynamoUpdatesQueue } from "./dynamo-update-queue";

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

    const queue = new DynamoUpdatesQueue(this, 'UpdateQueue', {
      source: props.source
    });

    handler.addEventSource(new SqsEventSource(queue));
    props.bucket.grantReadWrite(handler);
  }
}
