/* eslint react/forbid-prop-types: 0 */
import React from 'react';
import PropTypes from 'prop-types';
import provider from 'eth-provider';

import { view } from 'react-easy-state';
import { Web3ReactProvider } from '@web3-react/core';

import { eth } from '../store';

const getLibrary = (newProvider) => {
  newProvider.on('accountsChanged', () => {
    eth.getLibrary(newProvider);
  });

  const ethersProvider = eth.getLibrary(newProvider);

  return ethersProvider;
};

window.addEventListener('DOMContentLoaded', () => {
  const existingProvider = provider(['frame', 'injected']);

  if (existingProvider) {
    getLibrary(existingProvider);
  }
});

const EthProvider = ({ children }) => (
  <Web3ReactProvider getLibrary={getLibrary}>
    {children}
  </Web3ReactProvider>
);

EthProvider.defaultProps = {
  children: '',
};

EthProvider.propTypes = {
  children: PropTypes.any,
};

export default view(EthProvider);
