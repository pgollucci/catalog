import { Construct, Duration } from "@aws-cdk/core";
import s3n = require('@aws-cdk/aws-s3-notifications');
import s3 = require('@aws-cdk/aws-s3');
import sqs = require('@aws-cdk/aws-sqs');
import sources = require('@aws-cdk/aws-lambda-event-sources');
import { NodeFunction } from "../util/node-function";

export interface IndexerProps {
  readonly bucket: s3.Bucket;
  readonly objectPrefix: string;
  readonly metadataFile: string;
}

export class Indexer extends Construct {
  constructor(scope: Construct, id: string, props: IndexerProps) {
    super(scope, id);

    const timeout = Duration.seconds(30);
    const queue = new sqs.Queue(this, 'Queue', {
      visibilityTimeout: timeout
    });

    props.bucket.addObjectCreatedNotification(new s3n.SqsDestination(queue), {
      prefix: props.objectPrefix,
      suffix: `/${props.metadataFile}`
    });

    const handler = new NodeFunction(this, 'Processor', {
      codeDirectory: __dirname + '/lambda',
      timeout,
      events: [ new sources.SqsEventSource(queue, { batchSize: 1 }) ],
    });

    props.bucket.grantRead(handler);
  }
}