import { Construct, Duration } from "@aws-cdk/core";
import sqs = require('@aws-cdk/aws-sqs');
import dynamo = require('@aws-cdk/aws-dynamodb');
import event_sources = require('@aws-cdk/aws-lambda-event-sources');
import { NodeFunction } from '../util/node-function';
import ids = require('./lambda/ids');
import { StartingPosition } from "@aws-cdk/aws-lambda";

export interface DynamoQueueProps extends sqs.QueueProps {
  /**
   * The source DynamoDB table.
   */
  readonly source: dynamo.Table;
}

/**
 * A queue that is automatically populated with all updates to a DynamoDB table.
 */
export class DynamoQueue extends sqs.Queue {
  constructor(scope: Construct, id: string, props: DynamoQueueProps) {
    const fifo = props.fifo === undefined ? false : props.fifo;

    const visibilityTimeout = props.visibilityTimeout || Duration.seconds(30);

    super(scope, id, props);

    const forwarder = new NodeFunction(this, 'Forwarder', {
      codeDirectory: __dirname + '/lambda',
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