import { Construct } from 'constructs';
import { App, Chart } from 'cdk8s';

class CatalogSearch extends Chart {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    // define resources here

    new ElasticsearchCluster(this, 'Elasticsearch');

  }
}

const app = new App();
new CatalogSearch(app, 'catalog-search');
app.synth();
