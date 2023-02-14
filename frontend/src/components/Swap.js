import React, { useState, useEffect } from "react";
import { Input, Popover, Radio, Modal, message } from "antd";
import {
  ArrowDownOutlined,
  DownOutlined,
  SettingOutlined,
} from "@ant-design/icons";

import tokenList from "../tokenList.json";
import axios from "axios";
import { useSendTransaction, useWaitForTransaction } from "wagmi";

function Swap(props) {
  const { address, isConnected } = props;
  const [slippage, setSlippage] = useState(2.5);
  const [tokenOneAmount, setTokenOneAmount] = useState(null);
  const [tokenTwoAmount, setTokenTwoAmount] = useState(null);
  const [tokenOne, setTokenOne] = useState(tokenList[0]);
  const [tokenTwo, setTokenTwo] = useState(tokenList[1]);
  const [isOpen, setIsOpen] = useState(false);
  const [requireApproval, setRequireApproval] = useState(false);
  const [changeToken, setChangeToken] = useState();
  const [prices, setPrices] = useState(null);
  const [txDetails, setTxDetails] = useState({
    to: null,
    data: null,
    value: 0,
  });

  const { data, sendTransaction } = useSendTransaction({
    request: {
      from: address,
      to: String(txDetails.to),
      data: String(txDetails.data),
      value: txDetails.value,
    },
  });

  function handleSlippageChange(e) {
    setSlippage(e.target.value);
  }

  async function changeAmount(e) {
    const inputAmount = e.target.value;
    setTokenOneAmount(inputAmount);

    const res = await axios.get(`http://localhost:3001/approve/allowance`, {
      params: { userAddress: address, tokenAddress: tokenOne.address },
    });

    if (res.status === 200) {
      console.log("allowance: ", res.data.allowance);
      console.log("input amount: ", inputAmount * 10 ** 18);
      if (inputAmount * 10 ** 18 > res.data.allowance) {
        setRequireApproval(true);
      } else {
        setRequireApproval(false);
      }
    }

    if (e.target.value && prices) {
      setTokenTwoAmount((e.target.value * prices.ratio).toFixed(10));
    } else {
      setTokenTwoAmount(null);
    }
  }

  function switchTokens() {
    setPrices(null);
    setTokenOneAmount(null);
    setTokenTwoAmount(null);

    const one = tokenOne;
    const two = tokenTwo;

    setTokenOne(two);
    setTokenTwo(one);
    fetchPrices(two.address, one.address);
  }

  function openModal(asset) {
    setChangeToken(asset);
    setIsOpen(true);
  }

  function modifyToken(i) {
    setPrices(null);
    setTokenOneAmount(null);
    setTokenTwoAmount(null);

    if (changeToken === 1) {
      setTokenOne(tokenList[i]);
      fetchPrices(tokenList[i].address, tokenTwo.address);
    } else {
      setTokenTwo(tokenList[i]);
      fetchPrices(tokenOne.address, tokenList[i].address);
    }
    setIsOpen(false);
  }

  async function fetchPrices(one, two) {
    const res = await axios.get(`http://localhost:3001/tokenPrice`, {
      params: { addressOne: one, addressTwo: two },
    });

    if (res.data.ratio === 0) {
      setPrices(null);
    } else {
      setPrices(res.data);
    }
  }

  async function fetchDexSwap() {
    const res = await axios.get(`http://localhost:3001/swap`, {
      params: {
        fromToken: tokenOne.address,
        toToken: tokenTwo.address,
        toAddress: address,
        amountIn: tokenOneAmount,
      },
    });

    if (res.status === 200) {
      console.log("encodeABI: ", res.data);
      setTxDetails(res.data);
    }
  }

  async function approveToken() {
    const res = await axios.get(`http://localhost:3001/approve/transaction`, {
      params: { tokenAddress: tokenOne.address },
    });

    if (res.status === 200) {
      setTxDetails(res.data);
    }
  }

  useEffect(() => {
    fetchPrices(tokenList[0].address, tokenList[1].address);
  }, []);

  useEffect(() => {
    if (txDetails.to && isConnected) {
      sendTransaction();
    }
  }, [txDetails]);

  const settings = (
    <>
      <div>Slippage Tolerance</div>
      <div>
        <Radio.Group value={slippage} onChange={handleSlippageChange}>
          <Radio.Button value={0.5}>0.5%</Radio.Button>
          <Radio.Button value={2.5}>2.5%</Radio.Button>
          <Radio.Button value={5}>5.0%</Radio.Button>
        </Radio.Group>
      </div>
    </>
  );

  return (
    <>
      <Modal
        open={isOpen}
        footer={null}
        onCancel={() => setIsOpen(false)}
        title="Select a token"
      >
        <div className="modalContent">
          {tokenList?.map((e, i) => {
            return (
              <div
                className="tokenChoice"
                key={i}
                onClick={() => modifyToken(i)}
              >
                <img src={e.img} alt={e.ticker} className="tokenLogo" />
                <div className="tokenChoiceNames">
                  <div className="tokenName">{e.name}</div>
                  <div className="tokenTicker">{e.ticker}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Modal>
      <div className="tradeBox">
        <div className="tradeBoxHeader">
          <h4>Swap</h4>
          <Popover
            content={settings}
            title="Settings"
            trigger="click"
            placement="bottomRight"
          >
            <SettingOutlined className="cog" />
          </Popover>
        </div>
        <div className="inputs">
          <Input
            placeholder="0"
            value={tokenOneAmount}
            onChange={changeAmount}
            disabled={!prices}
          />
          <Input placeholder="0" value={tokenTwoAmount} disabled={true} />
          <div className="switchButton" onClick={switchTokens}>
            <ArrowDownOutlined className="switchArrow" />
          </div>
          <div className="assetOne" onClick={() => openModal(1)}>
            <img src={tokenOne.img} alt="assetOneLogo" className="assetLogo" />
            {tokenOne.ticker}
            <DownOutlined />
          </div>
          <div className="assetTwo" onClick={() => openModal(2)}>
            <img src={tokenTwo.img} alt="assetTwoLogo" className="assetLogo" />
            {tokenTwo.ticker}
            <DownOutlined />
          </div>
        </div>
        {requireApproval ? (
          <div
            className="swapButton"
            style={{ backgroundColor: "#64dd17", color: "white" }}
            onClick={approveToken}
          >
            Approve
          </div>
        ) : (
          <div
            className="swapButton"
            onClick={fetchDexSwap}
            disabled={!tokenOneAmount || !isConnected}
          >
            Swap
          </div>
        )}
      </div>
    </>
  );
}

export default Swap;
