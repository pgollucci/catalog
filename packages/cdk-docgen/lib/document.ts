import fs = require('fs');
import path = require('path');
import util = require('util');

const writeFile = util.promisify(fs.writeFile);

export interface RenderContext {
  docPath: string;
}

export interface Metadata {
  title: string;
}

export class Document {
  constructor(public id: string, public contents: string, public readonly metadata: Metadata) {
  }

  public async write(context: RenderContext) {
    await writeFile(path.join(context.docPath, this.id + '.md'), this.contents, { encoding: 'utf-8' });
  }
}

