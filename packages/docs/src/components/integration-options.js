import React from 'react';
import classnames from 'classnames';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

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
    <div className={classnames(styles.integrationOption, (!showDetails ?  styles.colOption : styles.rowOption ))}>
      {imgUrl && (
				<div className={classnames('text--center', styles.integrationOptionImage)}>
          <img className={classnames(styles.integrationOptionIllustration)} src={imgUrl} alt={title} />
        </div>
      )}
			<div className={classnames(styles.integrationOptionText)}>
				<h3>{title}</h3>
				<p>{description}</p>
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
	const later = <div className="container">
						TODO: design a nice page with appealing images and links to relevant docs and guides. On the homepage: quick ref for each option. On the integration page: get into the details including with pros and cons 
		</div>

	const disclaimer = (showDetails ? later : "");
			

  return (
		<>
				{disclaimer}
        {features && features.length && (
          <section className={showDetails ? styles.integrationOptions : styles.homeIntegrationOptions }>
                {features.map((props, idx) => (
									<Feature showDetails={showDetails} key={idx} {...props} />
                ))}
          </section>
        )}
			<span>TODO: adding details like testimonies here would be nice.</span>
		</>
  );
}

export default IntegrationOptions;
