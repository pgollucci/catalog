import http = require('http');
import aws = require('aws-sdk');
import ids = require('./ids');
import common = require('./lambda-common');

const TABLE_NAME = process.env[ids.Environment.PACKAGE_STORE_TABLE_NAME]
if (!TABLE_NAME) { throw new Error(`TABLE_NAME is required`); }

const dynamodb = new aws.DynamoDB();

interface SearchResult {
  time: string;
  total: number;
  objects: any[];
}

export async function handler() {
  console.log('querying npmjs');

  let page = 0;
  let found = 0;
  while (true) {
    const url = npmQuery(`keywords:cdk`, page);
    const response = await httpGet(url);
    const { total, objects } = JSON.parse(response.toString('utf-8')) as SearchResult;
    console.log(objects.length, total);
    for (const obj of objects) {
      console.log('obj', obj);
      if (!obj.package) {
        throw new Error('blow up please');
      }

      const req: aws.DynamoDB.PutItemInput = {
        TableName: TABLE_NAME!,
        Item: {
          [common.TableAttributes.NAME]: { S: obj.package.name },
          [common.TableAttributes.VERSION]: { S: obj.package.version },
          [common.TableAttributes.METADATA]: { S: JSON.stringify(obj.package) },
        }
      };

      await dynamodb.putItem(req).promise();
    }

    found += objects.length
    page += objects.length;

    if (found === total) {
      break;
    }
  }
}

handler().catch(e => {
  console.error(e);
  process.exit(1);
});

function npmQuery(query: string, page: number) {
  return `http://registry.npmjs.com/-/v1/search?text=${encodeURIComponent(query)}&page=${page}&size=250`;
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