import { Construct } from "@aws-cdk/core";
import cloudwatch = require('@aws-cdk/aws-cloudwatch');

export interface MonitoringProps {
  readonly discoveredPerFiveMinutes: cloudwatch.Metric;
  readonly renderedPerFiveMinutes: cloudwatch.Metric;
  readonly tweetsPerFiveMinutes: cloudwatch.Metric;
}

export class Monitoring extends Construct {
  constructor(scope: Construct, id: string, props: MonitoringProps) {
    super(scope, id);

    const dashboard = new cloudwatch.Dashboard(this, 'Dashboard');

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({ title : 'Discovered/5m', left: [ props.discoveredPerFiveMinutes ]}),
      new cloudwatch.GraphWidget({ title: 'Rendered/5m', left: [ props.renderedPerFiveMinutes ] }),
      new cloudwatch.GraphWidget({ title: 'Tweeted/5m', left: [ props.tweetsPerFiveMinutes ] }),
    );
  }
}