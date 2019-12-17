#!/usr/bin/env node
import 'source-map-support/register';
import { CatalogStack } from './stacks/catalog-stack';
import { App } from '@aws-cdk/core';

import env = require('./env');

const app = new App();

new CatalogStack(app, 'construct-catalog-prod', env.prod);
new CatalogStack(app, `construct-catalog-dev-${process.env.USER}`, env.dev)

app.synth();