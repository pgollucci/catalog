import { Construct } from 'constructs';
import * as kplus from 'cdk8s-plus';
import { Chart } from 'cdk8s';
import { Dashboard } from '../lib/dashboard';
import { Elasticsearch } from '../lib/elasticsearch';
import { Kibana } from '../lib/kibana';
import { Indexer } from '../lib/indexer';
import { Redrive } from '../lib/redrive';

export class SearchOnKind extends Chart {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    // in dev we need to create the aws-resources config map.
    // in production this config map already exists in the cluster by the deployment of the catalog itself.
    const awsResourcesConfig = new kplus.ConfigMap(this, 'ConfigMap', {
      metadata: {
        name: 'aws-resources',
      },
      data: {
        queueUrl: kplus.EnvValue.fromProcess('QUEUE_URL', {required: true}).value,
        tableName: kplus.EnvValue.fromProcess('TABLE_NAME', {required: true}).value,
      },
    })

    // this secret is created in 'create-kind-cluster.sh' and uses local enviornment
    // variables. otherwise, creating the secret here would mean storing the creds
    // on disk in clear text.
    const awsCredsSecret = kplus.Secret.fromSecretName('aws-creds');

    // lets add a dashboard to our dev environment.
    new Dashboard(this, 'Dashboard');

    const elasticsearch = new Elasticsearch(this, 'Elasticsearch');

    new Kibana(this, 'Kibana', { elasticsearch: elasticsearch })

    new Indexer(this, 'Indexer', {
      elasticsearch: elasticsearch,
      awsResourcesConfig: awsResourcesConfig,
      awsCredsSecret: awsCredsSecret,
    })

    new Redrive(this, 'Redrive', {
      awsResourcesConfig: awsResourcesConfig,
      awsCredsSecret: awsCredsSecret,
    })

  }
}

