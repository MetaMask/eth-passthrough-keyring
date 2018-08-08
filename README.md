eth-passthrough-keyring [![CircleCI](https://circleci.com/gh/MetaMask/eth-passthrough-keyring.svg?style=svg)](https://circleci.com/gh/MetaMask/eth-passthrough-keyring)
==================

An implementation of MetaMask's [Keyring interface](https://github.com/MetaMask/eth-simple-keyring#the-keyring-class-protocol), that uses exposed ethereum RPC accounts to pass transactions through for signing.

Using
-----

Uses all the same methods from the [Keyring class protocol](https://github.com/MetaMask/eth-simple-keyring#the-keyring-class-protocol),
there are a few others:

Testing
-------
Run the following command:

```
npm test
```



Attributions
-------
This code was inspired by [eth-ledger-keyring](https://github.com/jamespic/eth-ledger-keyring) and [eth-hd-keyring](https://github.com/MetaMask/eth-hd-keyring)
