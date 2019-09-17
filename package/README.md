# Python
```python
from aws_cdk import core
from ddbsizemetric import DDBSizeLib


class MyStack(core.Stack):

    def __init__(self, scope: core.Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        # The polling frequency defaults to once every 6 hours, which is how frequently DynamoDB updates the Table information.
        DDBSizeLib(self, "MyDynamoTableScanner")
```

# Javascript
```js
import ddbsizemetric = require('@richardhboyd/ddbsizemetric');
import cdk = require('@aws-cdk/core');

export class DdbTestJsStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new ddbsizemetric.DDBSizeLib(this, "MyDynamoTableScanner")
  }
}
```