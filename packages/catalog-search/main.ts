import { Construct } from 'constructs';
import * as cdk8s from 'cdk8s';
import { Dashboard } from './lib/dashboard';
import { Elasticsearch } from './lib/elasticsearch';


class CatalogSearch extends cdk8s.Chart {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new Dashboard(this, 'Dashboard');

    new Elasticsearch(this, 'Elasticsearch');

  }
}

const app = new cdk8s.App();
new CatalogSearch(app, 'catalog-search');
app.synth();
