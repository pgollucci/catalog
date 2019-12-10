#!/usr/bin/env node
import 'source-map-support/register';
import { CatalogStack } from './stacks/catalog-stack';
import { App } from '@aws-cdk/core';

const app = new App();
new CatalogStack(app, 'cdk-catalog-3');
