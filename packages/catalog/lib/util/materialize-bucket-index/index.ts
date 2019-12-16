import { Construct } from "@aws-cdk/core";
import s3 = require('@aws-cdk/aws-s3');
import notifications = require('@aws-cdk/aws-s3-notifications');
import lambda = require('@aws-cdk/aws-lambda');

export interface MaterializeBucketIndexProps {
  /**
   * The S3 bucket
   */
  readonly bucket: s3.Bucket;

  /**
   * The name of the default document to materialize.
   * @default index.html
   */
  readonly defaultDocument?: string;
}

/**
 * Materializes the default document (e.g. `index.html`) in an S3 bucket by
 * automatically copying all objects named `foo/bar/index.html` to `foo/bar`.
 */
export class MaterializeBucketIndex extends Construct {
  constructor(scope: Construct, id: string, props: MaterializeBucketIndexProps) {
    super(scope, id);

    const defaultDocument = props.defaultDocument ?? 'index.html';

    const handler = new lambda.Function(this, 'Handler', {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset(__dirname + '/lambda'),
      handler: 'index.handler',
      environment: {
        DEFAULT_DOCUMENT_NAME: defaultDocument,
      }
    });

    props.bucket.addObjectCreatedNotification(new notifications.LambdaDestination(handler));
    props.bucket.grantReadWrite(handler);
  }
}