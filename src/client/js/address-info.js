import {updateCurrentTime, withCtx, toast} from "./utils.js";
import {connect, request} from "./websocket.js";
import {updateAddress, updateLedger, updateTransactionsByType} from "./ui.js";

const wsMessageController = (ws, response) => {
    const {channel, data} = response

    if (!channel) {
        return
    }

    switch(channel) {
        case 'welcome': {
            requestLedger()
            requestUserTransactions()
            break
        }

        case 'ledger': {
            updateLedger(data)
            setTimeout(requestLedger, 1000)
            break
        }

        case 'user-transactions': {
            updateTransactionsByType(data)
            setTimeout(requestUserTransactions, 1000)
            break
        }
    }
}

const requestLedger = () => request("ledger")
const requestUserTransactions = () => request("user-transactions", {address})

withCtx(globalThis, {
    toast,
    wsMessageController
})

updateCurrentTime()
connect()

console.log(address)

updateAddress(address)