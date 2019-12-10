# Construct Catalog

## Development Plan

- [x] **Ingestion**: 
  - [x] Query npm for packages labeled with `cdk`
  - [x] Add package in dynamo table
- [x] **Renderer**: 
  - [x] Process all updates to table (through a queue)
  - [x] Render a static website (through `cdk-docgen`)
  - [x] Upload to s3 bucket (under `packages/PACKAGE@VERSION`)
  - [x] Create a `metadata.json` file in the package's s3 prefix as a marker that we are done
- [ ] **Indexer**:
  - [x] Subscribe a queue for S3 object create notifications on `package/**/metadata.json`
  - [x] Process the queue through a lambda function
  - [x] Read the `metadata.json` file and parse the metadata
  - [ ] Skip if we already have a tweet for this module
  - [ ] Create a tweet for this module with title, description, version, etc.
- [ ] **Frontend**
  - [ ] Search box which queries Twitter
  - [ ] Show results

## TODO

- [ ] Filter by license
- [ ] 