import { Construct } from "@aws-cdk/core";
import { NodeFunction } from "./node-function";
import { Queue } from "@aws-cdk/aws-sqs";
import * as EventSources from "@aws-cdk/aws-lambda-event-sources";

interface RendererProps {
  triggerQueue: Queue;
}

export class Renderer extends Construct {
  constructor(parent: Construct, id: string, props: RendererProps) {
    super(parent, id);
      const trigger = new EventSources.SqsEventSource(props.triggerQueue);
      const handler = new NodeFunction(this, "Renderer", {
        codeDirectory: __dirname + "/renderer-lambda"
      });
  }
}
