# Construct Catalog

## Development Plan

- [x] **Ingestion**: 
  - [x] Query npm for packages labeled with `cdk`
  - [x] Publish package to an ingestion dynamo topic
- [x] **Renderer**: 
  - [x] Process all updates to the ingestion topic through a queue
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

## TODO

- [ ] Filter by license