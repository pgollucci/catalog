
import sqs = require('@aws-cdk/aws-sqs');
import { Stack, Construct, StackProps } from '@aws-cdk/core';
import { Monitor } from './monitor';

export class CatalogStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const ingestionQueue = new sqs.Queue(this, 'IngestionQueue');
    const monitor = new Monitor(this, 'Monitor', {
      input: ingestionQueue
    });
  }
}
