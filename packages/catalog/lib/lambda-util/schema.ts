export const enum PackageTableAttributes {
  NAME = 'name',
  VERSION = 'version',
  METADATA = 'metadata',
  URL = 'url'
}

export interface Package {
  name: string;
  version: string;
  metadata: any;
  url?: string;
}