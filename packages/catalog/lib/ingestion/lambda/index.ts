import http = require('http');
import aws = require('aws-sdk');
import ids = require('./ids');
import { env, toDynamoItem } from './lambda-util';

const TABLE_NAME = env(ids.Environment.TABLE_NAME);
const dynamodb = new aws.DynamoDB();

interface SearchResult {
  time: string;
  total: number;
  objects: any[];
}

export async function handler() {
  console.log('querying npmjs');

  let found = 0;
  while (true) {
    const url = npmQuery(`keywords:cdk`, found);
    const response = await httpGet(url);
    const { total, objects } = JSON.parse(response.toString('utf-8')) as SearchResult;
    console.log(objects.length, total);
    for (const obj of objects) {
      console.log('obj', obj);
      if (!obj.package) {
        throw new Error('blow up please');
      }

      const putItem: aws.DynamoDB.PutItemInput = {
        TableName: TABLE_NAME,
        Item: toDynamoItem({
          name: obj.package.name,
          version: obj.package.version,
          metadata: obj.package
        })
      };

      console.log(JSON.stringify({ putItem }, undefined, 2));
      await dynamodb.putItem(putItem).promise();
    }

    found += objects.length;

    if (found === total) {
      break;
    }
  }
}

handler().catch(e => {
  console.error(e);
  process.exit(1);
});

function npmQuery(query: string, from: number) {
  return `http://registry.npmjs.com/-/v1/search?text=${encodeURIComponent(query)}&from=${from}&size=250`;
}

function httpGet(options: any) {
  return new Promise<Buffer>((ok, fail) => {
    const x = http.get(options, res => {
      const body = new Array<Buffer>();
      res.on('data', chunk => body.push(Buffer.from(chunk)));
      res.on('end', () => ok(Buffer.concat(body)));
    });

    x.once('error', e => fail(e));
  });
}
