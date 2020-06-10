#!/usr/bin/env node
import 'source-map-support/register';
import { CatalogStack } from './stacks/catalog-stack';
import { App } from 'monocdk-experiment';

import config = require('./config');
import { SearchStack } from './stacks/search-stack';

const app = new App();


const prod = new CatalogStack(app, 'construct-catalog-prod', config.prod);
new CatalogStack(app, `construct-catalog-dev-${process.env.USER}`, config.dev)

new SearchStack(app, 'construct-catalog-prod-search', {
  updates: prod.updates,
  env: config.prod.env
});

app.synth();