import { App, Stack, Construct, Duration } from 'monocdk-experiment';
import { AtomicCounter } from '../lib/util/atomic-counter';
import { Schedule } from 'monocdk-experiment/aws-events';
import { NodeFunction } from '../lib/util/node-function';

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