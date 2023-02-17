import React, { useState, useEffect } from "react";
import { Input, Popover, Radio, Modal, message } from "antd";
import {
  ArrowDownOutlined,
  DownOutlined,
  PlusOutlined,
  SettingOutlined,
} from "@ant-design/icons";

import tokenList from "../tokenList.json";
import axios from "axios";
import { useSendTransaction, useWaitForTransaction } from "wagmi";
import env from "react-dotenv";

const BASE_URL = env.BASE_URL;

function Pools(props) {
  const { address, isConnected } = props;
  const [slippage, setSlippage] = useState(2.5);
  const [tokenOneAmount, setTokenOneAmount] = useState(null);
  const [tokenTwoAmount, setTokenTwoAmount] = useState(null);
  const [tokenOne, setTokenOne] = useState(tokenList[0]);
  const [tokenTwo, setTokenTwo] = useState(tokenList[1]);
  const [isOpen, setIsOpen] = useState(false);
  const [changeToken, setChangeToken] = useState();
  const [prices, setPrices] = useState(null);

  console.log("Pools tokenOne: ", tokenOne);

  function handleSlippageChange(e) {
    setSlippage(e.target.value);
  }
  function changeAmount(e) {
    setTokenOneAmount(e.target.value);
    if (e.target.value && prices) {
      setTokenTwoAmount((e.target.value * prices.ration).toFixed(2));
    } else {
      setTokenTwoAmount(null);
    }
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
      fetchPrices(tokenOne[i].address, tokenTwo.address);
    } else {
      setTokenTwo(tokenList[i]);
      fetchPrices(tokenOne.address, tokenList[i].address);
    }
    setIsOpen(false);
  }
  async function fetchPrices(one, two) {
    const res = await axios.get(`${BASE_URL}/tokenPrice`, {
      params: { addressOne: one, addressTwo: two },
    });
  }

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
        title="select a token"
      >
        <div className="modelContent">
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
          <h4>Pools</h4>
          <Popover
            content={settings}
            title="settings"
            trigger="click"
            placement="bottomright"
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
          <div className="plusSign">
            <PlusOutlined />
          </div>
          <div className="assetOne" onClick={() => openModal(1)}>
            <img src={tokenOne.img} alt="assetOneLogo" className="assetLogo" />
            {tokenOne.ticker}
            <DownOutlined></DownOutlined>
          </div>
          <div className="assetTwo" onClick={() => openModal(2)}>
            <img src={tokenTwo.img} alt="assetTwologo" className="assetLogo" />
            {tokenTwo.ticker}
            <DownOutlined></DownOutlined>
          </div>
        </div>

        <div className="inputs"></div>

        <div className="poolsDetails">
          "1 DAI = 0.756 WMATIC 1 WMATIC = 1.32 DAI Your pool shared:0.071862%
          LP Tokens Received:0 LP Tokens"
        </div>
        <div className="swapButton">Insufficient WMATIC balance</div>
      </div>
    </>
  );
}
export default Pools;
