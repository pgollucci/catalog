import { extractPackageStream } from './lambda-util';

export async function handler(event: AWSLambda.SQSEvent) {
  console.log(JSON.stringify(event, undefined, 2));

  for (const record of extractPackageStream(event)) {
    console.log(JSON.stringify({ record }, undefined, 2));
  }
}
