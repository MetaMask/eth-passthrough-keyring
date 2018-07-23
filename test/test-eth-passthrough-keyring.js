const chai = require('chai')
const spies = require('chai-spies')
const {expect} = chai
const EthereumTx = require('ethereumjs-tx')
const assert = require('assert')
const Ganache = require('ganache-core')
const PassthroughKeyring = require('../')
const ethUtil = require('ethereumjs-util')
const Eth = require('ethjs')

describe('PassthroughKeyring', function () {

    let keyring, provider

    beforeEach(async function () {
      provider = Ganache.provider()
      keyring = new PassthroughKeyring({ provider })
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
      let accounts, eth
      beforeEach(async function () {
        accounts = await keyring.getAccounts()
        eth = new Eth(provider)
      })

      it('returns an array of accounts', async () => {
        const ethAccounts = await eth.accounts()
        assert.equal(Array.isArray(accounts), true)
        assert.equal(accounts.length, 10, 'returns ten accounts')
        assert.equal(accounts[0], ethAccounts[0], 'matches ganache')
      })
    })

    describe('signTransaction', function () {
      let accounts, eth
      beforeEach(async function () {
        accounts = await keyring.getAccounts()
        eth = new Eth(provider)
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
          const rawTx = ethUtil.bufferToHex(serialized)
          assert.ok(rawTx, 'Was able to hexify')
        } catch (e) {
          console.log('had a problem', e)
        }
      })
    })

    describe('signMessage', function () {
      it('should throw an error because it is not supported', function () {
        expect(_ => {
          keyring.signMessage()
        }).to.throw('Not supported on this account')
      })
    })

    describe('signPersonalMessage', function () {
      expect(_ => {
        keyring.signPersonalMessage()
      }).to.throw('Not supported on this account')
    })

    describe('signTypedData', function () {
        it('should throw an error because it is not supported', function () {
            expect(_ => {
                keyring.signTypedData()
            }).to.throw('Not supported on this device')
        })
    })

    describe('exportAccount', function () {
        it('should throw an error because it is not supported', function () {
            expect(_ => {
                keyring.exportAccount()
            }).to.throw('Not supported on this device')
        })
    })

    describe('forgetDevice', function () {
        it('should clear the content of the keyring', async function () {
            // Add an account
            keyring.setAccountToUnlock(0)
            await keyring.addAccounts()

            // Wipe the keyring
            keyring.forgetDevice()

            const accounts = await keyring.getAccounts()

            assert.equal(keyring.isUnlocked(), false)
            assert.equal(accounts.length, 0)
        })
    })

})
