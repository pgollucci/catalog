import { App, Stack, Construct, Duration } from '@aws-cdk/core';
import { AtomicCounter } from '../lib/util/atomic-counter';
import { Schedule } from '@aws-cdk/aws-events';
import { NodeFunction } from '../lib/util/node-function';
import { FollowMode } from '@aws-cdk/assets';

class TestStack extends Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const counter = new AtomicCounter(this, 'Counter1', {
      initialValue: 10,
      autoReset: {
        period: Schedule.rate(Duration.minutes(5)),
        value: 100
      }
    });

    const handler = new NodeFunction(this, 'Decrement', {
      codeDirectory: __dirname + '/integ.atomic-counter.decrement'
    });

    counter.grantDecrement(handler);
  }
}

const app = new App();
new TestStack(app, 'integ-atomic-counter');
app.synth();