import Head from 'next/head'
import styles from '../styles/Home.module.css'

export default function Home() {
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


        </div>
      </div>
    </div>
  )
}
