import Head from 'next/head'
import { useEffect, useRef, useState } from 'react'
import styles from '../styles/Home.module.css'
import Web3Modal from "web3Modal"
import { ethers } from 'ethers';

import { NFT_CONTRACT_ABI, NFT_CONTRACT_ADDRESS, DAO_CONTRACT_ADDRESS, DAO_CONTRACT_ABI } from '../constants';

export default function Home() {

  const [walletConnected, setWalletConnected] = useState(false);
  const [selectedTab, setSelectedTab] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [treasuryBalance, setTreasuryBalance] = useState("0");
  const [numProposals, setNumProposals] = useState("0");
  const [proposals, setProposals] = useState([]);
  const [nftBalance, setNftBalance] = useState(0);

  const [fakeNftTokenId, setFakeNftTokenId] = useState("");


  const web3ModalRef = useRef();

  /**
   * getOwner: gets the contract owner by connected address
   */
  const getDAOOwner = async () => {
    try {
      const signer = await getProviderOrSigner(true); //true?
      const daoContract = await getDaoContractInstance(signer);

      const _owner = await daoContract.owner();
      const userAddress = await signer.getAddress();

      if (_owner.toLowerCase() === userAddress.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * withdrawDAOEther: withdraws ether by calling
   * the withdraw function in the contract
   */
  const withdrawDAOEther = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const daoContract = await getDaoContractInstance(signer);

      const tx = await daoContract.withdrawEther();
      setLoading(true);
      await tx.wait();
      setLoading(false);
      getDAOTreasuryBalance();

    } catch (error) {
      console.error(error);
      window.alert(error.reason);
    }
  }

  // getDAOTreasuryBalance Reads the ETH balance of the DAO contract and sets the `treasuryBalance` state variable
  const getDAOTreasuryBalance = async () => {
    try {
      const provider = await getProviderOrSigner();

      const balance = await provider.getBalance(DAO_CONTRACT_ADDRESS);
      setTreasuryBalance(balance.toString());

    } catch (error) {
      console.error(error);
    }
  }

  // getNumProposalsInDAO Reads the number of proposals in the DAO contract and sets the `numProposals` state variable
  const getNumProposalsInDAO = async () => {
    try {
      const provider = await getProviderOrSigner();
      const daoContract = await getDaoContractInstance(provider);

      const daoNumProposals = await daoContract.numProposals();
      setNumProposals(daoNumProposals.toString());
    } catch (error) {
      console.error(error);
    }
  }

  // getUserNFTBalance Reads the balance of the user's CryptoDevs NFTs and sets the `nftBalance` state variable
  const getUserNFTBalance = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const nftContract = await getCryptodevsNFTContractInstance(signer);

      const signer_address = await signer.getAddress();
      const balance = await nftContract.balanceOf(signer_address);
      setNftBalance(parseInt(balance.toString()));

    } catch (error) {
      console.error(error);
    }
  }

  // createProposal Calls the `createProposal` function in the contract, using the tokenId from `fakeNftTokenId`
  const createProposal = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const daoContract = await getDaoContractInstance(signer);

      const tx = await daoContract.createProposal(fakeNftTokenId);
      setLoading(true);
      await tx.wait();
      await getNumProposalsInDAO();
      setLoading(false);

    } catch (error) {
      console.error(error);
      window.alert(error.reason);
    }
  }
  // fetchProposalById is Helper function to fetch and parse one proposal from the DAO contract
  // Given the Proposal ID
  // and converts the returned data into a Javascript object with values we can use
  const fetchProposalById = async (id) => {
    try {
      const provider = await getProviderOrSigner();
      const daoContract = await getDaoContractInstance(provider);

      const proposal = await daoContract.proposals(id);
      const parsedProposal = {
        proposalId: id,
        nftTokenId: proposal.nftTokenId.toString(),
        deadline: new Date(parseInt(proposal.deadline.toString()) * 1000),
        yayVotes: proposal.yayVotes.toString(),
        nayVotes: proposal.nayVotes.toString(),
        executed: proposal.executed,
      };
      return parsedProposal;

    } catch (error) {
      console.error(error);
    }
  }


  // fetchAllProposals Runs a loop `numProposals` times to fetch all proposals in the DAO
  // and sets the `proposals` state variable
  const fetchAllProposals = async () => {
    try {
      const proposals = [];
      for (let i = 0; i < parseInt(numProposals); i++) {
        const proposal = await fetchProposalById(i);
        proposals.push(proposal);
      }
      setProposals(proposals);
      return proposals;

    } catch (error) {
      console.error(error);
    }
  }


  // voteOnProposal Calls the `voteOnProposal` function in the contract, using the passed
  // proposal ID and Vote
  const voteOnProposal = async (proposalId, _vote) => {
    try {
      const signer = await getProviderOrSigner(true);
      const daoContract = await getDaoContractInstance(signer);

      let vote = _vote === "YAY" ? 0 : 1;
      const tx = await daoContract.voteOnProposal(proposalId, vote);
      setLoading(true);
      await tx.wait();
      setLoading(false);
      await fetchAllProposals();

    } catch (error) {
      console.error(error);
      window.alert(error.reason);
    }
  }


  // executeProposal Calls the `executeProposal` function in the contract, using
  // the passed proposal ID
  const executeProposal = async (proposalId) => {
    try {
      const signer = await getProviderOrSigner(true);
      const daoContract = await getDaoContractInstance(signer);

      const tx = await daoContract.executeProposal(proposalId);
      setLoading(true);
      await tx.wait();
      setLoading(false);
      await fetchAllProposals();
      getDAOTreasuryBalance();

    } catch (error) {
      console.error(error);
      window.alert(error.reason);
    }
  }

  // getDaoContractInstance is Helper function to return a DAO Contract instance
  // given a Provider/Signer
  const getDaoContractInstance = async (providerOrSigner) => {
    return new ethers.Contract(
      DAO_CONTRACT_ADDRESS,
      DAO_CONTRACT_ABI,
      providerOrSigner
    );
  }


  // getCryptodevsNFTContractInstance is Helper function to return a CryptoDevs NFT Contract instance
  // given a Provider/Signer
  const getCryptodevsNFTContractInstance = async (providerOrSigner) => {
    return new ethers.Contract(
      NFT_CONTRACT_ADDRESS,
      NFT_CONTRACT_ABI,
      providerOrSigner
    );
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
      getDAOOwner();
      getNumProposalsInDAO();
      getDAOTreasuryBalance();
      getUserNFTBalance();
    }

  }, [walletConnected]);

  // useEffect Piece of code that runs everytime the value of `selectedTab` changes
  // Used to re-fetch all proposals in the DAO when user switches
  // to the 'View Proposals' tab
  useEffect(() => {
    if (selectedTab === "View Proposals") {
      fetchAllProposals();
    }
  }, [selectedTab])

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

  function renderLoading(loadingMessage="") {
    return (
      <div className={styles.description}> Loading...{loadingMessage}... </div>
    );
  }


  // renderTabs is Render the contents of the appropriate tab based on `selectedTab`
  function renderTabs() {
    if (selectedTab === "Create Proposal") {
      return renderCreateProposalTab();
    } else if (selectedTab === "View Proposals") {
      return renderViewProposalsTab();
    }
    return null;
  }


  // renderCreateProposalTab Renders the 'Create Proposal' tab content
  function renderCreateProposalTab() {
    if (loading) {
      return renderLoading("Creating Proposal");
    } else if (nftBalance === 0) {
      return (
        <div className={styles.description}>
          You do not own any CryptoDevs NFTs.
          <br />
          <b>You cannot create or vote on proposals</b>
        </div>
      );
    } else {
      return (
        <div className={styles.container}>
          <label> Fake NFT token ID to Purchase: </label>
          <input
            placeholder='0'
            type="number"
            onChange={(e) => setFakeNftTokenId(e.target.value)}
          />
          <button className={styles.button2} onClick={createProposal}>
            Create
          </button>
        </div>
      );
    }
  }

  // renderViewProposalsTab Renders the 'View Proposals' tab content
  function renderViewProposalsTab() {
    if (loading) {
      return renderLoading("Loading Proposals");
    } else if (proposals.length === 0) {
      return (
        <div className={styles.description}>
          No proposals have been created
        </div>

      );
    } else {
      return (
        <div>
          kek
          {
            proposals.slice(0).reverse().map((p, index) => (
              <div key={index} className={styles.proposalCard}>
                <p>Proposal ID: {p.proposalId}</p>
                <p>Fake NFT to Purchase: {p.nftTokenId}</p>
                <p>Deadline: {p.deadline.toLocaleString()}</p>
                <p>Yay Votes: {p.yayVotes}</p>
                <p>Nay Votes: {p.nayVotes}</p>
                <p>Executed? {p.executed.toString()}</p>
                {
                  p.deadline.getTime() > Date.now() && !p.executed ? (
                    <div className={styles.flex}>
                      <button className={styles.button2} onClick={() => voteOnProposal(p.proposalId, "YAY")}>
                        Vote YAY
                      </button>
                      <button className={styles.button2} onClick={() => voteOnProposal(p.proposalId, "NAY")}>
                        Vote NAY
                      </button>
                    </div>
                  ) : p.deadline.getTime() < Date.now() && !p.executed ? (
                    <div>
                      <button className={styles.button2} onClick={() => executeProposal(p.proposalId)}>
                        Execute 
                      </button>
                    </div>
                  ) : (
                    <div className={styles.description}>Proposal Executed</div>
                  )
                }

              </div>
            ))
          }
        </div>
      )
    }

  }

  function renderConnectedPage() {
    if (walletConnected) {
      return (
        <div>
          <div className={styles.description}>
            Your Crypto NFT Balance: {nftBalance}
            <br />
            Treasury Blance: {ethers.utils.formatEther(treasuryBalance)} ETH
            <br />
            Total Number of Proposals: {numProposals}
          </div>
          <div className={styles.flex}>
            <button className={styles.button} onClick={() => setSelectedTab("Create Proposal")}>
              Create Proposal
            </button>
            <button className={styles.button} onClick={() => setSelectedTab("View Proposals")}>
              View Proposals
            </button>
          </div>
          <div> {renderTabs()}</div>
          <div>
            {isOwner ? (
              <div>
                {loading ? renderLoading() :
                  <button className={styles.button} onClick={withdrawDAOEther}>
                    Withdraw DAO ETH
                  </button>
                }

              </div>

            ) : ("")}
          </div>
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
          <div>
            <h1 className={styles.title}>
              Welcome to Crypro Devs!
            </h1>
            <div className={styles.description}>
              Welcome to the DAO!
            </div>
            <div>
              {renderButton()}
            </div>
            {renderConnectedPage()}

          </div>

        </div>
        <div>
          <img className={styles.image} src='/0.svg' />
        </div>

      </div>
    </div>
  )
}
