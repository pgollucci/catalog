import { Construct, Duration } from "@aws-cdk/core";
import sqs = require('@aws-cdk/aws-sqs');
import subscriptions = require('@aws-cdk/aws-sns-subscriptions');
import sns = require('@aws-cdk/aws-sns');
import sources = require('@aws-cdk/aws-lambda-event-sources');
import { NodeFunction } from "../util/node-function";

export interface IndexerProps {
  readonly input: sns.Topic;
}

export class Indexer extends Construct {
  constructor(scope: Construct, id: string, props: IndexerProps) {
    super(scope, id);

    const timeout = Duration.seconds(30);

    const queue = new sqs.Queue(this, 'Queue', {
      visibilityTimeout: timeout
    });

    props.input.addSubscription(new subscriptions.SqsSubscription(queue));

    new NodeFunction(this, 'Function', {
      codeDirectory: __dirname + '/lambda',
      timeout,
      events: [ new sources.SqsEventSource(queue, { batchSize: 1 }) ],
    });
  }
}