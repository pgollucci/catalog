import * as cdk8s from 'cdk8s';
import { CatalogSearchDev } from './charts/dev';
import { CatalogSearch } from './charts/prod';


const app = new cdk8s.App();
new CatalogSearch(app, 'catalog-search-prod');
new CatalogSearchDev(app, 'catalog-search-dev');
app.synth();
