const { TypeScriptLibraryProject, Semver } = require('projen');

const cdk8sVersion = Semver.pinned('0.25.0-pre.2b30557056d5d0b3c3ee91d376e546bed74fdb17');

const project = new TypeScriptLibraryProject({
  name: 'catalog-search',
  commitPackageJson: true,
  mergify: false,
  private: true,
  description: 'Search application for the construct catalog',
  repository: 'https://github.com/construct-catalog/catalog.git',
  authorName: 'Eli Polonsky',
  authorEmail: 'epolon@amazon.com',
  devDependencies: {
    '@types/node': Semver.caret('13.9.8'),
    'cdk8s-cli': cdk8sVersion
  },
  dependencies: {
    'cdk8s': cdk8sVersion,
    'constructs': Semver.caret('2.0.0'),
    'cdk8s-plus': cdk8sVersion,
    'aws-sdk': Semver.caret('2.696.0'),
    '@elastic/elasticsearch': Semver.caret('7.7.1')
  },
  buildWorkflow: false,
  releaseWorkflow: false,
});

project.addScripts({
  "synth": "npm run compile && cdk8s synth",
  "kind:create": "scripts/create-kind-cluster.sh",
  "kind:delete": "scripts/delete-kind-cluster.sh",
  "kind:recreate": "npm run kind:delete && npm run kind:create",
  "kind:redeploy": "npm run kind:recreate && npm run kind:connect && npm run kind:apply && npm run kube:wait",
  "kind:connect": "kubectl config use-context kind-kind",
  "kind:apply": "npm run synth && npm run kind:connect && kubectl apply -f dist/catalogsearchkind.k8s.yaml",
  "eks:connect": "kubectl config use-context arn:aws:eks:${AWS_REGION}:${AWS_ACCOUNT}:cluster/SearchKubernetes8BEC1CD3-fb8a111e81ac46d998c4d56666e588ba",
  "eks:apply": "npm run synth && npm run eks:connect && kubectl apply -f dist/catalogsearcheks.k8s.yaml",
  "kube:dashboard-token": "kubectl -n kubernetes-dashboard describe secret $(kubectl -n kubernetes-dashboard get secret | grep adminuser | awk '{print $1}')",
  "kube:elastic-password": "kubectl get secret elasticsearch-es-elastic-user -o go-template='{{.data.elastic | base64decode}}'",
  "kube:elastic-logs": "kubectl logs $(kubectl get -A pods | grep elasticsearch | awk '{print $2}')",
  "kube:elastic-forward": "kubectl port-forward service/elasticsearch-es-http 9200",
  "kube:kibana-forward": "kubectl port-forward service/kibana-kb-http 5601",
  "kube:wait": "kubectl --all-namespaces --all=true wait --for=condition=Ready pod --timeout=5m",
  "kube:proxy": "kubectl proxy",
  "kube:dashboard": "npm run kube:dashboard-token && npm run kube:proxy",
  "elastic:ping": "curl -u \"elastic:$(kubectl get secret elasticsearch-es-elastic-user -o go-template='{{.data.elastic | base64decode}}')\" -k http://localhost:9200",
  "build": "yarn compile && yarn test" // no need to package
});

project.gitignore.exclude('dist/');

project.synth();