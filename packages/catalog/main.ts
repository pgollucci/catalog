#!/usr/bin/env node
import 'source-map-support/register';
import { CatalogStack } from './stacks/catalog-stack';
import { App } from 'monocdk-experiment';

import config = require('./config');

const app = new App();

new CatalogStack(app, 'construct-catalog-prod', config.prod);
new CatalogStack(app, `construct-catalog-dev-${process.env.USER}`, config.dev)

app.synth();