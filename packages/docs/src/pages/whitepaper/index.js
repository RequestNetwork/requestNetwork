import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import styles from './styles.module.css';

const whitepapers = {
  English: 'https://request.network/assets/pdf/request_whitepaper.pdf',
  Bulgarian: 'https://request.network/assets/pdf/bulgarian_whitepaper.pdf',
  Chinese: 'https://request.network/assets/pdf/chinese_whitepaper.pdf',
  Dutch: 'https://request.network/assets/pdf/dutch_whitepaper.pdf',
  French: 'https://request.network/assets/pdf/french_whitepaper.pdf',
  German: 'https://request.network/assets/pdf/german_whitepaper.pdf',
  Portuguese: 'https://request.network/assets/pdf/portuguese_whitepaper.pdf',
  Romanian: 'https://request.network/assets/pdf/romanian_whitepaper.pdf',
  Slovenian: 'https://request.network/assets/pdf/slovenian_whitepaper.pdf',
  Spanish: 'https://request.network/assets/pdf/spanish_whitepaper.pdf',
  Vietnamese: 'https://request.network/assets/pdf/vietnamese_whitepaper.pdf',
};

function Home() {
  const context = useDocusaurusContext();
  const { siteConfig = {} } = context;
  return (
    <Layout title={`Whitepaper`} description="Links to whitepapers">
      <div className="container">
        <h1>Whitepaper</h1>
        <p>Below you can find links for the whitepaper translated to different languages:</p>
        <ul className={styles.list}>
          {Object.entries(whitepapers).map(([lang, link]) => (
            <li>
              <a href={link}>{lang}</a>
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  );
}

export default Home;
