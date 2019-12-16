import { Construct, RemovalPolicy } from "@aws-cdk/core";
import s3 = require('@aws-cdk/aws-s3');

export class Website extends Construct {
  public readonly bucket: s3.Bucket;
  public readonly packagesObjectPrefix = 'packages/';
  public readonly metadataFile: string = 'metadata.json';
  public readonly baseUrl: string = 'https://awscdk.io';

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.bucket = new s3.Bucket(this, 'Bucket', {
      websiteIndexDocument: 'index.html',
      // publicReadAccess: true,
      removalPolicy: RemovalPolicy.DESTROY
    });
  }
}