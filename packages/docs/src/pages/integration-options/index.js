import React from 'react';
import Layout from '@theme/Layout';
import IntegrationOptions from '../../components/integration-options';
import styles from './styles.module.css';

function Home() {
  return (
    <Layout title={`Integration Options`} description="Request Integration options">
      <main className={'container ' + styles.container}>
        <h1>What is the best way to integrate with Request?</h1>
        <h2>How to integrate Request?</h2>

        <p>
          The way you decide to interact with the network will determine the responsibility you have
          over security aspects and the settings you can adjust. Depending on your need for
          decentralization, you have three options:
        </p>

        <IntegrationOptions showDetails={true} />
      </main>
    </Layout>
  );
}

export default Home;
