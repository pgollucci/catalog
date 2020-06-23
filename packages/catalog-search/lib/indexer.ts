import { Construct } from 'constructs';
import * as kplus from 'cdk8s-plus';
import { Elasticsearch } from './elasticsearch';

export interface IndexerProps {

  readonly elasticsearch: Elasticsearch;

  readonly awsResourcesConfig: kplus.IConfigMap;

  readonly awsCredsSecret?: kplus.ISecret;

  readonly awsServiceAccont?: kplus.IServiceAccount;

}

export class Indexer extends Construct {
  constructor(scope: Construct, id: string, props: IndexerProps) {
    super(scope, id);

    const entrypointPath = '/var/app';

    const container = new kplus.Container({
      image: 'node:12.18.0-stretch',
      command: [ '/bin/sh', `${entrypointPath}/entrypoint.sh` ],
      workingDir: entrypointPath,
      env: {
        AWS_REGION: kplus.EnvValue.fromValue('us-east-1'),
        QUEUE_URL: kplus.EnvValue.fromConfigMap(props.awsResourcesConfig, 'queueUrl'),
        ELASTIC_ENDPOINT: kplus.EnvValue.fromValue(props.elasticsearch.endpoint),
        ELASTIC_PASSWORD: props.elasticsearch.password,
        ELASTIC_USERNAME: kplus.EnvValue.fromValue(props.elasticsearch.username),
      },
    });

    if (props.awsCredsSecret) {

      function addEnv(key: string) {
        container.addEnv(key, kplus.EnvValue.fromSecret(props.awsCredsSecret!, key));
      }

      addEnv('AWS_ACCESS_KEY_ID');
      addEnv('AWS_SECRET_ACCESS_KEY');
      addEnv('AWS_SESSION_TOKEN');
    }

    const app = new kplus.ConfigMap(this, 'app');
    app.addDirectory(`${__dirname}/indexer`, {
      exclude: [ '*.ts' ],
    });

    const entrypointVolume = kplus.Volume.fromConfigMap(app);

    container.mount(entrypointPath, entrypointVolume);

    const d = new kplus.Deployment(this, 'Deployment', {
      spec: {
        replicas: 1,
        podSpecTemplate: {
          serviceAccount: props.awsServiceAccont,
        },
      },
    });

    d.spec.podSpecTemplate.addContainer(container);
  }
}