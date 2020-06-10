// tslint:disable:no-console
import jsiiReflect = require('jsii-reflect');
import path = require('path');
import fs = require('fs-extra');
import glob = require('glob-promise');
import { Document } from './document'
import { assemblyShortName, Rendering } from './render/index';
import { renderIndex } from './docsify';

const ts = new jsiiReflect.TypeSystem();

export interface Options {
  /**
   * The node_modules directory. Docs will be rendered for all .jsii modules
   * in this directory (recursively).
   *
   * @default "node_modules"
   */
  readonly modulesDirectory?: string;

  /**
   * Output directory
   *
   * @default "dist"
   */
  readonly outdir?: string;
}

export async function renderDocs(options: Options = { }) {
  const outdir = options.outdir || 'dist';
  const modulesDirectory = options.modulesDirectory || 'node_modules';
  const render = new Rendering();

  for (const filePath of await glob('**/*/.jsii', { cwd: modulesDirectory })) {
    await ts.load(path.resolve(modulesDirectory, filePath));
  }

  for (const assembly of ts.assemblies) {
    const types = analyzeAssembly(assembly);
    const pkg = documentAssembly(render, types);
    const basepath = path.join(outdir, assembly.name);
    await fs.mkdirp(basepath);

    const sidebar = new Array<string>();
    const context = { docPath: basepath };

    sidebar.push(`* [README](./${pkg.readme.id}.md)`);

    async function emitSidebarSection(title: string, documents: Document[]) {
      if (documents.length === 0) {
        return;
      }

      sidebar.push('');
      sidebar.push(`* ${title}`);
      for (const resource of documents) {
        sidebar.push(`  * [${resource.metadata.title}](./${resource.id}.md)`);
        await resource.write(context);
      }

      sidebar.push('');
    }

    await emitSidebarSection('Constructs', pkg.l2Resources);
    await emitSidebarSection('Classes', pkg.classes);
    await emitSidebarSection('Structs', pkg.structs);
    await emitSidebarSection('Interfaces', pkg.interfaces);
    await emitSidebarSection('Enums', pkg.enums);
    await emitSidebarSection('CloudFormation', [ ...pkg.cfnResources, ...pkg.cfnOtherTypes ]);

    sidebar.push('');

    const sidebarDoc = new Document('_sidebar', sidebar.join('\n'), { title: 'Sidebar' });
    await sidebarDoc.write(context);

    pkg.readme.contents = pkg.readme.contents;

    await pkg.readme.write(context);

    const indexFile = path.join(context.docPath, 'index.html');
    await fs.writeFile(indexFile, renderIndex({ title: assembly.name, homepage: `${pkg.readme.id}.md` }));
  }
}

interface AssemblyDoc {
  isServiceAssembly: boolean;
  serviceName: string;
  displayName: string;
  readme: Document;
  l2Resources: Document[];
  cfnResources: Document[];
  classes: Document[];
  structs: Document[];
  interfaces: Document[];
  enums: Document[];
  cfnOtherTypes: Document[];
  hasHandwrittenClasses: boolean;
}

function analyzeAssembly(assembly: jsiiReflect.Assembly): AssemblyTypes {
  const constructType = ts.findClass('@aws-cdk/core.Construct');

  const constructs = assembly.classes.filter(c => c.extends(constructType));

  // Resource constructor types
  const constructSet = new Set(constructs);

  const documentableInterfaces = assembly.interfaces;

  const isServiceAssembly = assembly.name.indexOf('/aws-') >= 0 || assembly.name.indexOf('alexa') >= 0;  // Sigh

  function isCfnType(x: jsiiReflect.Type) {
    return isServiceAssembly && (x.name.startsWith('Cfn') || (!!x.namespace && x.namespace.startsWith('Cfn')));
  }

  return {
    assembly,
    isServiceAssembly,
    cfnResources: constructs.filter(c => isCfnType(c)),
    constructs: constructs.filter(c => !isCfnType(c)),
    cfnDataTypes: documentableInterfaces.filter(c => isCfnType(c)),
    nonResourceInterfaces: documentableInterfaces.filter(i => !isCfnType(i)),
    nonResourceClasses: assembly.classes.filter(c => !constructSet.has(c)),
    enums: assembly.enums,
  };
}

function documentAssembly(render: Rendering, types: AssemblyTypes): AssemblyDoc {
  const serviceName = assemblyShortName(types.assembly);
  const readmeName = `${serviceName}-readme`;

  const renderPage = (r: jsiiReflect.Type) => render.typePage(r);

  const constructs = types.constructs.map(r => render.classPage(r));

  const cfnOtherTypes = types.cfnDataTypes.map(render.typePage.bind(render));

  const displayName = render.packageDisplayName(types.assembly);

  const hasHandwrittenClasses = constructs.length + types.nonResourceClasses.length + types.nonResourceInterfaces.length > 0;

  return {
    serviceName,
    displayName,
    isServiceAssembly: types.isServiceAssembly,
    readme: render.assemblyOverview(types.assembly, readmeName, displayName),
    l2Resources: constructs,
    cfnResources: types.cfnResources.map(r => render.classPage(r)),
    classes: types.nonResourceClasses.map(renderPage),
    structs: types.nonResourceInterfaces.filter(i => i.datatype).map(renderPage),
    interfaces: types.nonResourceInterfaces.filter(i => !i.datatype).map(renderPage),
    enums: types.enums.map(renderPage),
    cfnOtherTypes,
    hasHandwrittenClasses
  };
}

interface AssemblyTypes {
  assembly: jsiiReflect.Assembly;
  isServiceAssembly: boolean;
  constructs: jsiiReflect.ClassType[];
  cfnResources: jsiiReflect.ClassType[];
  cfnDataTypes: jsiiReflect.InterfaceType[];
  nonResourceClasses: jsiiReflect.ClassType[];
  nonResourceInterfaces: jsiiReflect.InterfaceType[];
  enums: jsiiReflect.EnumType[];
}
