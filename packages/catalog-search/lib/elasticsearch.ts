import { Construct, Node } from "constructs";
import * as cdk8s from 'cdk8s';
import * as eck from '../imports/elasticsearch.k8s.elastic.co/elasticsearch';


export class Elasticsearch extends Construct {

  private cr: eck.Elasticsearch;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const crd = new cdk8s.Include(this, 'ElasticsearchOperator', {
      url: 'https://download.elastic.co/downloads/eck/1.1.2/all-in-one.yaml'
    })

    this.cr = new eck.Elasticsearch(this, 'Elasticsearch', {
      metadata: {
        name: 'elasticsearch',
      },
      spec: {
        version: '7.7.1',
        nodeSets: [
          {
            name: 'default',
            count: 1,
            config: {
              'node.master': true,
              'node.data': true,
              'node.ingest': true,
              'node.store.allow_mmap': false
            }
          }
        ],
        http: {
          service: {
            spec: {
              type: 'NodePort',
              ports: [
                {
                  // these are important for local debugging since the kind node
                  // is configured to port map this. see cluster.yaml
                  port: 9200,
                  nodePort: 32000
                }
              ]
            }
          }
        }
      }
    })

    Node.of(this.cr).addDependency(crd);

  }

  public get name(): string {
    return this.cr.name;
  }

}