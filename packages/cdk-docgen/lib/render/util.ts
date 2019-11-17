import jsiiReflect = require('jsii-reflect');
import { Stability } from 'jsii-spec';
import { typeDocumentationUrl } from '.';
import { formatTypeSimple, typeReferenceLink } from './types';

export function renderProperties(properties: jsiiReflect.Property[], caption: string) {
  if (properties.length === 0) { return []; }

  properties.sort(compareByKeys(propertyOrder));

  return [
    '',
    caption ? `## ${caption}` : '',
    '',
    'Name | Type | Description ',
    '-----|------|-------------',
    ...properties.map(_propertiesTableLine),
    ''
  ];

  function _propertiesTableLine(property: jsiiReflect.Property) {
    const name = renderElementName(property.name);
    let summary = property.docs.summary;

    if (property.optional) {
      summary += '<br/><br/>' + renderDefault(property.docs.docs.default);
    }

    return tableRow(
      `${property.static ? '*static* ' : ''}${name}${property.optional ? '?' : ''}${stability(property)}`,
      typeReferenceLink(property.type),
      summary,
    );
  }
}

export function renderConstructor(obj: jsiiReflect.ClassType): string[] {
  const initializer = obj.initializer;
  if (!initializer) { return []; }

  return [
    '',
    `## Initializer`,
    methodDetail(initializer, false),
  ];
}

export function renderMethods(methods: jsiiReflect.Callable[], caption = 'Methods') {
  if (methods.length === 0) { return []; }

  methods.sort(compareByKeys(methodOrder));

  return [
    `## ${caption}`,
    'Name | Description',
    '-----|-----',
    ...methods.map(methodTableLine),
    ...methods.map(m => methodDetail(m)),
  ];

  function methodTableLine(method: jsiiReflect.Callable) {
    const sig = methodSignature(method);

    const text = `[${renderElementName(method.name + '()')}](${elementAnchor(sig)})`;
    return tableRow(
      `${text}${stability(method)}`,
      method.docs.summary,
    );
  }
}

export function elementAnchor(title: string) {
  return `#${title.replace(/\ /g, '-').replace(/[^A-Za-z-]/g, '')}`;
}

interface SignatureOptions {
  /**
   * Whether to use the full signature
   *
   * @default false
   */
  long?: boolean;

  /**
   * Whether the signature is rendered in verbatim text
   *
   * In verbatim mode we won't hyphenate the text as it will lead
   * to <wbr>s in code blocks.
   */
  verbatim?: boolean;
}

export function methodSignature(method: jsiiReflect.Callable, options: SignatureOptions = {}) {
  const verbatim = !!options.verbatim;
  const name = verbatim ? method.name : hyphenate(method.name);

  const visibility = method.protected ? 'protected ' : 'public ';
  const paramRenderer = options.long ? fullParam : shortParam;
  const parameters = method.parameters.map(paramRenderer).join(', ');
  const returnDecl = options.long && method instanceof jsiiReflect.Method ? ': ' + formatTypeSimple(method.returns.type, { verbatim }) : '';
  let staticDecl = '';
  if (isStatic(method)) {
    if (!options.long) {
      staticDecl = '*static* ';
    } else {
      staticDecl += 'static ';
    }
  }
  const showVisibility = options.long || method.protected;

  if (method instanceof jsiiReflect.Initializer) {
    return `new ${method.parentType.name}(${parameters})`;
  } else {
    return `${showVisibility ? visibility : ''}${staticDecl}${name}(${parameters})${returnDecl}`;
  }

  function fullParam(p: jsiiReflect.Parameter) {
    return `${p.variadic ? '...' : ''}${p.name}${p.optional ? '?' : ''}: ${formatTypeSimple(p.type)}${p.variadic ? '[]' : ''}`;
  }

  function shortParam(p: jsiiReflect.Parameter) {
    return `${p.variadic ? '...' : ''}${p.name}${p.optional ? '?' : ''}`;
  }
}

