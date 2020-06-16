import { Construct } from 'constructs';
import { Dashboard } from '../lib/dashboard';
import { Elasticsearch } from '../lib/elasticsearch';
import { Kibana } from '../lib/kibana';
import { Indexer } from '../lib/indexer';


export class Search extends Construct {

  constructor(scope: Construct, name: string) {
    super(scope, name);

    new Dashboard(this, 'Dashboard');

    const elasticsearch = new Elasticsearch(this, 'Elasticsearch');

    new Kibana(this, 'Kibana', { elasticsearch: elasticsearch })

    new Indexer(this, 'Indexer', {
      elasticsearch: elasticsearch,
    })
  }

}