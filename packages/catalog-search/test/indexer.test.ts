import * as search from '../lib';
import { Testing } from 'cdk8s';
import * as kplus from 'cdk8s-plus';
import * as k8s from '../imports/k8s';

test('configured the correct env variables', () => {

  const chart = Testing.chart();

  const resources = new kplus.ConfigMap(chart, 'ConfigMap');
  const elasticsearch = new search.Elasticsearch(chart, 'Elasticsearch');

  new search.Indexer(chart, 'Indexer', {
    awsResourcesConfig: resources,
    elasticsearch: elasticsearch,
  })

  const manifest = Testing.synth(chart);

  const deployment: k8s.DeploymentSpec = findApiObject(manifest, 'Deployment', 'indexer').spec;

  expect(deployment.template.spec?.containers[0].env).toEqual(
    [
      {
        name: 'AWS_REGION',
        value: 'us-east-1',
      },
      {
        name: 'QUEUE_URL',
        valueFrom: {
          configMapKeyRef: {
            key: 'queueUrl',
            name: resources.name,
          },
        },
      },
      {
        name: 'ELASTIC_ENDPOINT',
        value: elasticsearch.endpoint,
      },
      {
        name: 'ELASTIC_PASSWORD',
        valueFrom: elasticsearch.password.valueFrom,
      },
      {
        name: 'ELASTIC_USERNAME',
        value: elasticsearch.username,
      },
    ],
  )

});

function findApiObject(manifest: any[], kind: string, nameHint: string) {

  const objects = manifest.filter(obj => {
    return obj.kind === kind && obj.metadata.name.includes(nameHint);
  });

  if (objects.length === 0) {
    return undefined;
  }

  if (objects.length > 1) {
    throw new Error(`Found multiple api objects that contain ${nameHint} in the name`);
  }

  return objects[0]

}