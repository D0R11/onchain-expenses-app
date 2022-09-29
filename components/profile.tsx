import { Avatar, Button, useToast } from "@chakra-ui/react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useEnsAvatar,
  useEnsName,
} from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";

export default function Profile() {
  const { address, isConnected } = useAccount();
  const toast = useToast();
  const { data: ensName } = useEnsName({ address });
  const { data: ensAvatar } = useEnsAvatar({ addressOrName: address });
  const { connect, error, connectors } = useConnect({
    connector: new InjectedConnector(),
  });
  const { disconnect } = useDisconnect();

  const onConnect = () => {
    connect();
    if (error) {
      toast({
        title: `An error occurred.`,
        description: `${error}`,
        variant: "left-accent",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <>
      {!isConnected && (
        <Button onClick={() => onConnect()}>Connect Wallet</Button>
      )}
      {isConnected && (
        <Button onClick={() => disconnect()}>
          <Avatar size="xs" src={`${ensAvatar}`} mr={2} />
          {""}
          {ensName ?? address}
        </Button>
      )}
    </>
  );
}
