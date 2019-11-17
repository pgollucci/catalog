# cdk-codegen

Generates static reference documentation from CDK jsii modules.

Usage:

```shell
cdk-codegen [node_modules] [--outdir dist]
```

For example:

```console
$ mkdir /tmp/bla
$ (cd /tmp/bla && npm i @aws-cdk/custom-resources)
$ cdk-codegen /tmp/bla/node_modules
```

You need a web server:"

```console
$ npm i -g docsify-cli
$ docify serve dist/@aws-cdk/custom-resources &
Listening at http://localhost:3000
$ open http://localhost:3000
```


