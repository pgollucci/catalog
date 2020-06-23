#!/bin/bash

set -euo pipefail
scriptdir=$(cd $(dirname $0) && pwd)

AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID?"Need to set AWS_ACCESS_KEY_ID"}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY?"Need to set AWS_SECRET_ACCESS_KEY"}
AWS_SESSION_TOKEN=${AWS_SESSION_TOKEN?"Need to set AWS_SESSION_TOKEN"}

echo "Pre-pulling relevant docker images."
docker pull docker.elastic.co/elasticsearch/elasticsearch:7.7.1
docker pull docker.elastic.co/eck/eck-operator:1.1.2
docker pull kubernetesui/metrics-scraper:v1.0.4
docker pull kubernetesui/dashboard:v2.0.0
docker pull docker.elastic.co/kibana/kibana:7.7.1
docker pull node:12.18.0-stretch

kind create cluster

# we intentionally create the secret this way so that we don't store the credentials
# anywhere on disk.
kubectl create secret generic aws-creds \
  --from-literal=AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID} \
  --from-literal=AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY} \
  --from-literal=AWS_SESSION_TOKEN=${AWS_SESSION_TOKEN}

echo "Loading relevant docker images from host to kind node."
kind load docker-image docker.elastic.co/eck/eck-operator:1.1.2
kind load docker-image kubernetesui/metrics-scraper:v1.0.4
kind load docker-image kubernetesui/dashboard:v2.0.0
kind load docker-image docker.elastic.co/elasticsearch/elasticsearch:7.7.1
kind load docker-image docker.elastic.co/kibana/kibana:7.7.1
kind load docker-image node:12.18.0-stretch