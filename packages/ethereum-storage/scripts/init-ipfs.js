/* eslint-disable spellcheck/spell-checker */
const shell = require('shelljs');
const fs = require('fs');
const path = require('path');

const argv = require('yargs')
  .usage('Usage: $0 [options]')
  // Allow the user to force IPFS config override
  .option('force', {
    alias: 'f',
    describe: 'Force the private IPFS config even if a config already exists',
    type: 'boolean',
  })
  // Get IPFS path from cli argument, environment variable or expected default path
  .option('path', {
    alias: 'p',
    describe:
      'The path to the IPFS config directory (the default path is usually already set on IPFS_PATH environment variable)',
    nargs: 1,
    type: 'string',
    default: process.env.IPFS_PATH || path.join(require('os').homedir(), '.ipfs'),
  }).argv;

// Swarm key content
const swarmKeyContent = `/key/swarm/psk/1.0.0/
/base16/
5f3af0599d991e5eb4c37da2472aa299759ee3350ba26c125d0c7579dd04dd52
`;

// Exit if IPFS is not installed
if (!shell.which('ipfs')) {
  shell.echo('IPFS is not installed or not in the PATH');
  shell.exit(1);
}

const ipfsPath = argv.path;
shell.echo('IPFS Path:');
shell.echo(ipfsPath);

// Initialize the IPFS node
initializeNode(ipfsPath);

// Setup the swarm key file
setupSwarmKey(ipfsPath, swarmKeyContent);

shell.echo('Done');
shell.exit(0);

/**
 * Initialize the IPFS node with private network settings
 */
function initializeNode(ipfsPath) {
  // Check if the ipfs folder exists and if it is writable.
  try {
    fs.accessSync(ipfsPath, fs.constants.F_OK | fs.constants.W_OK);
    // If --force argument is set, the config will be overwritten
    if (argv.force) {
      shell.echo('IPFS config already exists. Force argument set, overriding it.');
    } else {
      shell.echo('IPFS config already exists (use --force if you want to override it)');
      shell.exit(0);
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      shell.echo(`No read access to ipfs config folder: ${ipfsPath}`);
      shell.exit(1);
    }

    // Initializing ipfs repo
    shell.echo('No IPFS repo found in $IPFS_PATH. Initializing...');
    shell.exec('ipfs init');
  }

  // Reinitialize bootstrap nodes
  shell.echo('Removing all bootstrap nodes...');
  shell.echo(
    '(see https://github.com/ipfs/go-ipfs/blob/master/docs/experimental-features.md#private-networks)',
  );
  shell.exec('ipfs bootstrap rm --all');

  shell.echo('Adding private swarm bootstrap nodes...');
  shell.exec(
    `ipfs bootstrap add /dns4/ipfs-bootstrap.request.network/tcp/4001/ipfs/QmaSrBXFBaupfeGMTuigswtKtsthbVaSonurjTV967Fdxx /dns4/ipfs-bootstrap-2.request.network/tcp/4001/ipfs/QmYdcSoVNU1axgSnkRAyHtwsKiSvFHXeVvRonGCAV9LVEj /dns4/ipfs-2.request.network/tcp/4001/ipfs/QmPBPgTDVjveRu6KjGVMYixkCSgGtVyV8aUe6wGQeLZFVd /dns4/ipfs-survival.request.network/tcp/4001/ipfs/Qmb6a5DH45k8JwLdLVZUhRhv1rnANpsbXjtsH41esGhNCh`,
  );

  shell.echo('Configuring the IPFS node...');
  // Disable DHT routing
  shell.exec(`ipfs config Routing.Type none`);
}

/**
 * Setup the IPFS private swarm key
 */
function setupSwarmKey(ipfsPath, swarmKeyContent) {
  const swarmKeyPath = path.join(ipfsPath, 'swarm.key');
  // Check if the swarm key file exists
  try {
    fs.accessSync(swarmKeyPath, fs.constants.F_OK | fs.constants.W_OK);
    return;
  } catch (err) {
    shell.echo('No swarm.key found, creating a new key.');
  }

  // Create a new swarm key file
  try {
    fs.writeFileSync(swarmKeyPath, swarmKeyContent, {
      mode: 0o600,
    });
  } catch (err) {
    throw new Error(`Error creating swarm key file: ${err.message}`);
    return;
  }

  shell.echo('Swarm key file created.');
}
