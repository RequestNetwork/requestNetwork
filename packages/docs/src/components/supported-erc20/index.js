import React from 'react';
import contractMap from 'eth-contract-metadata';
import styles from './styles.module.css';

const tokens = Object.entries(contractMap)
  .filter(([, { erc20 }]) => !!erc20)
  .map(([address, token]) => ({ ...token, address }))
  .sort((a, b) => a.symbol > b.symbol);

const CurrencyList = ({ currencies, selected, onClick }) => {
  const currList = currencies.map(token => (
    <li
      key={token.symbol}
      onClick={() => onClick(token)}
      className={selected && token.symbol === selected.symbol ? styles.selected : ''}
    >
      <strong>{token.symbol}</strong> {token.name}
    </li>
  ));

  return <ul className={styles.list}>{currList}</ul>;
};

const CurrencyDetails = ({ currency }) => {
  if (!currency) {
    return <></>;
  }

  return (
    <div className={styles.details}>
      <h3>
        <span className={styles.symbol}>{currency.symbol}</span>
        {currency.name}
      </h3>
      <ul>
        <li>
          <strong>Symbol:</strong> {currency.symbol}
        </li>
        <li>
          <strong>Decimals:</strong> {currency.decimals}
        </li>
        <li>
          <strong>Smart contract:</strong> {currency.address}
        </li>
      </ul>
    </div>
  );
};

export default () => {
  const [currencies, setCurrencies] = React.useState(tokens);
  const [search, setSearch] = React.useState('');
  const [selectedCurrency, setSelectedCurrency] = React.useState(
    tokens.find(r => r.symbol === 'REQ'),
  );

  React.useEffect(() => {
    if (!search) {
      setCurrencies(tokens);
    } else {
      setCurrencies(
        tokens.filter(token => token.symbol.toLowerCase().includes(search.toLowerCase())),
      );
    }
  }, [search]);

  return (
    <div className={styles.main}>
      <input
        type="text"
        className={styles.searchBar}
        placeholder="Search token"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <CurrencyList
        currencies={currencies}
        onClick={token => setSelectedCurrency(token)}
        selected={selectedCurrency}
      />
      <CurrencyDetails currency={selectedCurrency} />
    </div>
  );
};
