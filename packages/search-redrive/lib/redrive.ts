import { Construct } from 'constructs';
import * as std from 'stdk8s';

export class Redrive extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const awsResourcesPath = '/var/aws-resources';
    const entrypointPath = '/var/entrypoint';
    const entrypointFile = 'main.sh';

    const container = new std.Container({
      image: 'amazon/aws-cli',
      command: [ '/bin/sh', `${entrypointPath}/${entrypointFile}` ]
    });

    const entrypoint = new std.ConfigMap(this, 'entrypoint', {
      data: {
        [entrypointFile]: [
          '#!/bin/sh',
          `aws dynamodb scan --max-items 1 --region us-east-1 --table-name $(cat ${awsResourcesPath}/tableName)`
        ].join('\n')
      }
    });

    const awsResourcesVolume = std.Volume.fromConfigMap(std.ConfigMap.fromConfigMapName('aws-resources'));
    const entrypointVolume = std.Volume.fromConfigMap(entrypoint);

    container.mount(new std.VolumeMount({
      path: awsResourcesPath,
      volume: awsResourcesVolume,
    }));

    container.mount(new std.VolumeMount({
      path: entrypointPath,
      volume: entrypointVolume
    }));

    new std.Job(this, 'redrive', {
      spec: new std.JobSpec({
        template: new std.PodTemplateSpec({
          podSpec: new std.PodSpec({
            volumes: [ awsResourcesVolume, entrypointVolume ],
            serviceAccout: std.ServiceAccount.fromServiceAccountName('search'),
            containers: [ container ],
          }),
        }),
      }),
    });
  }
}