import { Construct } from 'constructs';
import * as cdk8s from 'cdk8s';
import { Kibana } from '../lib/kibana';
import { Elasticsearch } from '../lib/elasticsearch';
import { Indexer } from '../lib/indexer';
import * as kplus from 'cdk8s-plus';
import { Redrive } from '../lib/redrive';


export class SearchOnEKS extends cdk8s.Chart {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    const elasticsearch = new Elasticsearch(this, 'Elasticsearch');

    new Kibana(this, 'Kibana', { elasticsearch: elasticsearch })

    const awsResources = kplus.ConfigMap.fromConfigMapName('aws-resources');
    const awsServiceAccount = kplus.ServiceAccount.fromServiceAccountName('search');

    new Indexer(this, 'Indexer', {
      elasticsearch: elasticsearch,
      awsResourcesConfig: awsResources,
      awsServiceAccont: awsServiceAccount,
    })

    new Redrive(this, 'Redrive', {
      awsResourcesConfig: awsResources,
      awsServiceAccont: awsServiceAccount,
    })


  }
}
