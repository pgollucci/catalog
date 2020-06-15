import { Construct, Node } from 'constructs';
import * as cdk8s from 'cdk8s';
import { Dashboard } from './lib/dashboard';
import { Elasticsearch } from './lib/elasticsearch';
import { Kibana } from './lib/kibana';
import { Logstash } from './lib/logstash';
import * as path from 'path';


class CatalogSearch extends cdk8s.Chart {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new Dashboard(this, 'Dashboard');

    const elasticsearch = new Elasticsearch(this, 'Elasticsearch');

    const kibana = new Kibana(this, 'Kibana', { elasticsearch: elasticsearch })

    const lostash = new Logstash(this, 'Logstash', {
      configDirectory: path.join(__dirname, 'config', 'logstash'),
    })

    Node.of(kibana).addDependency(elasticsearch);
    Node.of(lostash).addDependency(elasticsearch);

  }
}

const app = new cdk8s.App();
new CatalogSearch(app, 'catalog-search');
app.synth();
