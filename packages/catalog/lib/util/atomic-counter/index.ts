import { Construct, RemovalPolicy } from "monocdk-experiment";
import sns = require('monocdk-experiment/aws-sns');
import dynamodb = require('monocdk-experiment/aws-dynamodb');
import targets = require('monocdk-experiment/aws-events-targets');
import events = require('monocdk-experiment/aws-events');
import { NodeFunction } from "../node-function";
import consts = require('./auto-reset-lambda/consts');
import lambda = require('monocdk-experiment/aws-lambda');
import cr = require('monocdk-experiment/custom-resources');

export interface AutoReset {
  /**
   * The auto-reset period.
   */
  readonly period: events.Schedule;

  /**
   * The value to reset the counter.
   * @default - initialValue
   */
  readonly value?: number;
}

export interface AtomicCounterProps {
  /**
   * Automatically reset the counter to a specific value per defined period.
   */
  readonly autoReset?: AutoReset;

  /**
   * The initial value of the counter.
   */
  readonly initialValue: number;
}

/**
 * A distributed counter that can be incremented or decremented atomically.
 */
export class AtomicCounter extends Construct {

  public readonly autoResetTopic?: sns.Topic;

  private readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props: AtomicCounterProps) {
    super(scope, id);

    const initialValue = props.initialValue;

    this.table = new dynamodb.Table(this, 'Table', {
      partitionKey: {
        type: dynamodb.AttributeType.STRING,
        name: consts.Schema.PARTITION_KEY
      },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    if (props.autoReset) {
      this.autoResetTopic = new sns.Topic(this, 'AutoResetTopic');

      const autoReset = props.autoReset || {};
      const autoResetValue = autoReset.value === undefined ? initialValue : autoReset.value;
      const resetHandler = new NodeFunction(this, 'AutoResetHandler', {
        codeDirectory: __dirname + '/auto-reset-lambda',
        environment: {
          [consts.Environment.TABLE_NAME]: this.table.tableName,
          [consts.Environment.AUTO_RESET_VALUE]: autoResetValue.toString(),
          [consts.Environment.TOPIC_ARN]: this.autoResetTopic.topicArn
        },
      });

      new events.Rule(this, 'ResetPeriod', {
        schedule: props.autoReset.period,
        targets: [ new targets.LambdaFunction(resetHandler) ]
      });

      this.table.grantWriteData(resetHandler);
      this.autoResetTopic.grantPublish(resetHandler);
    }

    const setInitialValue = new cr.AwsCustomResource(this, 'SetInitialValue', {
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({ resources: ['*'] }),
      onCreate: {
        service: 'DynamoDB',
        action: 'putItem',
        physicalResourceId: cr.PhysicalResourceId.of('SetInitialValue'),
        parameters: {
          TableName: this.table.tableName,
          Item: {
            [consts.Schema.PARTITION_KEY]: { S: consts.Schema.PARTITION_KEY_VALUE },
            [consts.Schema.VALUE_KEY]: { N: initialValue.toString() }
          }
        }
      }
    });

    this.table.grantWriteData(setInitialValue);
  }

  public grantDecrement(handler: lambda.Function) {
    this.table.grantReadWriteData(handler);
    handler.addEnvironment(consts.Environment.TABLE_NAME, this.table.tableName);
  }
}
