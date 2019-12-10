import { Stack, Construct, StackProps } from '@aws-cdk/core';
import { Ingestion } from '../lib/ingestion';
import { Renderer } from "../lib/renderer";
import { Website } from '../lib/website';
import { Indexer } from '../lib/indexer';

export class CatalogStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const website = new Website(this, 'Website');
    const ingestion = new Ingestion(this, 'Ingestion');
    
    const renderer = new Renderer(this, 'Renderer', { 
      input: ingestion.topic,
      website
    });

    new Indexer(this, 'Indexer', { 
      input: renderer.topic
    });
  }
}