function methodDetail(method: jsiiReflect.Callable, includeHeader = true) {

  const keywordArgsType = method.parameters.length > 0 && method.parameters[method.parameters.length -1].type.type;
  const keywordArguments = new Array<string>();
  if (keywordArgsType && keywordArgsType instanceof jsiiReflect.InterfaceType && keywordArgsType.datatype) {
    for (const prop of keywordArgsType.allProperties) {
      const kwarg = [
        `  *`,
        renderElementName(prop.name),
        `(${typeReferenceLink(prop.type)})`,
        prop.docs.summary ? ` ${prop.docs.summary}` : ' *No description*',
        prop.optional
          ? renderDefault(prop.docs.docs.default)
          : ''
      ]

      keywordArguments.push(kwarg.join(' '));
    }
  }

  return [
    includeHeader ? '\n---' : '',
    includeHeader ? `### ${methodSignature(method)}${stability(method)}` : '',
    method.docs.toString(),
    '```',
    `${methodSignature(method, { long: true, verbatim: true })}`,
    '```',
    '',
    method.parameters.length > 0 ? `*Parameters*` : '',
    ...method.parameters.map(p => [
      '*',
      renderElementName(p.name),
      `(${typeReferenceLink(p.type, typeDocumentationUrl)})`,
      p.docs.summary ? ` ${p.docs.summary}` : ` *No description*`,
    ].join(' ')),
    ...keywordArguments,
    '',
    ...method instanceof jsiiReflect.Method ? [
      !method.returns.type.void ? '*Returns*' : '',
      !method.returns.type.void ? '* ' + typeReferenceLink(method.returns.type, typeDocumentationUrl) : '',
    ] : [],
    '',
  ].join('\n');
}

function renderElementName(name: string) {
  return `**${name}**`;
}

function renderDefault(x: string = '') {
  x = x.trim();
  if (x.startsWith('- ')) { x = x.substr(2); }
  x = x.trim();

  if (x) {
    return `*Default*: ` + x;
  } else {
    return `*Optional*`
  }
}

function propertyOrder(x: jsiiReflect.Property): any[] {
  return [
    x.static ? 1 : 0,
    x.optional ? 1 : 0,
    x.name
  ];
}

function methodOrder(x: jsiiReflect.Callable): any[] {
  return [
    x instanceof jsiiReflect.Initializer ? 0 : 1,
    isStatic(x) ? 1 : 0,
    x.protected ? 1 : 0,
    x.name
  ];
}

function compareByKeys<T>(keyExtractor: (x: T) => any[]): ((a: T, b: T) => number) {
  return (A, B) => {
    const a = keyExtractor(A);
    const b = keyExtractor(B);

    let i = 0;
    while (i < a.length && i < b.length) {
      if (a[i] < b[i]) { return -1; }
      if (a[i] > b[i]) { return 1; }

      i += 1;
    }
    return a.length - b.length;
  };
}

export function mkBadge(icon: string, tooltip: string, badgeType: string, link = '') {
  // tslint:disable-next-line:max-line-length
  const open = link ? `<a href="${htmlEncode(link)}" ` : '<span ';
  const close = link ? '</a>' : '</span>';

  return `${open} class="api-badge api-badge-${badgeType}" title="${htmlEncode(tooltip)}">${icon}${close}`;
}

export function mkIcon(icon: string, tooltip: string, badgeType: string) {
  return `<span class="api-icon api-icon-${badgeType}" title="${htmlEncode(tooltip)}">${icon}</span>`;
}

export function htmlEncode(x: string) {
  return x.replace(/[\u00A0-\u9999<>\&]/gim, i => '&#' + i.charCodeAt(0) + ';');
}

export function stability(x: jsiiReflect.Documentable): string {
  switch (x.docs.stability) {
    case Stability.Stable: return '';
    case Stability.Experimental: return mkIcon('🔹', `This API element is experimental. It may change without notice.`, 'experimental');
    case Stability.Deprecated: return mkIcon('⚠️', `This API element is deprecated. Its use is not recommended.`, 'deprecated');
  }
  return '';
}

export function combine(...xs: Array<string | undefined>) {
  return xs.filter(x => x).join(' ');
}

/**
 * Insert word breaks before every recapitalizaiton in the given word, so the browser can break the line there
 *
 * Avoids tables getting too wide.
 *
 * Can't use soft hyphens because they will be copy/pasted out of
 * the browser, into VS Code, and lead to invalid identifiers.
 */
export function hyphenate(x: string) {
  return x;//x.replace(/[a-z0-9][A-Z]/g, s => s[0] + '<wbr>' + s[1]);
}

/**
 * Render a table row out of a set of cells
 *
 * Fill the table row with something if there's no text, otherwise it will be
 * rendered uglily.
 */
export function tableRow(...cells: string[]) {
  return cells.map(c => c.trim()).map(c => c ? c.replace(/\n/, ' ') : '<span></span>').join(' | ');
}

export function flatMap<T, U>(xs: T[], fn: (value: T, index: number, array: T[]) => U[]): U[] {
  return Array.prototype.concat(...xs.map(fn));
}

function isStatic(x: jsiiReflect.Callable) {
  return x instanceof jsiiReflect.Method && x.static;
}
