import React from 'react';
import classnames from 'classnames';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './integration-options.css';

const features = [
  {
		title: <>Portal REST API</>,
    imageUrl: 'img/ReQ-01.png',
    description: (
      <>
	Easiest way to integrate Request without having to manage cryptographic keys or infrastructure.
      </>
    ),
    details: (
      <>
	Pros:
	Cons:
      </>
    ),
  },
  {
		title: <>JS library client</>,
    imageUrl: 'img/REQ-07-hands-02.png',
    description: <>Incerase security by managing your identiity keys without hosting any infrastructure.</>,
    details: (
      <>
	Pros:
	Cons:
      </>
    ),
  },
  {
    title: <>Host your own node</>,
    imageUrl: 'img/REQ-05-patterns-02.png',
    description: (
      <>
        Praesent risus dui, dignissim ut dignissim nec, facilisis eget dui. Aenean quis dui odio.
        Integer tempus sapien a felis efficitur, sit amet facilisis erat pulvinar.
      </>
    ),
    details: (
      <>
	Pros:
	Cons:
      </>
    ),
  },
];

function Feature({ showDetails, imageUrl, title, description, details }) {
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
			<DetailedFeature showDetails={showDetails} details={details} />
    </div>
  );
}

function DetailedFeature({ showDetails, details }) {
	if (showDetails) {
		return (
			<div className={classnames('col col--4', styles.feature)}>
				<p>{details}</p>
			</div>
		);
	}
	else {
		return (<></>);
	}
}

function Home({details = false}) {
	const later = <div className="container">
						TODO: design a nice page with appealing images and links to relevant docs and guides. On the homepage: quick ref for each option. On the integration page: get into the details including with pros and cons 
		</div>
	//const later = "<span> TODO: design a nice page with appealing images and links to relevant docs and guides. On the homepage: quick ref for each option. On the integration page: get into the details including with pros and cons </span>";

	const disclaimer = (details ? later : "");
			

  return (
		<options>
				{disclaimer}
        {features && features.length && (
          <section className={styles.features}>
            <div className="container">
              <div className="row">
                {features.map((props, idx) => (
									<>
										<DetailedFeature key={idx} {...props} />
										<Feature showDetails={details} key={idx} {...props} />
									</>
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
