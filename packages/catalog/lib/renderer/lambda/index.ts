import docgen = require('cdk-docgen');
import path = require('path');
import os = require('os');
import fs = require('fs-extra');
import child_process = require('child_process');
import { StreamRecord, SQSEvent } from 'aws-lambda';
import schema = require('./schema');
import { promisify } from 'util';
import ids = require('./ids');
const s3 = require('s3');

const BUCKET_NAME = process.env[ids.Environment.BUCKET_NAME]!;
if (!BUCKET_NAME) {
  throw new Error(`${ids.Environment.BUCKET_NAME} is required`);
}

const OBJECT_PREFIX = process.env[ids.Environment.OBJECT_PREFIX]!;
if (OBJECT_PREFIX === undefined) {
  throw new Error(`${ids.Environment.OBJECT_PREFIX} is required`);
}

const exec = promisify(child_process.exec);

export async function handler(event: SQSEvent) {
  console.log(JSON.stringify(event, undefined, 2));

  for (const sqsRecord of event.Records) {

    console.log({sqsRecord});

    if (!sqsRecord.body) {
      continue;
    }

    const record = JSON.parse(sqsRecord.body) as AWSLambda.DynamoDBRecord;
    if (!record.dynamodb) {
      console.log('malformed event body:', JSON.stringify(sqsRecord.body));
      continue;
    }

    const name = parseStringValue(record.dynamodb, schema.PackageTableAttributes.NAME);
    const version = parseStringValue(record.dynamodb, schema.PackageTableAttributes.VERSION);
    const metadata = JSON.parse(parseStringValue(record.dynamodb, schema.PackageTableAttributes.METADATA));

    console.log({ name, version });

    const workdir = await fs.mkdtemp(path.join('/tmp', 'renderer-'));
    console.log({ workdir });
    
    await exec(`npm install --ignore-scripts ${name}@${version}`, { 
      cwd: workdir, 
      env: {
        ...process.env,
        HOME: workdir
      }
    });
    const modulesDirectory = path.join(workdir, 'node_modules');
    const files = await fs.readdir(modulesDirectory);
    console.log('node_modules:', files.join(','));

    const outdir = await fs.mkdtemp(path.join('/tmp', 'renderer-output-'));

    try {
      await docgen.renderDocs({
        modulesDirectory,
        outdir
      });  

      await uploadDir(path.join(outdir, name), BUCKET_NAME, path.join(OBJECT_PREFIX, `${name}@${version}/`));  
    } catch (e) {
      console.error(e);
    }
  }
}

async function uploadDir(local: string, bucketName: string, objectKeyPrefix: string) {
  const client = s3.createClient();
  const uploader = client.uploadDir({
    localDir: local,
    s3Params: {
      Bucket: bucketName,
      Prefix: objectKeyPrefix
    }
  });

  return new Promise((ok, fail) => {
    uploader.once('end', ok);
    uploader.once('error', fail);
  });
}

function parseStringValue(record: StreamRecord, name: string) {
  console.log(`parsing field ${name} from ${JSON.stringify(record)}`);
  const err = `No field ${name} in table record`;
  if (!record.NewImage) {
    throw new Error(err);
  }

  const v = record.NewImage[name];
  if (!v) {
    throw new Error(err);
  }

  const value = v.S;
  if (!value) {
    throw new Error(`${err}. Must be a STRING`);
  }

  return value;
}