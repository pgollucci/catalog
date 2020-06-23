import { Construct } from 'constructs';
import * as cdk8s from 'cdk8s';
import { Kibana } from '../lib/kibana';
import { Elasticsearch } from '../lib/elasticsearch';
import { Indexer } from '../lib/indexer';
import * as kplus from 'cdk8s-plus';


export class SearchOnEKS extends cdk8s.Chart {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    const elasticsearch = new Elasticsearch(this, 'Elasticsearch');

    new Kibana(this, 'Kibana', { elasticsearch: elasticsearch })

    new Indexer(this, 'Indexer', {
      elasticsearch: elasticsearch,
      awsResourcesConfig: kplus.ConfigMap.fromConfigMapName('aws-resources'),
      awsServiceAccont: kplus.ServiceAccount.fromServiceAccountName('search'),
    })


  }
}
