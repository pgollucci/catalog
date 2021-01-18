import { Construct } from 'monocdk-experiment';
import * as dynamodb from 'monocdk-experiment/aws-dynamodb';
import * as lambda from 'monocdk-experiment/aws-lambda';
import * as events from 'monocdk-experiment/aws-lambda-event-sources';
import { PackageTableAttributes } from '../lambda-util';

export interface LatestProps {
  readonly allVersions: dynamodb.Table;
}

export class Latest extends Construct {
  constructor(scope: Construct, id: string, props: LatestProps) {
    super(scope, id);

    const latestTable = new dynamodb.Table(this, 'Latest', {
      partitionKey: {
        name: PackageTableAttributes.NAME,
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamViewType.NEW_IMAGE,
    });

    const ingestion = new lambda.Function(this, 'Ingestion', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'ingestion.handler',
      code: lambda.Code.fromAsset(`${__dirname}/lambda`),
      environment: {
        TABLE_NAME: latestTable.tableName,
      }
    });

    ingestion.addEventSource(new events.DynamoEventSource(props.allVersions, { 
      startingPosition: lambda.StartingPosition.LATEST,
    }));

    latestTable.grantReadWriteData(ingestion);
  }
}
