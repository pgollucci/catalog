#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { CatalogStack } from './stacks/catalog-stack';

const app = new cdk.App();
new CatalogStack(app, 'cdk-catalog-2');
