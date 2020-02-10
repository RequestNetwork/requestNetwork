import React from 'react';
import classnames from 'classnames';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

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
  const context = useDocusaurusContext();
  const { siteConfig = {} } = context;
  return (
    <Layout
      title={`Hello from ${siteConfig.title}`}
      description="Description will go into a meta tag in <head />"
    >
      <header className={classnames('hero hero-banner', styles.heroBanner)}>
        <div className="container">
          <h1 className="hero__title">{siteConfig.title}</h1>
          <p className="hero__subtitle">{siteConfig.tagline}</p>
          <div className={styles.buttons}>
            <Link
              className={classnames(
                'button button--outline button--secondary button--lg',
                styles.getStarted,
              )}
              to={useBaseUrl('docs/guides/0-getting-started')}
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>
      <main>
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
				<section>
					<div>
						<a href="/docs/guides/0-getting-started">Start the guide and discover Request and options step-by-step</a>
					</div>
				</section>
      </main>
    </Layout>
  );
}

export default Home;
