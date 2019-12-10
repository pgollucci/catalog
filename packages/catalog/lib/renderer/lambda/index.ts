import docgen = require('cdk-docgen');
import path = require('path');
import fs = require('fs-extra');
import cp = require('child_process');
import { StreamRecord, SQSEvent } from 'aws-lambda';
import schema = require('./schema');
import { promisify } from 'util';
import ids = require('./ids');
import { env } from './lambda-util'
import http = require('http');
import https = require('https');
import aws = require('aws-sdk');

const s3client = require('s3');
const s3 = new aws.S3();

// improve performance of s3 upload
// from "Tips" under https://www.npmjs.com/package/s3
http.globalAgent.maxSockets = https.globalAgent.maxSockets = 20;

const BUCKET_NAME = env(ids.Environment.BUCKET_NAME);
const OBJECT_PREFIX = env(ids.Environment.OBJECT_PREFIX);
const METADATA_FILENAME = env(ids.Environment.METADATA_FILENAME);

const exec = promisify(cp.exec);

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
    const metadata = parseStringValue(record.dynamodb, schema.PackageTableAttributes.METADATA);

    console.log({ name, version });

    await withTempDirectory(async workdir => {

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

      await withTempDirectory(async outdir => {

        const moduleDir = path.join(modulesDirectory, name);
  
        // check if the module is a .jsii module. skip otherwise
        if (!await fs.pathExists(path.join(moduleDir, '.jsii'))) {
          console.log(`Skipping non-jsii module ${name}@${version}`);
          return;
        }
    
        try {
          await docgen.renderDocs({
            modulesDirectory,
            outdir
          });  
        } catch (e) {
          console.log(`ERROR: unable to render docs for module ${name}@${version}: ${e.stack}`);
          return;
        }
    
        // upload to s3
        const sourceDir = path.join(outdir, name);
        const objectKeyPrefix = path.join(OBJECT_PREFIX, `${name}@${version}/`);
        console.log({ upload: { source: sourceDir, dest: `${BUCKET_NAME}/${objectKeyPrefix}` }});
        await uploadDir(sourceDir, BUCKET_NAME, objectKeyPrefix);

        const metadataObjectKey = `${objectKeyPrefix}${METADATA_FILENAME}`;
        await s3.putObject({
          Bucket: BUCKET_NAME,
          Key: metadataObjectKey,
          Body: metadata,
        }).promise();
      });

    });
  }
}

async function withTempDirectory(block: (dir: string) => Promise<void>) {
  const dir = await fs.mkdtemp(path.join('/tmp', 'renderer-'));
  console.log(`temp dir: ${dir}`);
  try {
    await block(dir);
  } finally {
    console.log(`cleaning up: ${dir}`);
    fs.remove(dir);
  }
}

async function uploadDir(local: string, bucketName: string, objectKeyPrefix: string) {
  const client = s3client.createClient();
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