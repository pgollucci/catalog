const { TypeScriptLibraryProject, Semver } = require('projen');

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
    'cdk8s-cli': Semver.caret('0.25.0')
  },
  dependencies: {
    'cdk8s': Semver.caret('0.25.0'),
    'constructs': Semver.caret('2.0.0'),
    'stdk8s': Semver.caret('0.0.0'),
    'aws-sdk': Semver.caret('2.696.0'),
    '@elastic/elasticsearch': Semver.caret('7.7.1')
  },
  buildWorkflow: false,
  releaseWorkflow: false,
});

project.addScripts({
  "synth": "npm run compile && cdk8s synth",
  "kind:create": "kind/create-cluster.sh",
  "kind:delete": "kind/delete-cluster.sh",
  "kind:recreate": "npm run kind:delete && npm run kind:create",
  "kind:connect": "kubectl config use-context kind-kind",
  "kind:apply": "npm run synth && kubectl apply -f dist/catalogsearchkind.k8s.yaml",
  "eks:connect": "kubectl config use-context arn:aws:eks:us-east-1:499430655523:cluster/SearchKubernetes8BEC1CD3-fb8a111e81ac46d998c4d56666e588ba",
  "kube:dashboard-token": "kubectl -n kubernetes-dashboard describe secret $(kubectl -n kubernetes-dashboard get secret | grep adminuser | awk '{print $1}')",
  "kube:elastic-password": "kubectl get secret elasticsearch-es-elastic-user -o go-template='{{.data.elastic | base64decode}}'",
  "kube:elastic-logs": "kubectl logs $(kubectl get -A pods | grep elasticsearch | awk '{print $2}')",
  "kube:elastic-forward": "kubectl port-forward service/elasticsearch-es-http 9200",
  "kube:kibana-forward": "kubectl port-forward service/kibana-kb-http 5601",
  "kube:wait": "kubectl --all-namespaces --all=true wait --for=condition=Ready pod --timeout=5m",
  "kube:proxy": "kubectl proxy",
  "kube:dashboard": "npm run kube:dashboard-token && npm run kube:proxy",
  "elastic:ping": "curl -u \"elastic:$(kubectl get secret elasticsearch-es-elastic-user -o go-template='{{.data.elastic | base64decode}}')\" -k http://localhost:9200",
});

project.gitignore.exclude('dist/');

project.synth();