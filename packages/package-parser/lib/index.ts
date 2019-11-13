var targz = require('targz');
var fs = require('fs');
const util = require('util')
import { TypeSystem } from 'jsii-reflect';
const project = '/tmp'
process.chdir(project);

function installNpm() {
    /**
     * I import the cli here because I don't want anything to have access to it until afetr the config is loaded
     * Since the load is done async, I'd rather restrict how it can be acceses=d.
     */
    var cli = require('npm');
    const conf = {'bin-links': false, verbose: true, prefix: project}
    const loadPromise = util.promisify(cli.load)
    return loadPromise(conf).then(() => util.promisify(cli.commands.pack))
}

function loadPackage(packageLoader: any, packageName: string) {
    return packageLoader([packageName]).then((data: any) => data)
}

function parsePackage(data: any) {
    process.chdir(project);
    let hasJsii: boolean = false;
    data[0].files.forEach((element: { path: string; }) => {
        if (element.path == '.jsii') {
            hasJsii = true;
        }
    });
    if (hasJsii) {
        return data[0].filename;
    }   
}

function unzipPackage(filename: string) {
    const unzipPromis = util.promisify(targz.decompress)
    return unzipPromis({src: `/tmp/${filename}`, dest: '/tmp/'}).then((data: any) => data)
}

function readJsii() {
    return fs.readFileSync(`/tmp/package/.jsii`);
}

export const lambdaHandler = async (event: any = {}): Promise<any> => {
    const packageName = JSON.parse(event.body).packageName;
    const blob = await installNpm()
      .then((packageLoader: any) => loadPackage(packageLoader, packageName))
      .then((data: any) => parsePackage(data))
      .then((filename: string) => unzipPackage(filename))
      .then(() => readJsii())
    
    const typeSystem = new TypeSystem();
    await typeSystem.load('/tmp/package/.jsii', {validate: false})
    typeSystem.classes.forEach(prop => {
        console.log(prop.spec.fqn);
    })
    return blob.name;
}