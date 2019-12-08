import { Construct, Duration } from "@aws-cdk/core";
import sqs = require('@aws-cdk/aws-sqs');
import lambda = require('@aws-cdk/aws-lambda');
import events = require('@aws-cdk/aws-events');
import targets = require('@aws-cdk/aws-events-targets');
import { NodeFunction } from "./node-function";

export interface MonitorProps {
  readonly input: sqs.IQueue;
}

export class Ingestion extends Construct {
  constructor(scope: Construct, id: string, props: MonitorProps) {
    super(scope, id);

    const handler = new NodeFunction(this, 'Timer', {
      codeDirectory: __dirname + '/lambda',
      indexFile: 'monitor',
      runtime: lambda.Runtime.NODEJS_12_X,
      deps: [ 'aws-sdk' ],
      timeout: Duration.minutes(10),
      environment: {
        QUEUE_URL: props.input.queueUrl
      }
    });

    new events.Rule(this, 'Tick', {
      schedule: events.Schedule.rate(Duration.minutes(1)),
      targets: [ new targets.LambdaFunction(handler) ]
    });

    props.input.grantSendMessages(handler);
  }
}