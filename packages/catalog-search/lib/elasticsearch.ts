import { Construct } from "constructs";

export interface ElasticsearchClusterProps {

}

export class ElasticsearchCluster extends Construct {

  constructor(scope: Construct, id: string, props: ElasticsearchClusterProps) {
    super(scope, id);
  }

}