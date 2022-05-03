import {
    updateGasUsage,
    updateLatestUserTransactions,
    updateLedger,
    updateOperationsCount,
    updateTransactionsByType
} from "./ui.js";

globalThis.webSocket = null

const isOpen = (ws) => ws && ws.readyState === ws.OPEN

export const connect = () => {
    const {host, port = 80, secure} = config.server
    const ws = new WebSocket(`${secure ? 'wss' : 'ws'}://${host}:${port}`)

    globalThis.webSocket = ws

    ws.onmessage = event => {
        try {
            const content = JSON.parse(event.data)
            if (typeof wsMessageController === 'function') {
                wsMessageController.apply(null, [ws, content])
            }
        } catch (e) {
            console.log(e.message)
            console.log(event.data)
            console.log(e.stack)
        }
    }

    ws.onerror = error => {
        error('Socket encountered error: ', error.message, 'Closing socket');
        ws.close();
    }

    ws.onclose = event => {
        console.log('Socket is closed. Reconnect will be attempted in 1 second.', event.reason);
        setTimeout(connect, 1000)
    }

    ws.onopen = event => {
        console.log('Connected to Aptos Wallet Server');
    }
}

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
            requestLatestUserTransactions()
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

        case 'latest-user-transactions.pug': {
            updateLatestUserTransactions(data)
            setTimeout(requestLatestUserTransactions, 1000)
            break
        }
    }
}

export const request = (channel, data) => {
    if (isOpen(webSocket)) {
        webSocket.send(JSON.stringify({
            channel,
            data
        }))
    }
}

export const requestLedger = () => request("ledger")
export const requestGasUsage = () => request("gas-usage")
export const requestOperationsCount = () => request("operations-count")
export const requestTransactionsByType = () => request("transactions-by-type")
export const requestLatestUserTransactions = () => request("latest-user-transactions.pug")

