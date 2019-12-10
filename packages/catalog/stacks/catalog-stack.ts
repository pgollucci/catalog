import { Stack, Construct, StackProps } from '@aws-cdk/core';
import { Ingestion } from '../lib/ingestion';
import { Renderer } from "../lib/renderer";
import { PackageStore } from '../lib/storage';
import { Website } from '../lib/website';

export class CatalogStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const website = new Website(this, 'Website');

    const store = new PackageStore(this, 'PackageStore', {
      version: '5'
    });
    
    new Ingestion(this, 'Ingestion', {
      store
    });

    new Renderer(this, 'Renderer', {
      bucket: website.bucket,
      objectPrefix: 'packages/',
      source: store.table
    });
  }
}
