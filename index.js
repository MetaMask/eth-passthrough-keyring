const { EventEmitter } = require('events')
const ethUtil = require('ethereumjs-util')
const sigUtil = require('eth-sig-util')
const Transaction = require('ethereumjs-tx')
const HDKey = require('hdkey')
const hdPathString = `m/44'/60'/0'/0`
const keyringType = 'RPC Passthrough'
const decoder = require('ethereum-tx-decoder')
const pathBase = 'm'
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
      serialized[field] = tx.field
    })
    const txHash = await this.eth.sendTransaction(serialized)

    // TODO: We need to call `eth.getRawTransactionByHash`
    // This is not tested well right now, good testing is
    // pending support in Ganache to match Geth:
    // https://github.com/trufflesuite/ganache-core/issues/135

    // Replicating behavior of ethUtil.ecsign within ethereumjs-tx
    const hexSig = await this.getRawTransactionByHash(txHash)
    const sig = decoder.decodeTx(hexSig)
    Object.assign(tx, sig)

    return tx
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
    return this.eth.signMessage(withAccount, data)
  }

  signPersonalMessage (withAccount, message) {
    return this.eth.signPersonalMessage(withAccount, message)
  }

  signTypedData (withAccount, typedData) {
    return this.eth.signTypedData(withAccount, typedData)
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
