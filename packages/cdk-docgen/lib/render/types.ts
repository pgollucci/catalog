import jsiiReflect = require('jsii-reflect');
import { hyphenate, elementAnchor, methodSignature } from "./util";
import { typeDocumentationUrl } from '.';

type LinkGenerator = (t: jsiiReflect.Type) => string | undefined;

// NOTE for manipulations in this file
//
// Normally in MarkDown you should be able to put `A | B` in a table,
// except Remarkable (Docusaurus' MarkDown parser) does not support that.
// Yay.
//
// Suggested workaround:
// https://stackoverflow.com/questions/49809122/vertical-bar-symbol-within-a-markdown-table

/**
 * Turn the given type into a link
 */
export function typeLink(type: jsiiReflect.Type, gen: LinkGenerator = typeDocumentationUrl): string {
  const displayText = type.name;
  const url = gen(type);

  const display = hyphenate(displayText);

  if (!url) {
    return display;
  }

  return `[${display}](${url})`;
}

export function methodLink(method: jsiiReflect.Method) {
  const type = method.parentType;
  const typeLink = typeDocumentationUrl(type);
  const methodLink = typeLink + elementAnchor(methodSignature(method));
  return `[${type.name}](${typeLink}).[${method.name}](${methodLink})()`;
}

/**
 * Wrap the typeReferenceLink in a <span> that will contract the code paddings
 */
export function narrowTypeReferenceLink(reference: jsiiReflect.TypeReference, gen: LinkGenerator): string {
  return '<span class="narrow-code">' + typeReferenceLink(reference, gen) + '</span>';
}

/**
 * Turn the given type reference into a link
 */
export function typeReferenceLink(reference: jsiiReflect.TypeReference, gen: LinkGenerator = typeDocumentationUrl): string {
  return '<code>' + typeReference(reference, type => typeLink(type, gen)) + '</code>';
}

export function formatTypeSimple(reference: jsiiReflect.TypeReference, options: { verbatim?: boolean } = {}): string {
  return typeReference(reference, type => {
    return options.verbatim ? type.name : hyphenate(type.name);
  });
}

type TypeFormatter = (t: jsiiReflect.Type) => string;

function typeReference(reference: jsiiReflect.TypeReference, userTypeFormatter: TypeFormatter): string {
  if (reference.unionOfTypes) {
    return reference.unionOfTypes.map(ref => typeReference(ref, userTypeFormatter)).join(' &#124; ');
  } else if (reference.primitive) {
    return reference.primitive;
  } else if (reference.arrayOfType) {
    return `Array<${typeReference(reference.arrayOfType, userTypeFormatter)}>`;
  } else if (reference.mapOfType) {
    return `Map<string, ${typeReference(reference.mapOfType, userTypeFormatter)}>`;
  } else if (reference.void) {
    return 'void';
  }

  let type: jsiiReflect.Type;
  try {
    type = reference.type!;
  } catch (e) {
    return JSON.stringify((reference as any).spec);
  }

  return userTypeFormatter(type);
}
