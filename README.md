# CDK Construct Catalog

## Design

### Monitor

1. Periodically queries [npmjs](https://www.npmjs.com) for all modules that
   include jsii CDK constructs (e.g. by label).
1. Check if we already have this module indexed (https://catalog/module/version
   already exists).
1. Queue up the module/version for rendering into the rendering SQS queue.

### Renderer

1. Processes module messages from an SQS queue.
1. Download the module and render a static website "home page" for it based on
   its jsii manifest. The website will include the README file, reference
   documentation and links to the module's page in all relevant package managers
   (npm, PyPI, Maven, NuGet, etc).
1. Upload the module's static website in an S3 bucket under `module/version`
1. S3 bucket will be exposed as a static website (through CloudFront) under
   https://catalog/module/version
1. S3 bucket also has bucket notifications that publish to SNS topics when new
   modules are created.

### Indexer

1. Subscribe to "new module" SNS notification
2. Post a tweet in the catalog Twitter account which contains the module's name,
   version, description, labels and URL to catalog

### Frontend

1. Public website exposes a search box. User enters keywords.
2. Use Twitter search to query the tweets in the catalog account.
3. Results include links to catalog pages.

