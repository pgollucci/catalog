# CDK Construct Catalog

The **CDK Construct Catalog** (https://awscdk.io) is an index of multi-language AWS CDK libraries. 

The services watches [npmjs](npmjs.com) and every time it discovers a new npm [jsii module](https://github.com/aws/jsii) with the keyword `cdk`, it will automatically render a reference documentation web page for it and tweet about it through the [@awscdkio](https://twitter.com/awscdkio) handle. For example, see the page for [cdk-secrets@0.4.1](https://awscdk.io/packages/cdk-secrets@0.4.1) and it's corresponding [tweet](https://twitter.com/awscdkio/status/1211268176274694145).

## Searching for modules

At the moment, you can simply use Twitter to search the catalog. Simply include the term "**@awscdkio**" in your Twitter search query. For example, here are the [results](https://twitter.com/search?q=%40awscdkio%20dynamodb) for the query "**@awscdkio dynamodb**".

## Publishing modules

The Construct Catalog will automatically discover jsii multi-language modules published to npm with the `cdk` keyword:

1. Follow the instructions in [jsii/README](https://github.com/aws/jsii) on how to create a jsii module.
2. Make sure your `package.json` file includes at least the keyword `cdk`.
3. Publish your module to all package managers. You can use [aws-delivlib](https://github.com/awslabs/aws-delivlib) to define your multi-language release pipeline. This is the same tech we use to publish the AWS CDK to all package managers.

Here are some examples for modules: [cdk-secrets](https://github.com/udondan/cdk-secrets), [cdk-watchful](https://github.com/eladb/cdk-watchful), [cdk-dynamo-table-viewer](https://github.com/eladb/cdk-dynamo-table-viewer).

## Contributing to this project

This is the source code repository for the Construct Catalog (https://awscdk.io). Contributions are more than welcome!

This repo includes multiple packages:

- [cdk-docden](./packages/cdk-docgen/README.md) - generates a static website from an npm/jsii module.
- [catalog](./packages/catalog/README.md) - the construct catalog CDK application.

Check out our [issue list](https://github.com/construct-catalog/catalog/issues) for ideas for contributions.

## License

This project is licensed under [Apache 2.0](./LICENSE)
