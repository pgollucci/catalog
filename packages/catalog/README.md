# Construct Catalog

## Design

We organize our ingestion process into the following stages:

```
INGESTION => RENDERER => INDEXER
```

In the **INGESTION** phase, we periodically query npmjs for all module with the
keyword `cdk` and publish any new modules to an SNS topic. We use a DynamoDB
table to avoid duplicated publishing (this implemented by the `DynamoTopic`
construct).

The **RENDERER** subscribes the the aforementioned topic, downloads the module
from npmjs and renders a static website for the module using `cdk-docgen` (based
on the module's jsii metadata). When done, it publishes to another
`DynamoTopic`.

The **INDEXER** subscribes to the renderer's topic and posts a new tweet in the
catalog Twitter account for each new module. Since Twitter has rate limiting
(300 tweets per 3 hours), we use an `AtomicCounter` to control the tweet flow.
We write the tweet ID to a DynamoDB table that will eventually contain all our
modules with their metadata and the tweet ID associated with them (for reverse
lookup from module to tweet).

We also have static **FRONTEND** which serves the static pages rendered for each
module and eventually a search UX that searches for modules in the catalog's
Twitter account.

## Roadmap

- [x] **Ingestion**: 
  - [x] Query npm for packages labeled with `cdk`
  - [x] Publish package to an ingestion dynamo topic
  - [ ] Filter by license
- [x] **Renderer**: 
  - [x] Process all updates to the ingestion topic through a queue
  - [ ] Skip if we already rendered this module
  - [x] Render a static website (through `cdk-docgen`)
  - [x] Upload to s3 bucket (under `packages/PACKAGE@VERSION`)
  - [x] Create a `metadata.json` file in the package's s3 prefix as a marker that we are done
  - [x] Publish package to a rendering dynamo topic
- [ ] **Indexer**:
  - [x] Process all updates to the rendering dynamo topic
  - [x] Process the queue through a lambda function
  - [ ] Skip if we already have a tweet for this module
  - [x] Create a tweet for this module with title, description, version, etc.
- [ ] **Frontend**
  - [ ] Search box which queries Twitter
  - [ ] Show results

## License

[Apache 2.0](./LICENSE)
