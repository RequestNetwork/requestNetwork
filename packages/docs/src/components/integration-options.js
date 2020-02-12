import React from 'react';
import classnames from 'classnames';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './integration-options.css';

const features = [
  {
	  title: <>Option 1: Portal REST API</>,
    imageUrl: 'img/undraw_docusaurus_mountain.svg',
    description: (
      <>
	Easiest way to integrate Request without having to manage cryptographic keys or infrastructure.
      </>
    ),
  },
  {
	  title: <>Option 2: JS library client</>,
    imageUrl: 'img/undraw_docusaurus_tree.svg',
    description: <>Incerase security by managing your identiity keys without hosting any infrastructure.</>,
  },
  {
    title: <>Host your own node</>,
    imageUrl: 'img/undraw_docusaurus_react.svg',
    description: (
      <>
        Praesent risus dui, dignissim ut dignissim nec, facilisis eget dui. Aenean quis dui odio.
        Integer tempus sapien a felis efficitur, sit amet facilisis erat pulvinar.
      </>
    ),
  },
];

function Feature({ imageUrl, title, description }) {
  const imgUrl = useBaseUrl(imageUrl);
  return (
    <div className={classnames('col col--4', styles.feature)}>
      {imgUrl && (
        <div className="text--center">
          <img className={styles.featureImage} src={imgUrl} alt={title} />
        </div>
      )}
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function Home() {
  return (
		<options>
			<span>TODO: design a nice page with appealing images and links to relevant docs and guides. On the homepage: quick ref for each option. On the integration page: get into the details including with pros and cons</span>

        {features && features.length && (
          <section className={styles.features}>
            <div className="container">
              <div className="row">
                {features.map((props, idx) => (
                  <Feature key={idx} {...props} />
                ))}
              </div>
            </div>
          </section>
        )}
			<span>TODO: adding details like testimonies here would be nice.</span>
		</options>
  );
}

export default Home;
