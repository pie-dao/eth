import React from 'react';

import { If, Unless } from '@pie-dao/if-unless';
import { InjectedConnector } from '@web3-react/injected-connector';
import { Modal } from 'minimal-react-modal';
import { useWeb3React } from '@web3-react/core';
import { view } from 'react-easy-state';

import { eth, modal } from '../store';
import WalletOption from './WalletOption';

const ConnectModal = () => {
  const { account, networkId } = eth;

  const injected = new InjectedConnector({
    supportedChainIds: [networkId],
  });

  const { activate, deactivate } = useWeb3React();

  const disconnect = () => {
    modal.disconnect();
    deactivate();
  };

  const onClick = async () => {
    modal.reconnect();
    modal.isPending = true;

    try {
      await activate(injected, modal.onError);
    } catch (e) {
      modal.onError(e);
    }

    if (!eth.error) {
      modal.close();
    }
  };

  return (
    <Modal
      className="connect-modal-container"
      isActive={modal.isActive}
      closeModal={modal.close}
      showAnimation={false}
      modalBoxStyle={{
        width: '100%',
        maxWidth: 600,
        padding: '5%',
      }}
    >
      <If condition={account || false}>
        <button type="button" className="btn" onClick={disconnect}>Disconnect</button>
      </If>

      <Unless condition={modal.isPending || account || eth.error}>
        <WalletOption onClick={onClick} />
      </Unless>

      <If condition={modal.isPending}>
        <div className="pending">
          Please log-in to your wallet and connect it to PIE
        </div>
      </If>

      <If condition={eth.error}>
        <div className="error">
          <img src="/assets/img/error.jpg" alt="error icon" />
          <div>Error Connecting</div>
          <div>{eth.error}</div>
          <button type="button" className="btn" onClick={modal.reset}>Go Back</button>
        </div>
      </If>
    </Modal>
  );
};

export default view(ConnectModal);
