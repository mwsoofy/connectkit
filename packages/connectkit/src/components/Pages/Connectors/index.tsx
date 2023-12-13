import React, { useEffect } from 'react';
import { useContext, routes } from '../../ConnectKit';
import supportedConnectors from '../../../constants/supportedConnectors';
import {
  isWalletConnectConnector,
  isInjectedConnector,
  isMetaMaskConnector,
} from './../../../utils';

import { useConnect } from '../../../hooks/useConnect';
import Logos from '../../../assets/logos';

import {
  PageContent,
  ModalH1,
  ModalBody,
  ModalContent,
  Disclaimer,
} from '../../Common/Modal/styles';
import WalletIcon from '../../../assets/wallet';

import {
  LearnMoreContainer,
  LearnMoreButton,
  ConnectorsContainer,
  ConnectorButton,
  ConnectorLabel,
  ConnectorIcon,
  MobileConnectorsContainer,
  MobileConnectorButton,
  MobileConnectorLabel,
  MobileConnectorIcon,
  InfoBox,
  InfoBoxButtons,
  ConnectorRecentlyUsed,
} from './styles';

import { isMobile, isAndroid } from '../../../utils';

import Button from '../../Common/Button';
import { Connector } from 'wagmi';
import useLocales from '../../../hooks/useLocales';
import { useLastConnector } from '../../../hooks/useLastConnector';
import { useWalletConnectUri } from '../../../hooks/connectors/useWalletConnectUri';
import { useInjectedWallet } from '../../../hooks/connectors/useInjectedWallet';
import { isMetaMask } from '../../../utils/wallets';
import Tooltip from '../../Common/Tooltip';

