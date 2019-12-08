import { Construct, Duration } from "@aws-cdk/core";
import sqs = require('@aws-cdk/aws-sqs');
import dynamo = require('@aws-cdk/aws-dynamodb');
import event_sources = require('@aws-cdk/aws-lambda-event-sources');
import { NodeFunction } from "./node-function";
import ids = require('./forwarder-lambda/ids');
import { StartingPosition } from "@aws-cdk/aws-lambda";

export interface DynamoUpdatesQueueProps extends sqs.QueueProps {
  readonly source: dynamo.Table;
}

export class DynamoUpdatesQueue extends sqs.Queue {
  constructor(scope: Construct, id: string, props: DynamoUpdatesQueueProps) {
    const fifo = props.fifo === undefined ? false : props.fifo;

    const visibilityTimeout = props.visibilityTimeout || Duration.seconds(30);


    super(scope, id, props);

    const forwarder = new NodeFunction(this, 'Forwarder', {
      codeDirectory: __dirname + '/forwarder-lambda',
      timeout: visibilityTimeout,
      events: [
        new event_sources.DynamoEventSource(props.source, {
          startingPosition: StartingPosition.TRIM_HORIZON,
          batchSize: 1,
        })
      ],
      environment: {
        [ids.Environment.OUTPUT_QUEUE_URL]: this.queueUrl
      }
    });


    this.grantSendMessages(forwarder);
  }
}