import { Construct } from 'constructs';
import * as stdk8s from 'stdk8s';
import { Elasticsearch } from './elasticsearch';

export interface IndexerProps {

  readonly elasticsearch: Elasticsearch;

}

export class Indexer extends Construct {
  constructor(scope: Construct, id: string, props: IndexerProps) {
    super(scope, id);

    const entrypointPath = '/var/app';

    const awsResources = stdk8s.ConfigMap.fromConfigMapName('aws-resources');

    const container = new stdk8s.Container({
      image: 'node',
      command: [ '/bin/sh', `${entrypointPath}/entrypoint.sh` ],
      workingDir: entrypointPath,
      env: {
        QUEUE_URL: stdk8s.EnvValue.fromConfigMap(awsResources, 'queueUrl'),
        ELASTIC_ENDPOINT: stdk8s.EnvValue.fromValue(props.elasticsearch.endpoint),
        ELASTIC_PASSWORD: props.elasticsearch.password,
        ELASTIC_USERNAME: stdk8s.EnvValue.fromValue(props.elasticsearch.username),
      },
    });

    const app = new stdk8s.ConfigMap(this, 'app');
    app.addDirectory(`${__dirname}/indexer`, {
      exclude: [ '*.ts' ],
    });

    const entrypointVolume = stdk8s.Volume.fromConfigMap(app);


    container.mount(new stdk8s.VolumeMount({
      path: entrypointPath,
      volume: entrypointVolume,
    }));

    const podSpec = new stdk8s.PodSpec({})

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