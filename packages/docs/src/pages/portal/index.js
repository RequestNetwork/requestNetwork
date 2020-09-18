import React from 'react';
import Layout from '@theme/Layout';
import { RedocStandalone } from 'redoc';
import styles from './styles.module.css';

class docApi extends React.Component {
  render() {
    return (
      <Layout title={`Portal API`} description="Portal API description">
        <div className={styles.redoc}>
          <RedocStandalone
            specUrl="https://api.request.network/spec/openapi.yml"
            options={{
              nativeScrollbars: true,
              theme: {
                colors: { primary: { main: '#008c62' } },
                typography: {
                  fontSize: '15px',
                  fontFamily: 'Roboto, Montserrat, sans-serif',
                  headings: {
                    fontFamily: 'Roboto, Montserrat, sans-serif',
                  },
                },
              },
            }}
          />
        </div>
      </Layout>
    );
  }
}

export default docApi;
