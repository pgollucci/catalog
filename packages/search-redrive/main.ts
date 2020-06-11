import { Chart, App } from 'cdk8s';
import { Construct } from 'constructs';
import { Redrive } from './lib/redrive';

class RedriveChart extends Chart {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    new Redrive(this, 'redrive');
  }
}

const app = new App();
new RedriveChart(app, 'redrive');
app.synth();