
import sqs = require('@aws-cdk/aws-sqs');
import { Stack, Construct, StackProps } from '@aws-cdk/core';
import { Ingestion } from './ingestion';
import { Renderer } from "./renderer";

export class CatalogStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const ingestionQueue = new sqs.Queue(this, 'IngestionQueue');
    const monitor = new Ingestion(this, 'Monitor', {
      input: ingestionQueue
    });
    new Renderer(this, "Renderer", {
      triggerQueue: ingestionQueue
    });
  }
}
