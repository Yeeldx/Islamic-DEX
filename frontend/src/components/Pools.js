import React,{useState,useEffect} from 'react';
import { Input, Popover, Radio, Modal, message } from 'antd';
import{
    ArrowDownOutlined,
    DownOutlined,
    SettingOutlined
} from '@ant-design/icons';

import tokenList from "../tokenList.json";
import axios from 'axios';
import { useSendTransaction, useWaitForTransaction } from 'wagmi';

function Pools(props){
    const { address, isConnected} = props;
    const {slippage,setSlippage} = useState(2.5);
    const {tokenOneAmount,setTokenOneAmount} = useState(null);
    const {tokenTwoAmount,setTokenTwoAmount} = useState(null);
    const {prices,setPrices} = useState(null);
    function handleSlippagechange(e){
        setSlippage(e.target.value);
    }
    function changeAmount(e) {
        setTokenOneAmount(e.target.value);
        if(e.target.value && prices){
            setTokenTwoAmount((e.target.value * prices.ration).toFixed(2));
        }else{
            setTokenTwoAmount(null);
        }
    }
    const settings = (
    <>
        <div>Sliggage Tolerance</div>
        <div>
            <Radio.Group value={slippage} onChange = {handleSlippagechange}>
                <Radio.Button value={0.5}>0.5%</Radio.Button>
                <Radio.Button value={2.5}>2.5%</Radio.Button>
                <Radio.Button value={5}>5.0%</Radio.Button>
            </Radio.Group>
        </div>
    </>
    )


    return(
        <>
        <div className="tradeBox">
            <div className="tradeBoxHeader">
                <h4>Pools</h4>
                <Popover content={settings} title="settings" trigger="click" placement="bottomright">
                <SettingOutlined className="cog" />
                </Popover>
            </div>
            <div>
                <Input placeholder="0" value={tokenOneAmount} onChange ={changeAmount} disabled = {!prices} />
                <Input placeholder="0" value={tokenTwoAmount} disabled = {true} />
                
            </div>
            <div>
            <Input value="1 DAI = 0.756 WMATIC      1 WMATIC = 1.32 DAI Your pool shared:0.071862% LP Tokens Received:0 LP Tokens" />

            </div>
            <div className="swapButton">
                Insufficient WMATIC balance
            </div>
            
        </div>
 
        </>
    );
}
export default Pools;