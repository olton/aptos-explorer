import {updateCurrentTime, withCtx, toast} from "./utils.js";
import {connect, request} from "./websocket.js";
import {
    updateLedger, updateTransaction,
    updateTransactionsByType
} from "./ui.js";
import {submitSearchForm} from "./search.js";

const wsMessageController = (ws, response) => {
    const {channel, data} = response

    if (!channel) {
        return
    }

    switch(channel) {
        case 'welcome': {
            requestLedger()
            requestTransactionsByType()
            break
        }

        case 'ledger': {
            updateLedger(data)
            setTimeout(requestLedger, 1000)
            break
        }

        case 'transactions-by-type': {
            updateTransactionsByType(data)
            setTimeout(requestTransactionsByType, 1000)
            break
        }
    }
}

const requestLedger = () => request("ledger")
const requestTransactionsByType = () => request("transactions-by-type")

withCtx(globalThis, {
    toast,
    wsMessageController,
    submitSearchForm
})

updateCurrentTime()
connect()

updateTransaction(transaction)