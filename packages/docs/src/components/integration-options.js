import React from 'react';
import classnames from 'classnames';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

const options = [
  {
		title: <>Fully managed solution, over REST API</>,
    imageUrl: 'img/ReQ-01.png',
    description: (
      <>
	Easiest way to integrate Request without having to manage cryptographic keys or infrastructure.
      </>
    ),
    details: (
      <>
				<p>
					Go to <Link to="https://portal.request.network">the Request Portal</Link> in order to get your API keys, and your are good to go. More details in the <Link to="https://api-docs.request.network">TODO-API Docs</Link> or <Link to="/docs/guides/3-API/0-portal-intro">follow the guide</Link>.
				</p>

				<p>
					Keep in mind that when using the API, Request handles your identity's private key. Request empowers all economical actors to control their finance, and fully decentralized organizations may look for a more distributed option. 
				</p>
				<p>
					The API is safe to be used in small and medium sized production environments. The identity is not used to move any fund, but it's better to <Link to="/TODO">understand the risks(TODO)</Link>
				</p>
      </>
    ),
  },
  {
		title: <>Decentralized network usage, with managed hosting</>,
    imageUrl: 'img/REQ-07-hands-02.png',
    description: <>Manage identities, encryption and network interactions yourself but let us host the Request node.</>,
    details: (
      <>
				<p>
					You can see the documentation on the <Link to="https://v2-docs-js-lib.request.network/index.html">TODO-Request JavaScript Client documentation</Link> or <Link to="/docs/guides/5-request-client/0-intro">follow the guide</Link>.
				</p>

				<p>
					The Request Client comes as a library installed with <Link to="https://www.npmjs.com/package/@requestnetwork/request-network.js">npm</Link>. It comes with all the features needed to create, fetch and updates payment requests, including encryption capabilities. This package also comes with a development mode relying on local storage. You manage identities and private keys, which means that no other party can sign Request transactions for you or your users.
				</p>
				<p>
					TODO: Request runs a Rinkeby node that you can use for free. If you want to plug to a mainnet node hosted by Request, get in touch with us.
				</p>
      </>
    ),
  },
  {
    title: <>Fully decentralized with self-hosting</>,
    imageUrl: 'img/REQ-05-patterns-02.png',
    description: (
      <>
				Hosting your own node gives you full power over the Request network connections and storage options. 
      </>
    ),
    details: (
      <>
				<p>
					You decide of how requests hashes are pushed to Ethereum and how to store and access details (encrypted or not).
				</p>
	Pros:
	Cons:
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
				<h3>{title}</h3>
				<div className="IntegrationOptionDescription">{description}</div>
				{showDetails && (
					<div className={classnames(styles.integrationOption)}>
						<p>{details}</p>
					</div>
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