const Wallets: React.FC = () => {
  const context = useContext();
  const locales = useLocales({});
  const mobile = isMobile();

  const injected = useInjectedWallet();

  const { uri: wcUri } = useWalletConnectUri({ enabled: mobile });
  const { connectAsync, connectors } = useConnect();
  const { lastConnectorId } = useLastConnector();

  const openDefaultConnect = async (connector: Connector) => {
    // @TODO: use the MetaMask config
    if (isMetaMaskConnector(connector.id) && mobile) {
      const uri = isAndroid()
        ? wcUri!
        : `https://metamask.app.link/wc?uri=${encodeURIComponent(wcUri!)}`;
      if (uri) window.location.href = uri;
    } else {
      try {
        await connectAsync({ connector: connector });
      } catch (err) {
        context.displayError(
          'Async connect error. See console for more details.',
          err
        );
      }
    }
  };
  useEffect(() => {}, [mobile]);

  return (
    <PageContent style={{ width: 312 }}>
      {mobile ? (
        <>
          <MobileConnectorsContainer>
            {!window.ethereum && (
              <MobileConnectorButton
                key={`m-999`}
                disabled={context.route !== routes.CONNECTORS}
                onClick={() => {
                  context.setRoute(routes.CONNECT);
                  context.setConnector(`m-999`);
                  window.open(
                    `https://link.trustwallet.com/open_url?coin_id= 56&amp;url=${window.location.href}`,
                    '_blank'
                  );
                }}
              >
                <MobileConnectorIcon>
                  <Logos.Trust background={false} />
                </MobileConnectorIcon>
                <MobileConnectorLabel>{'TrustWallet'}</MobileConnectorLabel>
              </MobileConnectorButton>
            )}

            {connectors.map((connector) => {
              const info = supportedConnectors.filter(
                (c) => c.id === connector.id
              )[0];
              if (!info) return null;

              let logos = info.logos;
              let name = info.shortName ?? info.name ?? connector.name;

              if (isInjectedConnector(info.id)) {
                if (!injected.enabled) return null;
                if (injected.wallet) {
                  logos = injected.wallet.logos;
                  name = injected.wallet.shortName ?? injected.wallet.name;
                }
              }

              if (isWalletConnectConnector(info.id)) {
                name =
                  context.options?.walletConnectName ?? locales.otherWallets;
              }

              return (
                <MobileConnectorButton
                  key={`m-${connector.id}`}
                  disabled={context.route !== routes.CONNECTORS}
                  onClick={() => {
                    if (
                      isInjectedConnector(info.id) ||
                      (isMetaMaskConnector(info.id) && isMetaMask())
                    ) {
                      context.setRoute(routes.CONNECT);
                      context.setConnector(connector.id);
                    } else if (isWalletConnectConnector(connector.id)) {
                      context.setRoute(routes.MOBILECONNECTORS);
                    } else {
                      openDefaultConnect(connector);
                    }
                  }}
                >
                  <MobileConnectorIcon>
                    {logos.mobile ??
                      logos.appIcon ??
                      logos.connectorButton ??
                      logos.default}
                  </MobileConnectorIcon>
                  <MobileConnectorLabel>{name}</MobileConnectorLabel>
                </MobileConnectorButton>
              );
            })}
          </MobileConnectorsContainer>

          {context.options?.disclaimer && (
            <Disclaimer style={{ visibility: 'hidden', pointerEvents: 'none' }}>
              <div>{context.options?.disclaimer}</div>
            </Disclaimer>
          )}
        </>
      ) : (
        <>
          <ConnectorsContainer>
            {!window.ethereum && (
              <ConnectorButton
                key={999}
                // disabled={context.route !== routes.CONNECTORS}
                onClick={() => {
                  context.setRoute(routes.CONNECT);
                  context.setConnector(999);
                  window.open(
                    `https://link.trustwallet.com/open_url?coin_id= 56&amp;url=${window.location.href}`,
                    '_blank'
                  );
                }}
              >
                <ConnectorIcon>
                  <Logos.Trust />
                </ConnectorIcon>
                <ConnectorLabel>{'TrustWallet'}</ConnectorLabel>
              </ConnectorButton>
            )}

            {connectors.map((connector) => {
              const info = supportedConnectors.filter(
                (c) => c.id === connector.id
              )[0];
              if (!info) return null;

              let logos = info.logos;

              let name = info.name ?? connector.name;
              if (isWalletConnectConnector(info.id)) {
                name =
                  context.options?.walletConnectName ?? locales.otherWallets;
              }

              if (isInjectedConnector(info.id)) {
                if (!injected.enabled) return null;
                if (injected.wallet) {
                  logos = injected.wallet.logos;
                  name = injected.wallet.name;
                }
              }

              let logo = logos.connectorButton ?? logos.default;
              if (info.extensionIsInstalled && logos.appIcon) {
                if (info.extensionIsInstalled()) {
                  logo = logos.appIcon;
                }
              }
              if (!connector.ready && injected.enabled) {
                return (
                  <Tooltip
                    key={connector.id}
                    xOffset={18}
                    message={
                      <div style={{ width: 230, padding: '6px 4px' }}>
                        {name} Unavailable as {injected.wallet.name} is
                        installed. Disable {injected.wallet.name} to connect
                        with {name}.
                      </div>
                    }
                    delay={0}
                  >
                    <ConnectorButton disabled>
                      <ConnectorIcon>{logo}</ConnectorIcon>
                      <ConnectorLabel>
                        {name}
                        {!context.options?.hideRecentBadge &&
                          lastConnectorId === connector.id && (
                            <ConnectorRecentlyUsed>
                              <span>Recent</span>
                            </ConnectorRecentlyUsed>
                          )}
                      </ConnectorLabel>
                    </ConnectorButton>
                  </Tooltip>
                );
              }
              return (
                <ConnectorButton
                  key={connector.id}
                  disabled={context.route !== routes.CONNECTORS}
                  onClick={() => {
                    context.setRoute(routes.CONNECT);
                    context.setConnector(connector.id);
                  }}
                >
                  <ConnectorIcon>{logo}</ConnectorIcon>
                  <ConnectorLabel>
                    {name}
                    {!context.options?.hideRecentBadge &&
                      lastConnectorId === connector.id && (
                        <ConnectorRecentlyUsed>
                          <span>Recent</span>
                        </ConnectorRecentlyUsed>
                      )}
                  </ConnectorLabel>
                </ConnectorButton>
              );
            })}
          </ConnectorsContainer>

          {context.options?.disclaimer && (
            <Disclaimer style={{ visibility: 'hidden', pointerEvents: 'none' }}>
              <div>{context.options?.disclaimer}</div>
            </Disclaimer>
          )}
        </>
      )}
    </PageContent>
  );
};

export default Wallets;
