#!/bin/bash

PASSWORD=$(kubectl get secret elasticsearch-es-elastic-user -o go-template='{{.data.elastic | base64decode}}')

curl -u "elastic:${PASSWORD}" -k https://127.0.0.1:9200