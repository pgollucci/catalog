import { Stack, Construct, StackProps } from "monocdk-experiment";
import * as ec2 from 'monocdk-experiment/aws-ec2';
import * as sns from 'monocdk-experiment/aws-sns';
import { Search } from "../lib/search";

export interface SearchStackProps extends StackProps {
  readonly updates: sns.Topic;
}

export class SearchStack extends Stack {
  constructor(scope: Construct, id: string, props: SearchStackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'Vpc');

    new Search(this, 'Search', {
      updates: props.updates,
      vpc: vpc
    });
  }
}