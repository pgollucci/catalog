const { TypeScriptLibraryProject, Semver, Jest, Eslint } = require('projen');

const project = new TypeScriptLibraryProject({
  name: 'search-redrive',
  private: true,
  description: 'redrive search queue from dynamo storage',
  repository: 'https://github.com/construct-catalog/catalog.git',
  authorName: 'Elad Ben-Israel',
  authorEmail: 'benisrae@amazon.com',
  devDependencies: {
    '@types/node': Semver.caret('13.9.8'),
    'cdk8s-cli': Semver.caret('0.25.0')
  },
  dependencies: {
    'cdk8s': Semver.caret('0.25.0'),
    'constructs': Semver.caret('2.0.0'),
    'stdk8s': Semver.caret('0.0.0')
  },
});

project.addScripts({
  apply: 'npx cdk8s synth && kubectl apply -f dist/'
});

project.gitignore.exclude('dist/');

new Jest(project);
new Eslint(project);

project.synth();
