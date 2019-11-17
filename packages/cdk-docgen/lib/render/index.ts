import jsiiReflect = require('jsii-reflect');
import { Document } from '../document';
import { enumPage } from './enum';
import { classPage, interfacePage } from './klass';
import { LinkRenderingOptions } from './links';

export type RenderingOptions = LinkRenderingOptions;

export class Rendering {
  /**
   * Return the dislay name for a service package
   */
  public packageDisplayName(assembly: jsiiReflect.Assembly): string {
    return assemblyShortName(assembly);
  }

  public assemblyOverview(assembly: jsiiReflect.Assembly, id: string, title: string): Document {
    const readmeMarkdown = assembly.readme && assembly.readme.markdown || 'Oops!';
    return new Document(id, readmeMarkdown, { title });
  }

  public typePage(type: jsiiReflect.Type): Document {
    if (type.isInterfaceType()) { return this.interfacePage(type); }
    if (type.isClassType()) { return this.classPage(type); }
    if (type.isEnumType()) { return this.enumPage(type); }
    throw new Error(`Did not recognize type: ${type}`);
  }

  public classPage(klass: jsiiReflect.ClassType): Document {
    return classPage(klass, typeDocId(klass));
  }

  public interfacePage(iface: jsiiReflect.InterfaceType): Document {
    return interfacePage(iface, typeDocId(iface));
  }

  public enumPage(etype: jsiiReflect.EnumType): Document {
    return enumPage(etype, typeDocId(etype));
  }
}

export function join(sep: string, args: string[]) {
  return args.filter(a => a).join(sep);
}

/**
 * Given an @aws-cdk/blabla name, return the 'blabla' part.
 */
export function assemblyShortName(assembly: jsiiReflect.Assembly) {
    const [beforeSlash, serviceName] = assembly.name.split('/');
    return serviceName || beforeSlash;
}

export function typeDocId(type: jsiiReflect.Type) {
  return type.fqn.replace('/', '_');
}

/**
 * Return the type's documentation URL
 */
export function typeDocumentationUrl(type: jsiiReflect.Type) {
  return typeDocId(type) + '.md';
}
