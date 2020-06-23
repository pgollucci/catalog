import { Construct } from 'constructs';
import * as stdk8s from 'cdk8s-plus';
import { Elasticsearch } from './elasticsearch';

export interface IndexerProps {

  readonly elasticsearch: Elasticsearch;

  readonly awsResourcesConfig: stdk8s.IConfigMap;

  readonly awsCredsSecret?: stdk8s.ISecret;

  readonly awsServiceAccont?: stdk8s.IServiceAccount;

}

export class Indexer extends Construct {
  constructor(scope: Construct, id: string, props: IndexerProps) {
    super(scope, id);

    const entrypointPath = '/var/app';

    const container = new stdk8s.Container({
      image: 'node:12.18.0-stretch',
      command: [ '/bin/sh', `${entrypointPath}/entrypoint.sh` ],
      workingDir: entrypointPath,
      env: {
        AWS_REGION: stdk8s.EnvValue.fromValue('us-east-1'),
        QUEUE_URL: stdk8s.EnvValue.fromConfigMap(props.awsResourcesConfig, 'queueUrl'),
        ELASTIC_ENDPOINT: stdk8s.EnvValue.fromValue(props.elasticsearch.endpoint),
        ELASTIC_PASSWORD: props.elasticsearch.password,
        ELASTIC_USERNAME: stdk8s.EnvValue.fromValue(props.elasticsearch.username),
      },
    });

    if (props.awsCredsSecret) {

      function addEnv(key: string) {
        container.addEnv(key, stdk8s.EnvValue.fromSecret(props.awsCredsSecret!, key));
      }

      addEnv('AWS_ACCESS_KEY_ID');
      addEnv('AWS_SECRET_ACCESS_KEY');
      addEnv('AWS_SESSION_TOKEN');
    }

    const app = new stdk8s.ConfigMap(this, 'app');
    app.addDirectory(`${__dirname}/indexer`, {
      exclude: [ '*.ts' ],
    });

    const entrypointVolume = stdk8s.Volume.fromConfigMap(app);


    container.mount(new stdk8s.VolumeMount({
      path: entrypointPath,
      volume: entrypointVolume,
    }));

    const podSpec = new stdk8s.PodSpec({
      serviceAccout: props.awsServiceAccont,
    })

    podSpec.addContainer(container);
    podSpec.addVolume(entrypointVolume);

    new stdk8s.Deployment(this, 'Deployment', {
      spec: new stdk8s.DeploymentSpec({
        replicas: 1,
        template: new stdk8s.PodTemplateSpec({
          podSpec: podSpec,
        }),
      }),
    })
  }
}