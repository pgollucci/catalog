import { Construct } from 'constructs';
import * as std from 'stdk8s';
import { Duration } from 'stdk8s';

export class Redrive extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const awsResources = std.ConfigMap.fromConfigMapName('aws-resources');

    const entrypointPath = '/var/app';
    const entrypointFile = 'entrypoint.sh';

    const container = new std.Container({
      image: 'node',
      command: [ '/bin/sh', `${entrypointPath}/${entrypointFile}` ],
      workingDir: entrypointPath,
      env: {
        AWS_REGION: std.EnvValue.of('us-east-1'),
        TABLE_NAME: std.EnvValue.fromConfigMap(awsResources, 'tableName'),
        QUEUE_URL: std.EnvValue.fromConfigMap(awsResources, 'queueUrl'),
      }
    });

    const app = new std.ConfigMap(this, 'app');
    app.addDirectory(`${__dirname}/app`, {
      exclude: [ '*.ts' ]
    });

    const entrypointVolume = std.Volume.fromConfigMap(app);

    container.mount(new std.VolumeMount({
      path: entrypointPath,
      volume: entrypointVolume,
    }));

    new std.Job(this, 'redrive', {
      spec: new std.JobSpec({
        ttlAfterFinished: Duration.seconds(5), // delete job after finished
        template: new std.PodTemplateSpec({
          podSpec: new std.PodSpec({
            volumes: [ entrypointVolume ],
            serviceAccout: std.ServiceAccount.fromServiceAccountName('search'),
            containers: [ container ],
          }),
        }),
      }),
    });
  }
}