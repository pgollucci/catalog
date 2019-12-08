#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { CatalogStack } from './catalog-stack';

const app = new cdk.App();
new CatalogStack(app, 'CatalogStack2');
