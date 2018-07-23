eth-passthrough-keyring [![CircleCI](https://circleci.com/gh/MetaMask/eth-passthrough-keyring.svg?style=svg)](https://circleci.com/gh/MetaMask/eth-passthrough-keyring)
==================

An implementation of MetaMask's [Keyring interface](https://github.com/MetaMask/eth-simple-keyring#the-keyring-class-protocol), that uses exposed ethereum RPC accounts to pass transactions through for signing.

Using
-----

In addition to all the known methods from the [Keyring class protocol](https://github.com/MetaMask/eth-simple-keyring#the-keyring-class-protocol),
there are a few others:


- **isUnlocked** : Returns true if we have the public key in memory, which allows to generate the list of accounts at any time

- **unlock** : Connects to the TREZOR device and exports the extended public key, which is later used to read the available ethereum addresses inside the passthrough account.

- **setAccountToUnlock** : the index of the account that you want to unlock in order to use with the signTransaction and signPersonalMessage methods

- **getFirstPage** : returns the first ordered set of accounts from the TREZOR account

- **getNextPage** : returns the next ordered set of accounts from the TREZOR account based on the current page

- **getPreviousPage** : returns the previous ordered set of accounts from the TREZOR account based on the current page

- **forgetDevice** : removes all the device info from memory so the next interaction with the keyring will prompt the user to connect the TREZOR device and export the account information

Testing
-------
Run the following command:

```
npm test
```



Attributions
-------
This code was inspired by [eth-ledger-keyring](https://github.com/jamespic/eth-ledger-keyring) and [eth-hd-keyring](https://github.com/MetaMask/eth-hd-keyring)
