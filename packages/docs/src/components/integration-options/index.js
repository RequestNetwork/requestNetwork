import React from 'react';
import classnames from 'classnames';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

const options = [
  {
    title: "Option A: Portal API",
    imageUrl: 'img/ReQ-01.png',
    description: (
      <>
        Fully managed solution, over REST API
      </>
    ),
    details: (
      <>
        <p>
          Easiest way to integrate Request without having to manage cryptographic keys or infrastructure, and with a fast data access.
				</p>
				<p>
					Go to <Link to="https://dashboard.request.network">the Request Portal</Link> in order to get your API keys, and your are good to go. This is the fastest option to integrate, and also the most performant to fetch requests because the Portal caches them for you. More details in the <Link to="/portal">Portal API Documentation</Link> or <Link to="/docs/guides/3-Portal-API/0-portal-intro">follow the guide</Link>.
				</p>

				<p>
					Keep in mind that when using the Portal API, Request handles your identity's private key. Request empowers all economical actors to control their finance, and fully decentralized organizations may look for a more distributed option. 
				</p>
				<p>
					The Portal is safe to be used in small and medium sized production environments. Request Portal does not move any fund, but it's better to <Link to="/docs/guides/3-Portal-API/5-api-conclusion">understand the risks</Link>
				</p>
      </>
    ),
  },
  {
    title: "Option B: Network Client",
    imageUrl: 'img/REQ-07-hands-02.png',
    description: <>Decentralized network usage, with managed hosting</>,
    details: (
      <>
        <p>
          Manage identities, encryption and network interactions yourself but let us host the Request node.
        </p>
				<p>
					You can see the documentation on the <Link to="/docs/client/index">Request JavaScript Client documentation</Link> or <Link to="/docs/guides/5-request-client/0-intro">follow the guide</Link>.
				</p>

				<p>
					The Request Client comes as a library installed with <Link to="https://www.npmjs.com/package/@requestnetwork/request-network.js">npm</Link>. It comes with all the features needed to create, fetch and updates payment requests, including encryption capabilities. This package also comes with a development mode relying on local storage. You manage identities and private keys, which means that no other party can sign Request transactions for you or your users.
				</p>
      </>
    ),
  },
  {
    title: "Option C: Network Node",
    imageUrl: 'img/REQ-05-patterns-02.png',
    description: (
      <>
        Fully decentralized with self-hosting
      </>
    ),
    details: (
      <>
        <p>
          Hosting your own node gives you full power over the Request network connections and storage options. 
          You decide of how requests hashes are pushed to Ethereum and how to store and access details (encrypted or not).
        </p>
        <p>
          <Link to="/docs/guides/6-hosting-a-node/0-intro">Follow the guide to setup your node</Link>.
        </p>
        <p>
          You query the node with the same <Link to="https://www.npmjs.com/package/@requestnetwork/request-network.js">Network Client</Link>. For your test environment, you can setup a Rinkeby node or a connection with our hosted Rinkeby node (cf. Option B).
        </p>
      </>
    ),
  },
];

function IntegrationOption({ showDetails, imageUrl, title, description, details }) {
  const imgUrl = useBaseUrl(imageUrl);
  return (
    <div className={classnames(styles.integrationOption, (!showDetails ?  styles.colOption : styles.rowOption ))}>
      {imgUrl && (
				<div className={classnames('text--center', styles.integrationOptionImage)}>
          <img className={classnames(styles.integrationOptionIllustration)} src={imgUrl} alt={title} />
        </div>
      )}
			<div className={classnames(styles.integrationOptionText)}>
        {showDetails && (
          <>
            <a class="anchor" id={title.toString().toLowerCase().split(" ").join("-")} >
            </a>
            <h3>{title}</h3>
          </>
        )}
        {!showDetails && (
          <Link to={"/integration-options#" + title.toString().toLowerCase().split(" ").join("-")} >
            <h3>{title}</h3>
          </Link>
        )}
				<div className={classnames(styles.integrationOptionDescription)}>{description}</div>
				{showDetails && (
          <p>{details}</p>
				)}
			</div>
		</div>
  );
}

function IntegrationOptions({showDetails = false}) {

  return (
		<>
        {options && options.length && (
          <section className={showDetails ? styles.integrationOptions : styles.homeIntegrationOptions }>
                {options.map((props, idx) => (
									<IntegrationOption showDetails={showDetails} key={idx} {...props} />
                ))}
          </section>
        )}
		</>
  );
}

export default IntegrationOptions;
