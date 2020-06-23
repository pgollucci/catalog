import * as cdk8s from 'cdk8s';
import { SearchOnKind } from './charts/kind';
import { SearchOnEKS } from './charts/eks';
import * as kplus from 'cdk8s-plus';
import * as sqs from 'monocdk-experiment/aws-sqs';
import * as sns from 'monocdk-experiment/aws-sns';
import * as cdk from 'monocdk-experiment';
import * as subscriptions from 'monocdk-experiment/aws-sns-subscriptions';
import * as path from 'path';
import * as os from 'os';

const region = kplus.EnvValue.fromProcess('AWS_REGION', {required: true}).value;
const account = kplus.EnvValue.fromProcess('AWS_ACCOUNT', {required: true}).value;
const topicArn = kplus.EnvValue.fromProcess('TOPIC_ARN', {required: true}).value;

const awsApp = new cdk.App({outdir: path.join(__dirname, 'cdk.out')});
const awsStack = new cdk.Stack(awsApp, 'aws-infra', {
  env: {
    account: account,
    region: region,
  },
});

const kubeApp = new cdk8s.App();

const prodTopic = sns.Topic.fromTopicArn(awsStack, 'ProductionTopic', topicArn);

// we create a dedicated queue for development on the kind cluster.
// this is so that our dev environment doesn't consume production events.
const queueName = `construct-catalog-search-dev-${os.userInfo().username}`;
const devQueue = new sqs.Queue(awsStack, 'DevQueue', {
  queueName: queueName,
});

prodTopic.addSubscription(new subscriptions.SqsSubscription(devQueue));

new SearchOnEKS(kubeApp, 'catalog-search-eks');
new SearchOnKind(kubeApp, 'catalog-search-kind', {
  queueUrl: `https://sqs.${awsStack.region}.amazonaws.com/${awsStack.account}/${queueName}`,
});

awsApp.synth();
kubeApp.synth();
