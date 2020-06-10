import * as sns from 'monocdk-experiment/aws-sns';
import * as subscriptions from 'monocdk-experiment/aws-sns-subscriptions';
import * as sqs from 'monocdk-experiment/aws-sqs';
import * as ec2 from 'monocdk-experiment/aws-ec2';
import * as eks from 'monocdk-experiment/aws-eks';
import * as iam from 'monocdk-experiment/aws-iam';

import { Construct, NestedStack } from 'monocdk-experiment';

export interface SearchProps {
  /**
   * The VPC to put the EKS cluster in.
   */
  readonly vpc: ec2.Vpc;

  /**
   * A topic which receives all module updates.
   */
  readonly updates: sns.Topic;
}

export class Search extends NestedStack {
  constructor(scope: Construct, id: string, props: SearchProps) {
    super(scope, id);

    const mastersRole = new iam.Role(this, 'ClusterAdmin', {
      assumedBy: new iam.AccountRootPrincipal()
    });

    const cluster = new eks.Cluster(this, 'Kubernetes', {
      vpc: props.vpc,
      mastersRole,
    });

    cluster.role.addToPolicy(new iam.PolicyStatement({
      actions: [ 'iam:ListAttachedRolePolicies' ],
      resources: [ '*' ]
    }));

    cluster.addFargateProfile('default', {
      selectors: [ { namespace: 'default' } ]
    });

    const updatesQueue = new sqs.Queue(this, 'UpdatesQueue');
    props.updates.addSubscription(new subscriptions.SqsSubscription(updatesQueue));

    const serviceAccount = cluster.addServiceAccount('search', {
      name: 'search'
    });

    updatesQueue.grantConsumeMessages(serviceAccount);

    cluster.addResource('QueueUrlConfigMap', {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: {
        name: 'queue-url'
      },
      data: {
        arn: updatesQueue.queueArn,
        url: updatesQueue.queueUrl,
      }
    });
  }
}