import { Construct } from 'constructs';
import * as stdk8s from 'stdk8s';
import { Chart } from 'cdk8s';
import { Search } from '../lib/search';

export class CatalogSearchDev extends Chart {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    // we need to synthetically create the aws-resources config map
    new stdk8s.ConfigMap(this, 'ConfigMap', {
      metadata: new stdk8s.ObjectMeta({
        name: 'aws-resources',
      }),
      data: {
        queueUrl: process.env.QUEUE_URL!,
      },
    })

    new Search(this, 'Search');

  }
}

