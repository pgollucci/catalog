#!/usr/bin/env node
import cdk = require('@aws-cdk/core');
import { CdkConstructCatalogStack } from '../lib/cdk_construct_catalog-stack';

const app = new cdk.App();
new CdkConstructCatalogStack(app, 'CdkConstructCatalogStack');