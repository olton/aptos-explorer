import {updateCurrentTime, withCtx, toast} from "./utils.js";
import {connect, request} from "./websocket.js";
import {
    updateGasUsage,
    updateLatestTransactions,
    updateLedger,
    updateOperationsCount,
    updateTransactionsByType
} from "./ui.js";

const wsMessageController = (ws, response) => {
    const {channel, data} = response

    if (!channel) {
        return
    }

    switch(channel) {
        case 'welcome': {
            requestLedger()
            requestGasUsage()
            requestOperationsCount()
            requestTransactionsByType()
            requestLatestTransactions()
            break
        }

        case 'ledger': {
            updateLedger(data)
            setTimeout(requestLedger, 1000)
            break
        }

        case 'gas-usage': {
            updateGasUsage(data)
            setTimeout(requestGasUsage, 1000)
            break
        }

        case 'operations-count': {
            updateOperationsCount(data)
            setTimeout(requestOperationsCount, 1000)
            break
        }

        case 'transactions-by-type': {
            updateTransactionsByType(data)
            setTimeout(requestTransactionsByType, 1000)
            break
        }

        case 'latest-transactions': {
            if (globalThis.autoReloadLastTransactions) updateLatestTransactions(data)
            setTimeout(requestLatestTransactions, 1000)
            break
        }
    }
}

const requestLedger = () => request("ledger")
const requestGasUsage = () => request("gas-usage")
const requestOperationsCount = () => request("operations-count")
const requestTransactionsByType = () => request("transactions-by-type")
const requestLatestTransactions = () => request("latest-transactions")

const autoReloadLastTransactions = true

withCtx(globalThis, {
    toast,
    wsMessageController,
    autoReloadLastTransactions
})

updateCurrentTime()
connect()

;$(()=>{
    $("#reload_last_transactions").on("click", function() {
        globalThis.autoReloadLastTransactions = this.checked
    })
})