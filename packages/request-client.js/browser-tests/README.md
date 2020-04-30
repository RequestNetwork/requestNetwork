# Browser tests

The tests contained in this folder are not trivial to automate as they sometimes require the Metamask browser extension.

They represent some important use cases of the Request client, and good usage examples.

### Prerequisites

- a way to serve static files, we recommand `serve`:
```bash
yarn global add serve
```

- Metamask browser extension

- a running request-node on your local computer

### Usage

At the root of the monorepo, run: 

```bash
yarn build 
serve
```

Then navigate to http://localhost:5000/packages/request-client.js/browser-tests/

Tests will run automatically, and require your signature with Metamask.