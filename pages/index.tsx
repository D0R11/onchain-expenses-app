import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { Flipside, QueryResultSet } from "@flipsidecrypto/sdk";
import { Expenses, Results } from "../types";
import { useEffect, useState } from "react";
import { CSVLink } from "react-csv";

import {
  Box,
  Button,
  Container,
  Flex,
  IconButton,
  Table,
  TableCaption,
  TableContainer,
  Tbody,
  Td,
  Tfoot,
  Th,
  Thead,
  Tr,
  useColorMode,
  Input,
  ButtonGroup,
  useToast,
  SlideFade,
  useDisclosure,
} from "@chakra-ui/react";
import {
  AddIcon,
  ArrowRightIcon,
  CheckIcon,
  CloseIcon,
  DeleteIcon,
  DownloadIcon,
  EditIcon,
  MoonIcon,
  SunIcon,
} from "@chakra-ui/icons";
import moment from "moment";
import axios, { AxiosResponse } from "axios";
import { useAccount, useEnsName } from "wagmi";
import Profile from "../components/profile";
import { useIsMounted } from "../utils/useismounted";

const Home: NextPage<{ api_key: string }> = ({ api_key }) => {
  const flipside = new Flipside(api_key, "https://node-api.flipsidecrypto.com");
  const isMounted = useIsMounted();
  const { address } = useAccount();
  const { data: ensName } = useEnsName({ address });
  const [data, setData] = useState<Expenses[]>([
    {
      label: "Curation Multisig",
      tx_hash:
        "0x4465e69998dd2e13070e858427545ea4818258eb8345aec9df3125e98f3e560e",
    },
    {
      label: "Curation Multisig",
      tx_hash:
        "0xc6ef925f4a5e613a50fc0c65ee8ce6a4b6692361f5d54c9785ba26017c05da14",
    },
    {
      label: "DAPP Swap",
      tx_hash:
        "0xe2f0cc20aa949303ef6061c52c10aee31bc49eee77a375a27f6a07343252c8fa",
    },
  ]);
  const [expenses, setExpenses] = useState<Results[] | undefined>();
  const { colorMode, toggleColorMode } = useColorMode();
  const [newData, setNewData] = useState<Expenses>({
    label: "",
    tx_hash: "",
  });
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [activeRow, setActiveRow] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [query, setQuery] = useState<string>("");
  const [ethPrice, setEthPrice] = useState<number>(0);
  const { isOpen, onClose, onOpen } = useDisclosure();
  const toast = useToast();

  const fetchQuery = async () => {
    if (query !== "") {
      setLoading(true);

      if (isOpen) {
        onClose();
      }
      const result: QueryResultSet = await flipside.query.run({
        sql: query,
        ttlMinutes: 10,
      });
      const res = result?.records;
      const stats = result.runStats;

      const final: Results[] | undefined = res?.map((row: any) => ({
        ...data.find((datum: Expenses) => datum.tx_hash === row.tx_hash),
        ...row,
        gas_fee_in_usd: (ethPrice * row?.gas_fee).toLocaleString(),
      }));
      setExpenses(final);
      setLoading(false);
      onOpen();
      if (!result.error) {
        toast({
          title: "Query Successful.",
          description: `${stats?.recordCount} rows returned in ${stats?.elapsedSeconds} seconds.`,
          status: "success",
          position: "bottom",
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: "Error occurred while querying.",
          description: `${result.error}`,
          status: "error",
          position: "bottom",
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  const deleteRow = (id: number) => {
    const filterData = data.filter(
      (datum: Expenses, index: number) => index !== id
    );
    setData(filterData);
  };

  const editaBool = () => {
    setIsEditing(!isEditing);
  };

  const editRow = (id: number) => {
    setActiveRow(id);
    setNewData(data[id]);
    setIsEditing(true);
  };

  const updateFieldChanged =
    (index: number) => (e: React.FormEvent<HTMLInputElement>) => {
      const target = e.target as HTMLTextAreaElement;
      setNewData({
        ...newData,
        [target.name]: target.value,
      });
    };

  const submit = (index: number) => {
    var newArr = [...data];
    newArr[index] = newData;
    setData(newArr);
    editaBool();
    setNewData({
      label: "",
      tx_hash: "",
    });
    setActiveRow(null);
  };
  const addRow = () => {
    setData([
      ...data,
      {
        label: "",
        tx_hash: "",
      },
    ]);
    editRow(data.length);
  };

  useEffect(() => {
    async function getEthPrice() {
      const result = await axios
        .get(
          "https://api.coinpaprika.com/v1/price-converter?base_currency_id=eth-ethereum&quote_currency_id=usdc-usd-coin&amount=1"
        )
        .then((res: AxiosResponse) => setEthPrice(res.data.price))
        .catch((err: any) =>
          toast({
            title: "Error fetching Ethereum price.",
            description: `${err}`,
            status: "error",
            position: "bottom",
            duration: 5000,
            isClosable: true,
          })
        );
    }
    try {
      getEthPrice();

      if (data.length > 0) {
        const transactionHashes: Array<string> = data.map(
          (row: Expenses) => `lower('${row.tx_hash}')`
        );
        console.log(transactionHashes);
        let txHashList: string = transactionHashes.join();
        setQuery(
          `select 
          block_timestamp as date_executed,
          tx_hash,
          tx_fee as gas_fee
          from 
          ethereum.core.fact_transactions
          where tx_hash in (${txHashList})`
        );
      }
    } catch (err: any) {
      console.error(err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);
  if (!isMounted) return null;
  return (
    <Flex height="100vh">
      <Head>
        <title>Onchain Expenses App</title>
        <meta name="description" content="Onchain expenses app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Container maxW="container.xl" centerContent>
        <Profile />
        <Box padding="4" maxW="md">
          <IconButton
            icon={colorMode === "light" ? <SunIcon /> : <MoonIcon />}
            aria-label="Toggle light/dark mode"
            isRound={true}
            size="md"
            onClick={toggleColorMode}
          />
        </Box>
        <Box m={5}>
          <TableContainer>
            <Table variant="simple" size="sm">
              <TableCaption>
                <ButtonGroup justifyContent="center">
                  <Button
                    leftIcon={<AddIcon />}
                    onClick={() => addRow()}
                    disabled={isEditing}
                    colorScheme="gray"
                    variant="solid"
                  >
                    Add new transaction
                  </Button>
                  <Button
                    leftIcon={<ArrowRightIcon />}
                    colorScheme="green"
                    variant="solid"
                    disabled={isEditing || loading}
                    isLoading={loading}
                    onClick={() => fetchQuery()}
                  >
                    Run Query
                  </Button>
                </ButtonGroup>
              </TableCaption>
              <Thead>
                <Tr>
                  <Th>Label</Th>
                  <Th>Transaction Hash</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {data.map((row: Expenses, index: number) => {
                  return isEditing && activeRow === index ? (
                    <Tr key={row.tx_hash}>
                      <Td>
                        <Input
                          defaultValue={row?.label}
                          name="label"
                          size="sm"
                          onChange={updateFieldChanged(index)}
                        />
                      </Td>
                      <Td>
                        <Input
                          defaultValue={row.tx_hash}
                          name="tx_hash"
                          size="sm"
                          onChange={updateFieldChanged(index)}
                        />
                      </Td>
                      <Td>
                        <ButtonGroup justifyContent="center" size="sm">
                          <IconButton
                            aria-label="submit"
                            icon={<CheckIcon />}
                            variant="outline"
                            colorScheme="green"
                            onClick={() => submit(index)}
                          />
                          <IconButton
                            aria-label="cancel"
                            variant="outline"
                            icon={<CloseIcon />}
                            onClick={() => editaBool()}
                          />
                        </ButtonGroup>
                      </Td>
                    </Tr>
                  ) : (
                    <Tr key={row.tx_hash}>
                      <Td>{row?.label}</Td>
                      <Td>{row.tx_hash}</Td>
                      <Td>
                        <ButtonGroup justifyContent="center" size="sm">
                          <IconButton
                            aria-label="edit"
                            variant="outline"
                            onClick={() => editRow(index)}
                            icon={<EditIcon />}
                          />
                          <IconButton
                            aria-label="delete"
                            icon={<DeleteIcon />}
                            variant="outline"
                            colorScheme="red"
                            onClick={() => deleteRow(index)}
                          />
                        </ButtonGroup>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
        <SlideFade in={isOpen} offsetY="20px">
          <Box m={5}>
            {expenses !== undefined && (
              <TableContainer>
                <Table variant="simple" size="sm">
                  <TableCaption>
                    <Button
                      leftIcon={<DownloadIcon />}
                      colorScheme="blue"
                      variant="outline"
                    >
                      <CSVLink data={expenses} filename="Reimbursements">
                        Download as CSV
                      </CSVLink>
                    </Button>
                  </TableCaption>
                  <Thead>
                    <Tr>
                      <Th>Date</Th>
                      <Th>Label</Th>
                      <Th>Transaction Hash</Th>
                      <Th>Gas Fee</Th>
                      <Th>Gas Fee (in USD)</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {expenses.map((row: Results, index: number) => (
                      <Tr key={row.tx_hash}>
                        <Td>
                          {moment(row.date_executed).format("MMM. DD, YYYY")}
                        </Td>
                        <Td>{row.label}</Td>
                        <Td>{row.tx_hash}</Td>
                        <Td>{row.gas_fee}</Td>
                        <Td>{row.gas_fee_in_usd}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                  <Tfoot></Tfoot>
                </Table>
              </TableContainer>
            )}
          </Box>
        </SlideFade>
      </Container>
    </Flex>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  const flipside_key = `${process.env.FLIPSIDE_API_KEY}`;
  return {
    props: {
      api_key: flipside_key,
    },
  };
};
export default Home;
