import React from 'react';
import classnames from 'classnames';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';
import IntegrationOptions from '../components/integration-options'



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
				<IntegrationOptions />
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
