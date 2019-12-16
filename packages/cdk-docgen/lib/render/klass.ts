import jsiiReflect = require('jsii-reflect');
import { typeDocumentationUrl } from '.';
import { Document } from '../document';
import { typeLink, methodLink } from './types';
import { flatMap, renderConstructor, renderMethods, renderProperties, stability } from './util';

export function classPage(klass: jsiiReflect.ClassType, id: string): Document {
  const title = `class ${klass.name}`;

  const markdown = [
    `# ${title} ${stability(klass)}`,
    '',
    klass.docs.toString(),
    '',
    ...renderImplements(klass),
    ...renderExtends(klass),
    ...renderImplementors(klass),
    ...renderFactories(klass),
    '',
    ...renderConstructor(klass),
    ...renderProperties(klass.allProperties.filter(documentableProperty), 'Properties'),
    ...renderMethods(classMethods(klass).filter(documentableMethod)),
  ].join('\n');

  return new Document(id, markdown, { title: klass.name });
}

export function interfacePage(iface: jsiiReflect.InterfaceType, id: string): Document {
  const kind = iface.datatype ? 'struct' : 'interface';
  const title = `${kind} ${iface.name}`;

  const markdown = [
    `# ${title} ${stability(iface)}`,
    '',
    ...renderImplementors(iface),
    ...renderFactories(iface),
    '',
    iface.docs.toString(),
    ...renderProperties(iface.allProperties.filter(documentableProperty), iface.datatype ? '' : 'Properties'),
    ...renderMethods(iface.allMethods.filter(documentableMethod)),
  ].join('\n');

  return new Document(id, markdown, { title: iface.name });
}

function renderImplements(c: jsiiReflect.ClassType) {
  const ifaces = c.getInterfaces(true);
  if (ifaces.length === 0) { return []; }

  return [
    '|**Implements**|' + ifaces.map(x => typeLink(x, typeDocumentationUrl)).join(', '),
    '|---|---',
  ];
}

/**
 * Find all public static methods that can produce a type like this
 *
 * Only if the producing type is not the type itself.
 */
function renderFactories(c: jsiiReflect.ReferenceType) {
  // Only for non-instantiable types
  if (c.isClassType() && !c.abstract) { return []; }

  const allStaticMethods = flatMap(c.system.classes, x => x.ownMethods);
  const factories = allStaticMethods
    .filter(m => m.returns.type.fqn === c.fqn)
    .filter(m => m.parentType !== c);

  if (factories.length === 0) { return []; }

  return [
    '|**Obtainable from**|' + factories.map(x => methodLink(x)).join(', '),
  ];
}

function renderExtends(c: jsiiReflect.ClassType) {
  if (!c.base) { return []; }

  return [
    '|**Extends**|' + typeLink(c.base),
  ];
}

function renderImplementors(i: jsiiReflect.Type) {
  const hasImplementors = i.isInterfaceType() || (i.isClassType() && i.abstract);
  if (!hasImplementors) { return []; }

  const implementors = i.allImplementations
    .filter(isClassType)
    .filter(x => !x.abstract);

  if (implementors.length === 0) { return []; }

  return [
    '|**Implemented by**|' + implementors.map(x => typeLink(x, typeDocumentationUrl)).join(', '),
    '|---|---',
  ];
}

function documentableProperty(p: jsiiReflect.Property) {
  // Don't show methods starting with _, or protected members on subclasses
  return !p.name.startsWith('_') && publicOrDefinedHere(p);
}

function documentableMethod(p: jsiiReflect.Callable) {
  // Don't show methods starting with _, or protected members on subclasses
  return !p.name.startsWith('_') && publicOrDefinedHere(p);
}

/**
 * Return true if the method is a regular public method, or if it's defined on this class
 *
 * Shows public callables on subclasses, but hides protected and statics on subclasses.
 */
function publicOrDefinedHere(p: jsiiReflect.Callable | jsiiReflect.Property) {
  if (p instanceof jsiiReflect.Initializer) { return true; }

  if (p instanceof jsiiReflect.Method || p instanceof jsiiReflect.Property) {
    return (!p.protected && !p.static) || p.definingType === p.parentType;
  }

  throw new Error(`Unknown callable: ${p}`);
}

function classMethods(c: jsiiReflect.ClassType) {
  return c.allMethods;
}

function isClassType(x: jsiiReflect.Type): x is jsiiReflect.ClassType {
  // Need this function because my TypeScript doesn't propagate the type guard
  // through a method.
  return x.isClassType();
}
