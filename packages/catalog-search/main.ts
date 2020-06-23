import * as cdk8s from 'cdk8s';
import { SearchOnKind } from './charts/kind';
import { SearchOnEKS } from './charts/eks';
import * as sqs from 'monocdk-experiment/aws-sqs';
import * as sns from 'monocdk-experiment/aws-sns';
import * as cdk from 'monocdk-experiment';
import * as subscriptions from 'monocdk-experiment/aws-sns-subscriptions';
import * as path from 'path';

const awsApp = new cdk.App({outdir: path.join(__dirname, 'cdk.out')});
const stack = new cdk.Stack(awsApp, 'aws-infra');

const queueName = '';
const liveTopic = sns.Topic.fromTopicArn(stack, 'Topic', 'arn:aws:sns:us-east-1:499430655523:construct-catalog-prod-IndexerTopic4C7DF6F9-1LN5AHGALTGXC');

const queue = new sqs.Queue(stack, 'Queue', {
  queueName: queueName,
})

liveTopic.addSubscription(new subscriptions.SqsSubscription(queue));

const kubeApp = new cdk8s.App();
new SearchOnEKS(kubeApp, 'catalog-search-eks');
new SearchOnKind(kubeApp, 'catalog-search-kind');

kubeApp.synth();
awsApp.synth();
