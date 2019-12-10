import { Construct } from "@aws-cdk/core";
import s3 = require('@aws-cdk/aws-s3');
import { StaticWebsite } from "../util/static-website";

export class Website extends Construct {
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // new StaticWebsite(this, 'Website', {
      
    // });

    this.bucket = new s3.Bucket(this, 'Bucket', {
      websiteIndexDocument: 'index.html',
      publicReadAccess: true
    });
  }
}