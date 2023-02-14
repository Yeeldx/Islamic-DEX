const Web3 = require("web3");
const Moralis = require("moralis").default;
const { EvmChain } = require("@moralisweb3/common-evm-utils");

const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = 3001;

const tokenAbi = require("./abi/erc20.json");
const routerAbi = require("./abi/router.json");
const factoryAbi = require("./abi/factory.json");
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.RPC_URL));

const routerAddress = "0xfc65FE30798c5517d0AC3224d0922B7c5a0BdeAb";
const factoryAddress = "0x5BF10E87fA8496541A615c6D844370E4c6422869";
const wBnbAddress = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";

const routerContract = new web3.eth.Contract(routerAbi, routerAddress);

const chain = EvmChain.BSC_TESTNET;

const maxUint256 =
  115792089237316195423570985008687907853269984665640564039457584007913129639935n;

app.use(cors());
app.use(express.json());

/**
 * API to get the Token pair prices.
 * We use Moralis API to fetch the prices for each token in USD
 * Also calculates the Ratio of the pair.
 */
app.get("/tokenPrice", async (req, res) => {
  const { query } = req;

  const tokenA = query.addressOne;
  const tokenB = query.addressTwo;

  const amountIn = "1000000000000000000"; //web3.utils.toWei(web3.utils.toBN(query.amount?query.amount:0), 'ether');
  const amountOutMin = await getAmountOutMin(amountIn, tokenA, tokenB);

  /*try {
    const responseOne = await Moralis.EvmApi.token.getTokenPrice({
      address: query.addressOne,
      chain: chain,
    });

    const responseTwo = await Moralis.EvmApi.token.getTokenPrice({
      address: query.addressTwo,
      chain: chain,
    });
    usdPrices = {
      tokenOne: responseOne?.raw.usdPrice,
      tokenTwo: responseTwo?.raw.usdPrice,
      ratio: responseOne.raw.usdPrice / responseTwo.raw.usdPrice,
    };
  } catch (error) {
    console.log(error);
  }*/

  const usdPrices = {
    tokenOne: 1,
    tokenTwo: 1,
    ratio: amountOutMin / amountIn,
  };

  return res.status(200).json(usdPrices);
});

/**
 * Get the number of tokens that the Murabah router is allowed to spend
 */
app.get("/approve/allowance", async (req, res) => {
  const { query } = req;

  const contractAddress = query.tokenAddress;
  const tokenContract = new web3.eth.Contract(tokenAbi, contractAddress);

  const allowance = await tokenContract.methods
    .allowance(query.userAddress, routerAddress)
    .call();
  if (allowance) {
    return res.status(200).json({ allowance: allowance });
  } else {
    return res.status(400).json({ error: error.message });
  }
});

/**
 * Generate data for calling the token contract in order to allow the Murabah router for spend funds
 */
app.get("/approve/transaction", async (req, res) => {
  const { query } = req;

  const contractAddress = query.tokenAddress;
  const tokenContract = new web3.eth.Contract(tokenAbi, contractAddress);

  const tx = await tokenContract.methods.approve(routerAddress, maxUint256);
  const encodedABI = await tx.encodeABI();

  if (encodedABI) {
    return res.status(200).json({
      to: query.tokenAddress,
      data: encodedABI,
    });
  } else {
    return res.status(400).json({ error: "encodeABI error" });
  }
});

/**
 * Generate data for calling the Murabah router for swapping
 */
app.get("/swap", async (req, res) => {
  const { query } = req;

  const fromToken = query.fromToken;
  const toToken = query.toToken;
  const toAddress = query.toAddress;

  const amountIn = web3.utils.toWei(query.amountIn, "ether");

  const amountOutMin = await getAmountOutMin(amountIn, fromToken, toToken);
  console.log("amountOutMin: ", amountOutMin);

  const path = [fromToken, toToken];
  const deadline = await calculateDeadline(105400);

  console.log("input params", [
    amountIn,
    amountOutMin,
    path,
    toAddress,
    deadline,
  ]);
  let tx = await routerContract.methods.swapExactTokensForTokens(
    amountIn,
    amountOutMin,
    path,
    toAddress,
    deadline
  );

  const encodedABI = await tx.encodeABI();
  if (encodedABI) {
    return res.status(200).json({
      to: routerAddress,
      data: encodedABI,
    });
  } else {
    return res.status(400).json({ error: "encodeABI error" });
  }
});

async function getAmountOutMin(tokenAmount, fromToken, toToken) {
  const amountOutMin = await routerContract.methods
    .getAmountOut(tokenAmount, fromToken, toToken)
    .call();

  return amountOutMin;
}

async function calculateDeadline(deadline) {
  let block = await web3.eth.getBlock("latest");
  console.log("block latest: ", block.timestamp);
  return block.timestamp + deadline;
}

Moralis.start({
  apiKey: process.env.MORALIS_KEY,
}).then(() => {
  app.listen(port, () => {
    console.log(`Listening for API Calls`);
  });
});
