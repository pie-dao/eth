import React from 'react';

import { If, Unless } from '@pie-dao/if-unless';
import { Modal } from 'minimal-react-modal';
import { view } from 'react-easy-state';

import { eth, modal } from '../store';
import WalletOption from './WalletOption';

const disconnect = () => {
  modal.disconnect();
};

const onClick = () => {
  modal.reconnect();
  modal.isPending = true;
  window.ethereum.enable().catch(modal.onError);
};

const ConnectModal = () => {
  const { account, error, wrongNetwork } = eth;
  const {
    close,
    isActive,
    isPending,
    reset,
  } = modal;

  return (
    <Modal
      className="connect-modal-container"
      isActive={isActive}
      closeModal={close}
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

      <Unless condition={isPending || account || error}>
        <WalletOption onClick={onClick} />
      </Unless>

      <If condition={isPending && !account}>
        <div className="pending">
          Please log-in to your wallet and connect it to PIE
        </div>
      </If>

      <If condition={error}>
        <div className="error">
          <img src="/assets/img/error.jpg" alt="error icon" />
          <div>Error Connecting</div>
          <div>{error}</div>
          <Unless condition={wrongNetwork}>
            <button type="button" className="btn" onClick={reset}>Go Back</button>
          </Unless>
        </div>
      </If>
    </Modal>
  );
};

export default view(ConnectModal);
