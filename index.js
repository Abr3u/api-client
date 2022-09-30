const axios = require("axios");
const _ = require("lodash");

const get = async (url, { headers } = { headers: {} }) => {
  const response = await axios.get(url, {
    headers,
  });

  return response.data;
};

const SOLSCAN_BASE_URL = "https://public-api.solscan.io";

const handleFailedRequests = (requests) => {
  // TODO
};

const getHolders = async (nftsAddresses) => {
  if (!nftsAddresses?.length) return [];

  const allPromises = [];
  for (let address of nftsAddresses) {
    allPromises.push(
      get(`${SOLSCAN_BASE_URL}/token/holders?tokenAddress=${address}`)
    );
  }

  const allPromisesResults = await Promise.allSettled(allPromises);

  const failedRequests = [];
  const holders = new Set();
  for (let result of allPromisesResults) {
    if (result.status === "rejected") {
      failedRequests.push(result);
    } else {
      const value = result.value;

      // filtering out holders that have an amount === 0 because we are only interested in account that actually hold the nft
      value.data
        .filter((x) => x.amount > 0)
        .map((x) => x.owner)
        .forEach((owner) => {
          holders.add(owner);
        });
    }
  }

  handleFailedRequests(failedRequests);

  return [...holders.values()];
};

const getAccountsTokens = async (accounts) => {
  if (!accounts?.length) return new Map();

  const allPromises = [];
  for (let account of accounts) {
    allPromises.push(
      get(`${SOLSCAN_BASE_URL}/account/tokens?account=${account}`)
    );
  }

  const allPromisesResults = await Promise.allSettled(allPromises);

  const failedRequests = [];
  const accountToTokens = new Map();
  for (let i = 0; i < allPromisesResults.length; i++) {
    const result = allPromisesResults[i];

    if (result.status === "rejected") {
      failedRequests.push(result);
    } else {
      const value = result.value;

      const accountTokens = value.map((x) => x.tokenAddress);

      accountToTokens.set(accounts[i], accountTokens);
    }
  }

  handleFailedRequests(failedRequests);

  return accountToTokens;
};

// note: here we assume having 1 nft or having 5 counts the same for checking most similar & least similar accounts
const findMostAndLeastSimilarAccounts = (accountsToTokens) => {
  const allAccounts = [...accountsToTokens.keys()];

  const accountToMostLeastSimilar = new Map();
  for (let account of allAccounts) {
    const myTokens = accountsToTokens.get(account);

    for (let other of allAccounts) {
      if (account === other) continue;

      const theirTokens = accountsToTokens.get(other);
      const intersection = _.intersection(myTokens, theirTokens);
      const intersectionSize = intersection.length;

      let stats = {
        most: {
          size: 0,
          account: "",
        },
        least: {
          size: Number.MAX_VALUE,
          account: "",
        },
      };

      if (accountToMostLeastSimilar.get(account)) {
        stats = accountToMostLeastSimilar.get(account);
      }

      if (intersectionSize > stats.most.size) {
        stats.most.size = intersectionSize;
        stats.most.account = other;
      }

      if (intersectionSize < stats.least.size) {
        stats.least.size = intersectionSize;
        stats.least.account = other;
      }

      accountToMostLeastSimilar.set(account, stats);
    }
  }

  const mostSimilar = {
    accounts: [],
    size: 0,
  };

  const leastSimilar = {
    accounts: [],
    size: Number.MAX_VALUE,
  };

  for (let account of accountToMostLeastSimilar.keys()) {
    const most = accountToMostLeastSimilar.get(account).most;
    const least = accountToMostLeastSimilar.get(account).least;

    if (most.size > mostSimilar.size) {
      mostSimilar.size = most.size;
      mostSimilar.accounts = [account, most.account];
    }

    if (least.size < leastSimilar.size) {
      leastSimilar.size = least.size;
      leastSimilar.accounts = [account, least.account];
    }
  }

  return {
    mostSimilar,
    leastSimilar,
  };
};

const nftsAddresses = [
  "AjAbxodjvNhtmNwgj7SMNTRZJSeQcpXAVbKKazFa2qfb",
  "DPmpfEMz2zXerrQHKc2YTa9Nxab16HQUAMRQmG1EbT7K",
  "H1LYo1xSzFsVXxYkUansfRLErgp9o1XXDGkoLaWjx389",
  "GaZNeteJ4dyK9VSWSGj4y99XtzMXoucaTRNCSxKELmcW",
];

// GET
(async () => {
  const holders = await getHolders(nftsAddresses);
  console.log("---> holders ", holders);

  const accountsToTokens = await getAccountsTokens(holders);

  const { mostSimilar, leastSimilar } =
    findMostAndLeastSimilarAccounts(accountsToTokens);

  console.log(
    `--> most similar accounts: ${mostSimilar.accounts}, with ${mostSimilar.size} common NFTs`
  );
  console.log(
    `--> least similar accounts: ${leastSimilar.accounts}, with ${leastSimilar.size} common NFTs`
  );
})();
