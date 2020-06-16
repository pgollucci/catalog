import { Construct } from 'constructs';
import * as cdk8s from 'cdk8s';
import { Kibana } from '../lib/kibana';
import { Elasticsearch } from '../lib/elasticsearch';
import { Indexer } from '../lib/indexer';
import * as stdk8s from 'stdk8s';


export class SearchOnEKS extends cdk8s.Chart {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    const elasticsearch = new Elasticsearch(this, 'Elasticsearch');

    new Kibana(this, 'Kibana', { elasticsearch: elasticsearch })

    new Indexer(this, 'Indexer', {
      elasticsearch: elasticsearch,
      awsResourcesConfig: stdk8s.ConfigMap.fromConfigMapName('aws-resources'),
      awsServiceAccont: stdk8s.ServiceAccount.fromServiceAccountName('search'),
    })


  }
}
