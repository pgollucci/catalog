var targz = require('targz');
var fs = require('fs');
import { TypeSystem } from 'jsii-reflect';
const project = '/tmp'
process.chdir(project);

var conf = {'bin-links': false, verbose: true, prefix: project}

async function fetchPackage(packageName: string): Promise<string> {
    return new Promise((resolve, reject) => {
        var cli = require('npm');
        cli.load(conf, (err: any) => {
            if(err) {
                return reject(err);
            }
            cli.commands.pack([packageName], (er: any, data: any) => {
                process.chdir(project);
                if(err) {
                    reject(err);
                }
                // Check for the existence of a .jsii file at the root of the package
                let hasJsii: boolean = false;
                data[0].files.forEach((element: { path: string; }) => {
                    if (element.path == '.jsii') {
                        hasJsii = true;
                    }
                });
                if (hasJsii) {
                    resolve(data[0].filename);
                }
                else {
                    reject("No .jsii file found in root directory");
                }
                
            });
        });
    });
}

async function unzipPackage(filepath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        targz.decompress({
            src: filepath,
            dest: '/tmp/'
        }, function(err: any){
            if(err) {
                console.log(err);
            } else {
                var data = fs.readFileSync(`/tmp/package/.jsii`);
                resolve(data.toString());
            }
        })
    });
}

async function getjson(zipfile: string) {
    return unzipPackage(`/tmp/${zipfile}`).then(JSON.parse);
}

export const lambdaHandler = async (event: any = {}): Promise<any> => {
    const body = JSON.parse(event.body);
    const packageName = body.packageName;
    const x = await fetchPackage(packageName).then(function(response) {
        console.log(`Response: ${response}`);
        return response;
    }, function(err) {
        console.log(err); // Error: "It broke"
        throw err
    });
    const blob = await getjson(x);
    const typeSystem = new TypeSystem();
    typeSystem.load('/tmp/package', {validate: true});
    console.log(`classes: ${typeSystem.classes}`);
    console.log(`enums: ${typeSystem.enums}`);
    console.log(`interfaces: ${typeSystem.interfaces}`);
    console.log(`methods: ${typeSystem.methods}`);
    console.log(`properties: ${typeSystem.properties}`);
    console.log(`roots: ${typeSystem.roots}`);
    return blob.author;
}