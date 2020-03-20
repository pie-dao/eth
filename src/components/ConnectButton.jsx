import React from 'react';

import { view } from 'react-easy-state';

import { eth, modal } from '../store';
import { shortenAddress } from '../utils/address';

import Identicon from './Identicon';

const ConnectButton = () => {
  const shortAddress = eth.account ? shortenAddress(eth.account) : '';

  return (
    <div
      className="btn connect-button-container"
      onClick={modal.open}
      onKeyPress={modal.open}
      role="button"
      tabIndex="-100"
    >
      {eth.account ? (
        <>
          <p>{shortAddress}</p>
          <div className="icon-container">
            <div className="image-container">
              <Identicon />
            </div>
          </div>
        </>
      ) : (
        'Connect Web3'
      )}
    </div>
  );
};

export default view(ConnectButton);
