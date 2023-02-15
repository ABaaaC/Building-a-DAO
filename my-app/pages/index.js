import Head from 'next/head'
import { useEffect, useRef, useState } from 'react'
import styles from '../styles/Home.module.css'
import Web3Modal from "web3Modal"
import { ethers } from 'ethers';

import { NFT_CONTRACT_ABI, NFT_CONTRACT_ADDRESS, DAO_CONTRACT_ADDRESS, DAO_CONTRACT_ABI } from '../constants';

export default function Home() {

  const [walletConnected, setWalletConnected] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const web3ModalRef = useRef();

  const getOwner = async () => {
    try {
      const signer = await getProviderOrSigner();
      const daoContract = new ethers.Contract(
        DAO_CONTRACT_ADDRESS,
        DAO_CONTRACT_ABI,
        signer
      );

      const owner = await daoContract.owner();
      const userAddress = await signer.getAddress();

      if (owner.toLowerCase() === userAddress.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (error) {
      console.error(error);
    }
  }

  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new ethers.providers.Web3Provider(provider);

    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 5) {
      window.alert("Please, change the network to the Goerli!" + chainId);
      throw new Error("Incorrect network: " + chainId);
    }

    if (needSigner) {
      return web3Provider.getSigner();
    }
    return web3Provider;
  }

  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false
      })
    } else {
      getOwner();
    }

  }, [walletConnected]);

  function renderButton() {
    if (!walletConnected) {
      return (
        <div>
          <button className={styles.button} onClick={connectWallet}>
            Connect Wallet
          </button>
        </div>
      )
    }
  }

  return (
    <div>
      <Head>
        <title>
          CryptoDevs DAO
        </title>
        <meta name="description" content="DAO" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>
            Welcome to Crypro Devs DAO!
          </h1>
          <div>

          </div>

          {renderButton()}


        </div>
      </div>
    </div>
  )
}
