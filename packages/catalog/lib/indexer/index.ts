import { Construct, Duration, RemovalPolicy } from "@aws-cdk/core";
import dynamo = require('@aws-cdk/aws-dynamodb');
import sqs = require('@aws-cdk/aws-sqs');
import subscriptions = require('@aws-cdk/aws-sns-subscriptions');
import sns = require('@aws-cdk/aws-sns');
import sources = require('@aws-cdk/aws-lambda-event-sources');
import { NodeFunction } from "../util/node-function";
import { PackageTableAttributes } from "../lambda-util";
import ids = require('./lambda/ids');
import secrets = require('@aws-cdk/aws-secretsmanager');

export interface IndexerProps {
  readonly input: sns.Topic;
  readonly twitterCredentials: secrets.ISecret;
}

export class Indexer extends Construct {
  constructor(scope: Construct, id: string, props: IndexerProps) {
    super(scope, id);

    const timeout = Duration.seconds(30);

    const queue = new sqs.Queue(this, 'Queue', {
      visibilityTimeout: timeout
    });

    props.input.addSubscription(new subscriptions.SqsSubscription(queue));

    const table = new dynamo.Table(this, 'Table', {
      partitionKey: { type: dynamo.AttributeType.STRING, name: PackageTableAttributes.NAME, },
      sortKey: { type: dynamo.AttributeType.STRING, name: PackageTableAttributes.VERSION, },
      removalPolicy: RemovalPolicy.DESTROY
    });

    const handler = new NodeFunction(this, 'Function', {
      codeDirectory: __dirname + '/lambda',
      timeout,
      dependencies: [ 'twitter' ],
      environment: {
        [ids.Environment.TABLE_NAME]: table.tableName,
        [ids.Environment.TWITTER_SECRET_ARN]: props.twitterCredentials.secretArn
      },
      events: [ new sources.SqsEventSource(queue, { batchSize: 1 }) ],
    });

    props.twitterCredentials.grantRead(handler);

    table.grantReadWriteData(handler);
  }
}