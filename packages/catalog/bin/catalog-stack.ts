
import sqs = require('@aws-cdk/aws-sqs');
import { Stack, Construct, StackProps } from '@aws-cdk/core';
import { Ingestion } from '../lib/ingestion';
import { Renderer } from "../lib/renderer";
import { PackageStore } from '../lib/storage';
import { DynamoEventSource, SqsEventSource } from '@aws-cdk/aws-lambda-event-sources';
import { StartingPosition } from '@aws-cdk/aws-lambda';
import { Website } from '../lib/website';
import { DynamoUpdatesQueue } from '../lib/dynamo-update-queue';

export class CatalogStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const website = new Website(this, 'Website');

    const store = new PackageStore(this, 'PackageStore', {
      version: '4'
    });
    
    const monitor = new Ingestion(this, 'Ingestion', {
      store
    });

    const renderer = new Renderer(this, 'Renderer', {
      bucket: website.bucket,
      objectPrefix: '',
      source: store.table
    });
  }
}
