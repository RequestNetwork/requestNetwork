import React from 'react';
import classnames from 'classnames';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';
import IntegrationOptions from '../components/integration-options'
import {Redirect} from '@docusaurus/router';



function Home() {
	return <Redirect to="/docs/guides/0-getting-started" />;
}
export default Home;
