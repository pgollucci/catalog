import { Construct, Node } from "constructs";
import * as cdk8s from 'cdk8s';
import * as eck from '../imports/elasticsearch.k8s.elastic.co/elasticsearch';
// import * as k8s from '../imports/k8s';
// import fs = require('fs');
// import path = require('path');


export class Elasticsearch extends Construct {

  private cr: eck.Elasticsearch;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // const ca = new k8s.Secret(this, 'Secret', {
    //   data: {
    //     'ca.crt': fs.readFileSync(path.join(__dirname, 'tls', 'ca.crt')).toString('base64'),
    //     'tls.crt': fs.readFileSync(path.join(__dirname, 'tls', 'tls.crt')).toString('base64'),
    //     'tls.key': fs.readFileSync(path.join(__dirname, 'tls', 'tls.key')).toString('base64')
    //   }
    // });

    const crd = new cdk8s.Include(this, 'ElasticsearchOperator', {
      url: 'https://download.elastic.co/downloads/eck/1.1.2/all-in-one.yaml'
    })

    this.cr = new eck.Elasticsearch(this, 'Elasticsearch', {
      metadata: {
        name: 'elasticsearch',
      },
      spec: {
        version: '7.7.1',
        http: {
          tls: {
            selfSignedCertificate: {
              disabled: true,
            },
          },
        },
        nodeSets: [
          {
            name: 'default',
            count: 1,
            config: {
              'node.master': true,
              'node.data': true,
              'node.ingest': true,
              'node.store.allow_mmap': false,
              'xpack.security.enabled': true,
              'xpack.security.http.ssl.enabled': false
            }
          }
        ]
      }
    })

    Node.of(this.cr).addDependency(crd);

  }

  public get name(): string {
    return this.cr.name;
  }

}