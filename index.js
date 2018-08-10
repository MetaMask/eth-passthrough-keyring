const { EventEmitter } = require('events')
const ethUtil = require('ethereumjs-util')
const sigUtil = require('eth-sig-util')
const Transaction = require('ethereumjs-tx')
const decoder = require('ethereum-tx-decoder')
const HDKey = require('hdkey')
const hdPathString = `m/44'/60'/0'/0`
const keyringType = 'RPC Passthrough'
const pathBase = 'm'
const retry = require('async-retry')
const DEFAULT_RPC = 'http://127.0.0.1:8545'
const Eth = require('ethjs')
const FIELDS = [
  'nonce',
  'gasPrice',
  'gasLimit',
  'to',
  'value',
  'data',
]

class PassthroughKeyring extends EventEmitter {
  constructor (opts = {}) {
    super()
    this.type = keyringType
    this.accounts = []
    this.deserialize(opts)
  }

  serialize () {
    return Promise.resolve({
      rpcAddress: this.rpcAddress,
    })
  }

  async deserialize (opts = {}) {
    this.rpcAddress = opts.rpcAddress || DEFAULT_RPC
    this.provider = opts.provider || new Eth.HttpProvider(this.rpcAddress)
    this.eth = new Eth(this.provider)
  }

  addAccounts (n = 1) {
    throw new Error('Not supported on this keyring')
  }

  getAccounts () {
    return this.eth.accounts()
  }

  removeAccount (address) {
    throw new Error('Not supported on this account')
  }

  // tx is an instance of the ethereumjs-transaction class.
  async signTransaction (address, tx) {
    const serialized = { from: address }
    FIELDS.forEach((field) => {
      const value = ethUtil.bufferToHex(tx[field])
      serialized[field] = ethUtil.bufferToHex(tx[field])
    })
    const txHash = await this.eth.sendTransaction(serialized)

    // TODO: We need to call `eth.getRawTransactionByHash`
    // This is not tested well right now, good testing is
    // pending support in Ganache to match Geth:
    // https://github.com/trufflesuite/ganache-core/issues/135

    // Replicating behavior of ethUtil.ecsign within ethereum-tx-decoder
    const hexSig = await this.pollForTransactionByHash(txHash)
    const decoded = decoder.decodeTx(hexSig);
    ['v', 'r', 's'].forEach(key => tx[key] = decoded[key])

    return tx
  }

  pollForTransactionByHash (txHash) {
    const opts = {
      retries: 5,
      minTimeout: 300,
    }

    return retry(this.getRawTransactionByHash.bind(this, txHash), opts)
  }

  getRawTransactionByHash (txHash) {
    return new Promise((res, rej) => {
      this.provider.sendAsync({
        method: 'eth_getRawTransactionByHash',
        params: [txHash],
        id: Math.round(Math.random() * 1000),
      }, (err, result) => {
        if (err) return rej(err)
        if (result.error) return rej(result.error)
        res(result.result)
      })
    })
  }

  signMessage (withAccount, data) {
    return this.eth.sign(withAccount, data)
  }

  signPersonalMessage (withAccount, message) {
    return this.eth.signPersonalMessage(withAccount, message)
  }

  signTypedData (withAccount, typedData) {
    return this.passthroughSignTypedData(withAccount, typedData)
  }

  passthroughSignTypedData (address, data) {
    return new Promise((res, rej) => {
      this.provider.sendAsync({
        method: 'eth_signTypedData',
        params: [address, data],
        id: Math.round(Math.random() * 1000),
      }, (err, result) => {
        if (err) return rej(err)
        if (result.error) return rej(result.error)
        res(result.result)
      })
    })
  }


  exportAccount (address) {
    throw new Error('Not supported on this account')
  }

  /* PRIVATE METHODS */

  _padLeftEven (hex) {
    return hex.length % 2 !== 0 ? `0${hex}` : hex
  }

  _normalize (buf) {
    return this._padLeftEven(ethUtil.bufferToHex(buf).substring(2).toLowerCase())
  }

}

PassthroughKeyring.type = keyringType
module.exports = PassthroughKeyring
