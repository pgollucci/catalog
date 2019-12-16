import { Stack, Construct, StackProps, Duration } from '@aws-cdk/core';
import { Ingestion } from '../lib/ingestion';
import { Renderer } from "../lib/renderer";
import { Website } from '../lib/website';
import { Indexer } from '../lib/indexer';
import secrets = require('@aws-cdk/aws-secretsmanager');
import { Monitoring } from '../lib/monitoring';

export interface CatalogStackProps extends StackProps {
  readonly twitterCredentialsSecretArn: string;

  /**
   * Development mode:
   * 
   * - Does not post to Twitter (dry run)
   * - Indexer visibility timeout is 30sec instead of 5min
   * - Twitter post rate limit: 5 tweets every 1 minute
   */
  readonly dev?: boolean;
}

export class CatalogStack extends Stack {
  constructor(scope: Construct, id: string, props: CatalogStackProps) {
    super(scope, id, { env: props.env });

    const dev = props.dev === undefined ? false : props.dev;

    const website = new Website(this, 'Website');
    const ingestion = new Ingestion(this, 'Ingestion');
    
    const renderer = new Renderer(this, 'Renderer', { 
      input: ingestion.topic,
      website
    });

    const twitterCredentials = secrets.Secret.fromSecretArn(this, 'twitter', props.twitterCredentialsSecretArn);

    const indexer = new Indexer(this, 'Indexer', { 
      input: renderer.topic,
      twitterCredentials,
      dryRun: dev,
      rate: dev ? { window: Duration.minutes(5), quota: 20 } : undefined
    });

    new Monitoring(this, 'Monitoring', {
      renderedPerFiveMinutes: renderer.renderedPerFiveMinutes,
      tweetsPerFiveMinutes: indexer.tweetsPerFiveMinute,
      discoveredPerFiveMinutes: ingestion.discoveredPerFiveMinutes
    });
  }
}
