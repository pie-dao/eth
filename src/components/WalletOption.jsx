import React from 'react';
import PropTypes from 'prop-types';

import { view } from '@risingstack/react-easy-state';

const WalletOption = ({ onClick }) => (
  <div
    className="wallet-option-container"
    onClick={onClick}
    onKeyPress={onClick}
    role="button"
    tabIndex="-101"
  >
    <div className="title">
      Select a Web3 Provider
    </div>
    <div className="provider">
      &nbsp;
      <img src="./assets/img/metamask-logo.svg" alt="metamask" />
      MetaMask
    </div>
  </div>
);

WalletOption.propTypes = {
  onClick: PropTypes.func.isRequired,
};

export default view(WalletOption);
