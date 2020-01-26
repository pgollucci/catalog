import { Stack, Construct, StackProps } from '@aws-cdk/core';
import { Ingestion } from '../lib/ingestion';
import { Renderer } from "../lib/renderer";
import { Website } from '../lib/website';
import { Tweeter, TweetRate } from '../lib/tweeter';
import secrets = require('@aws-cdk/aws-secretsmanager');
import { Monitoring } from '../lib/monitoring';
import { HostedZone } from '@aws-cdk/aws-route53';

export interface CatalogStackProps extends StackProps {
  /**
   * Domain name.
   */
  readonly domainName?: string;

  /**
   * Twitter credentials.
   */
  readonly twitterSecretArn?: string;

  /**
   * Tweet rate limiting.
   */
  readonly twitterRateLimit: TweetRate;
}

export class CatalogStack extends Stack {
  constructor(scope: Construct, id: string, props: CatalogStackProps) {
    super(scope, id, { env: props.env });

    const website = new Website(this, 'Website', {
      domainName: props.domainName,
      hostedZone: props.domainName ? HostedZone.fromLookup(this, 'HostedZone', { domainName: props.domainName }) : undefined
    });

    const ingestion = new Ingestion(this, 'Ingestion');
    
    const renderer = new Renderer(this, 'Renderer', { 
      input: ingestion.topic,
      website
    });

    const twitterCredentials = props.twitterSecretArn 
      ? secrets.Secret.fromSecretArn(this, 'twitter', props.twitterSecretArn) 
      : undefined;

    const tweeter = new Tweeter(this, 'Indexer', { 
      input: renderer.topic,
      twitterCredentials,
      rate: props.twitterRateLimit
    });

    new Monitoring(this, 'Monitoring', {
      renderedPerFiveMinutes: renderer.renderedPerFiveMinutes,
      tweetsPerFiveMinutes: tweeter.tweetsPerFiveMinute,
      discoveredPerFiveMinutes: ingestion.discoveredPerFiveMinutes,
      bucket: website.bucket,
      indexerLogGroup: tweeter.logGroup,
      ingestionLogGroup: ingestion.logGroup,
      rendererLogGroup: renderer.logGroup,
      packagesTable: tweeter.table
    });
  }
}
