// import { Construct } from 'constructs';
// import * as stdk8s from 'stdk8s';
// import { EnvValue } from 'stdk8s';

// export interface LogstashProps {
//   readonly configDirectory: string;
// }

// export class Logstash extends Construct {

//   constructor(scope: Construct, id: string, props: LogstashProps) {
//     super(scope, id);

//     const container = new stdk8s.Container({
//       image: 'docker.elastic.co/logstash/logstash:7.7.1',
//     });

//     const passwordSecret = stdk8s.Secret.fromSecretName('elasticsearch-es-elastic-user');
//     const queueConfig = stdk8s.ConfigMap.fromConfigMapName('');

//     container.addEnv('ELASTIC_PASSWORD', EnvValue.fromSecret(passwordSecret, 'elastic'));
//     container.addEnv('SQS_QUEUE_NAME', EnvValue.fromConfigMap(queueConfig, 'queue_name'));
//     container.addEnv('ELASTIC_USER', EnvValue.fromValue('elastic'))

//     const config = new stdk8s.ConfigMap(this, 'Config');

//     config.addDirectory(props.configDirectory)

//     const volume = stdk8s.Volume.fromConfigMap(config);

//     const pod = new stdk8s.Pod(this, 'Pod')

//     pod.spec.addContainer(container);

//     container.mount({
//       path: '/usr/share/logstash/pipeline/',
//       volume: volume,
//     })

//   }

// }