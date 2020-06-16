import * as cdk8s from 'cdk8s';
import { CatalogSearchDev } from './charts/kind';
import { CatalogSearch } from './charts/eks';


const app = new cdk8s.App();
new CatalogSearch(app, 'catalog-search-prod');
new CatalogSearchDev(app, 'catalog-search-kind');
app.synth();
