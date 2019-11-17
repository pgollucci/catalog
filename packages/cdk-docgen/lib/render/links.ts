import jsiiReflect = require('jsii-reflect');
import { htmlEncode } from './util';

export interface LinkRenderingOptions {
  baseUrl: string;
  gitCommit?: string;
}

export function githubLink(item: jsiiReflect.SourceLocatable, opts: LinkRenderingOptions): string {
  const url = jsiiReflect.repositoryUrl(item, opts.gitCommit);
  if (!url || url.indexOf('.generated.') !== -1) { return ''; }

  return `(<a href="${htmlEncode(url)}">source</a>)`;
}

