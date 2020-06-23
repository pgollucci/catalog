import { Construct } from 'constructs';
import * as kplus from 'cdk8s-plus';

export interface RedriveProps {

  readonly awsResourcesConfig: kplus.IConfigMap;

  readonly awsCredsSecret?: kplus.ISecret;

  readonly awsServiceAccont?: kplus.IServiceAccount;

}

/**
 * Enqueues all module notifications (package + version) to the search SQS queue
 * so it can redrive the index.
 */
export class Redrive extends Construct {
  constructor(scope: Construct, id: string, props: RedriveProps) {
    super(scope, id);

    const entrypointPath = '/var/app';
    const entrypointFile = 'entrypoint.sh';

    const container = new kplus.Container({
      image: 'node:12.18.0-stretch',
      command: [ '/bin/sh', `${entrypointPath}/${entrypointFile}` ],
      workingDir: entrypointPath,
      env: {
        AWS_REGION: kplus.EnvValue.fromValue('us-east-1'),
        TABLE_NAME: kplus.EnvValue.fromConfigMap(props.awsResourcesConfig, 'tableName'),
        QUEUE_URL: kplus.EnvValue.fromConfigMap(props.awsResourcesConfig, 'queueUrl'),
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
    app.addDirectory(`${__dirname}/redrive`, {
      exclude: [ '*.ts' ],
    });

    const entrypointVolume = kplus.Volume.fromConfigMap(app);

    container.mount(entrypointPath, entrypointVolume);

    new kplus.Job(this, 'Job', {
      spec: {
        ttlAfterFinished: kplus.Duration.seconds(5), // delete job after finished
        podSpecTemplate: {
          serviceAccount: props.awsServiceAccont,
          containers: [ container ],
        },
      },
    });
  }
}