import { Stack, Construct, StackProps } from '@aws-cdk/core';
import { Ingestion } from '../lib/ingestion';
import { Renderer } from "../lib/renderer";
import { Website } from '../lib/website';
import { Indexer } from '../lib/indexer';
import secrets = require('@aws-cdk/aws-secretsmanager');

export interface CatalogStackProps extends StackProps {
  readonly twitterCredentialsSecretArn: string;
}

export class CatalogStack extends Stack {
  constructor(scope: Construct, id: string, props: CatalogStackProps) {
    super(scope, id, { env: props.env });

    const website = new Website(this, 'Website');
    const ingestion = new Ingestion(this, 'Ingestion');
    
    const renderer = new Renderer(this, 'Renderer', { 
      input: ingestion.topic,
      website
    });

    const twitterCredentials = secrets.Secret.fromSecretArn(this, 'twitter', props.twitterCredentialsSecretArn);

    new Indexer(this, 'Indexer', { 
      input: renderer.topic,
      twitterCredentials
    });
  }
}
