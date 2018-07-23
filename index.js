const { EventEmitter } = require('events')
const ethUtil = require('ethereumjs-util')
const sigUtil = require('eth-sig-util')
const Transaction = require('ethereumjs-tx')
const HDKey = require('hdkey')
const hdPathString = `m/44'/60'/0'/0`
const keyringType = 'RPC Passthrough'
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
    // Pending support in Ganache to match Geth:
    // https://github.com/trufflesuite/ganache-core/issues/135
    return tx
  }

  signMessage (withAccount, data) {
    throw new Error('Not supported on this account')
  }

  signPersonalMessage (withAccount, message) {
    throw new Error('Not supported on this account')
  }

  signTypedData (withAccount, typedData) {
    throw new Error('Not supported on this account')
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
