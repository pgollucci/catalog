import { Construct } from "@aws-cdk/core";
import dynamo = require('@aws-cdk/aws-dynamodb');
import schema = require('./lambda-common/packages-table-schema');

export interface PackageStoreProps {
  version?: string;
}

export class PackageStore extends Construct {
  public readonly table: dynamo.Table;

  constructor(scope: Construct, id: string, props: PackageStoreProps) {
    super(scope, id);

    const version = props.version || '';

    this.table = new dynamo.Table(this, `Table${version}`, {
      partitionKey: {
        type: dynamo.AttributeType.STRING,
        name: schema.TableAttributes.NAME,
      },
      sortKey: {
        type: dynamo.AttributeType.STRING,
        name: schema.TableAttributes.VERSION,
      },
      stream: dynamo.StreamViewType.NEW_AND_OLD_IMAGES,
    });
  }
}