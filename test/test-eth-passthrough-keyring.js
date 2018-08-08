const chai = require('chai')
const spies = require('chai-spies')
const {expect} = chai
const EthereumTx = require('ethereumjs-tx')
const assert = require('assert')
const sinon = require('sinon')
const Ganache = require('ganache-core')
const PassthroughKeyring = require('../')
const ethUtil = require('ethereumjs-util')
const Eth = require('ethjs')
// const { spawn } = require('child_process')

describe('PassthroughKeyring', function () {

    let keyring, provider, child, eth, accounts

    beforeEach(async function () {
      provider = Ganache.provider()
      eth = new Eth(provider)
      keyring = new PassthroughKeyring({ provider })
      accounts = await keyring.getAccounts()
    })

    describe('getRawTransactionByHash', function () {
      let infuraProvider, infuraKeyring
      const oldTxHash = '0x27631e20e2784974526b5d9b9e245a004aa484d276fe186ae2cb243e89790814'

      before(() => {
        infuraProvider = new Eth.HttpProvider('http://127.0.0.1:8545')
        infuraKeyring = new PassthroughKeyring({ provider: infuraProvider })
      })

      it('is able to get an old signed tx from geth', async () => {
        const rawTx = await infuraKeyring.getRawTransactionByHash(oldTxHash)
        assert.ok(rawTx)
      })
    })

    describe('Keyring.type', function () {
      it('is a class property that returns the type string.', function () {
        const type = PassthroughKeyring.type
        assert.equal(typeof type, 'string')
      })

      it('returns the correct value', function () {
        const type = keyring.type
        const correct = PassthroughKeyring.type
        assert.equal(type, correct)
      })
    })

    describe('constructor', function () {
      it('constructs', function (done) {
        assert.equal(typeof keyring, 'object', 'keyring is an object')
        keyring.getAccounts()
        .then(accounts => {
          assert.equal(Array.isArray(accounts), true, 'accounts is an array')
          assert.equal(accounts.length, 10, 'shows ten accounts')
          done()
        })
        .catch((reason) => {
          assert.ifError(reason, 'getAccounts had error')
          done(reason)
        })
      })
    })

    describe('serialize', function () {
      it('serializes an instance', function (done) {
        keyring.serialize()
        .then((output) => {
          assert.ok('rpcAddress' in output, 'has rpcAddress property')
          done()
        })
      })
    })

    describe('deserialize', function () {
      it('serializes what it deserializes', function (done) {
        const rpcAddress = 'http://localhost:1234'
        keyring.deserialize({
          rpcAddress,
        })
        .then(() => {
          return keyring.serialize()
        }).then((serialized) => {
          assert.equal(serialized.rpcAddress, rpcAddress)
          done()
        })
      })
    })

    describe('getAccounts', async function () {

      it('returns an array of accounts', async () => {
        const ethAccounts = await eth.accounts()
        assert.equal(Array.isArray(accounts), true)
        assert.equal(accounts.length, 10, 'returns ten accounts')
        assert.equal(accounts[0], ethAccounts[0], 'matches ganache')
      })
    })

    describe('signTransaction', function () {
      let stub

      beforeEach(async () => {
        stub = sinon.stub(keyring, 'getRawTransactionByHash')
        stub.callsFake(async () => {
          return '0xf86c328504a817c80082c350947727e5113d1d161373623e5f49fd568b4f543a9e88f42ece6c98e46000801ca0650dd9035e2184759b608abb997ff9e35c6b04cd61f29e52a8365ff7683fffa6a067c5b657358851813f7223f5cb2965ba8236f18f56a92dfb850e4cb35f32cc7f'
        })
      })

      afterEach(() => {
        sinon.restore()
      })

      it('should return a signed tx', async () => {
        const txParams = {
          from: accounts[0],
          nonce: '0x00',
          gasPrice: '0x09184e72a000',
          gasLimit: '0x2710',
          to: accounts[1],
          value: '0x1000',
        }
        const tx = new EthereumTx(txParams)

        try {
          const signed = await keyring.signTransaction(accounts[0], tx)
          assert.ok(signed, 'signed tx returned')
          const serialized = signed.serialize()
          assert.ok(serialized, 'was able to serialize')

          const expected = {
            from: '0xa2eff2cb7cdf1d98b922cffeb35ae88a691da5ef',
            to: '0x7727e5113d1d161373623e5f49fd568b4f543a9e',
          }

          for (let key in expected) {
            assert.equal(signed[key], expected[key])
          }

        } catch (e) {
          console.log('had a problem', e)
        }
      })
    })

    describe('signMessage', function () {
      it('should return a signed message', async () => {
        const signed = await keyring.signMessage(accounts[0], '0x12345')
        assert.ok(signed, 'returned a signed message')
      })
    })

    describe('signTypedData', function () {
      beforeEach(async () => {
        const stub = sinon.stub(keyring, 'passthroughSignTypedData')
        stub.callsFake(async () => {
          return 'a presumably good result!'
        })
      })

      afterEach(() => {
        sinon.restore()
      })

      const typedData = {
        types: {
            EIP712Domain: [
                { name: 'name', type: 'string' },
                { name: 'version', type: 'string' },
                { name: 'chainId', type: 'uint256' },
                { name: 'verifyingContract', type: 'address' },
            ],
            Person: [
                { name: 'name', type: 'string' },
                { name: 'wallet', type: 'address' }
            ],
            Mail: [
                { name: 'from', type: 'Person' },
                { name: 'to', type: 'Person' },
                { name: 'contents', type: 'string' }
            ],
        },
        primaryType: 'Mail',
        domain: {
            name: 'Ether Mail',
            version: '1',
            chainId: 1,
            verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
        },
        message: {
            from: {
                name: 'Cow',
                wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
            },
            to: {
                name: 'Bob',
                wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
            },
            contents: 'Hello, Bob!',
        },
      }

      it('should return the signed value', async function () {
        const data = await keyring.signTypedData(accounts[0], { data: typedData })
        assert.ok(data)
      })
    })

    describe('exportAccount', function () {
      it('should throw an error because it is not supported', function () {
        expect(_ => {
          keyring.exportAccount()
        }).to.throw('Not supported on this account')
      })
    })
})

