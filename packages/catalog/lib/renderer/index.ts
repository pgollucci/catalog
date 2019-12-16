import { Construct, RemovalPolicy, Duration } from "@aws-cdk/core";
import { NodeFunction } from "../util/node-function";
import ids = require('./lambda/ids');
import { SqsEventSource } from "@aws-cdk/aws-lambda-event-sources";
import { Website } from "../website";
import dynamo = require('@aws-cdk/aws-dynamodb');
import { PackageTableAttributes } from "../lambda-util";
import sns = require('@aws-cdk/aws-sns');
import subscriptions = require('@aws-cdk/aws-sns-subscriptions');
import sqs = require('@aws-cdk/aws-sqs');
import { DynamoTopic, EventType } from "../util/dynamo-topic";
import cloudwatch = require('@aws-cdk/aws-cloudwatch');

interface RendererProps {
  readonly input: sns.Topic;
  readonly website: Website;
}

export class Renderer extends Construct {
  /**
   * A topic which receives a notification every time a module is rendered.
   */
  public readonly topic: sns.Topic;

  /**
   * Total number of messages rendered every minute.
   */
  public readonly renderedPerFiveMinutes: cloudwatch.Metric;

  constructor(parent: Construct, id: string, props: RendererProps) {
    super(parent, id);

    const timeout = Duration.minutes(15);

    const queue = new sqs.Queue(this, 'Queue', {
      visibilityTimeout: timeout
    });

    props.input.addSubscription(new subscriptions.SqsSubscription(queue));

    const table = new dynamo.Table(this, 'Table', {
      partitionKey: { type: dynamo.AttributeType.STRING, name: PackageTableAttributes.NAME, },
      sortKey: { type: dynamo.AttributeType.STRING, name: PackageTableAttributes.VERSION, },
      stream: dynamo.StreamViewType.NEW_AND_OLD_IMAGES,
      removalPolicy: RemovalPolicy.DESTROY
    });

    const handler = new NodeFunction(this, 'Function', {
      timeout: timeout,
      codeDirectory: __dirname + '/lambda',
      memorySize: 1024,
      dependencies: [ 'cdk-docgen', 'fs-extra', 's3' ],
      environment: {
        [ids.Environment.BUCKET_NAME]: props.website.bucket.bucketName,
        [ids.Environment.BASE_URL]: props.website.baseUrl,
        [ids.Environment.OBJECT_PREFIX]: props.website.packagesObjectPrefix || '',
        [ids.Environment.METADATA_FILENAME]: props.website.metadataFile,
        [ids.Environment.TABLE_NAME]: table.tableName
      },
      events: [ new SqsEventSource(queue) ]
    });    

    props.website.bucket.grantReadWrite(handler);
    table.grantReadWriteData(handler);

    this.topic = new DynamoTopic(this, 'Topic', {
      source: table,
      events: [ EventType.INSERT ]
    });

    this.renderedPerFiveMinutes = this.topic.metricNumberOfMessagesPublished();
  }
}
