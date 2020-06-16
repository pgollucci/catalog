import { Construct } from 'constructs';
import * as cdk8s from 'cdk8s';
import { Search } from '../lib/search';


export class CatalogSearch extends cdk8s.Chart {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new Search(this, 'Search');
  }
}
