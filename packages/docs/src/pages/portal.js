import React from 'react';
import Layout from '@theme/Layout';
import RedocStandalone from '../components/redoc';

class docApi extends React.Component {
  render() {
    return (
      <Layout title={`Portal API`} description="Portal API description">
        <div>
          <RedocStandalone
            specUrl="https://api.request.network/spec/openapi.yml"
            options={{
              nativeScrollbars: true,
              theme: { colors: { main: '#dd5522' } },
            }}
          />
        </div>
      </Layout>
    );
  }
}

export default docApi;
