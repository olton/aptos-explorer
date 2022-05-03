import {WebSocketServer, WebSocket} from "ws";

export const websocket = (server) => {
    globalThis.wss = new WebSocketServer({ server })

    wss.on('connection', (ws, req) => {

        const ip = req.socket.remoteAddress

        ws.send(JSON.stringify({
            channel: "welcome",
            data: `Welcome to Server v${appVersion}`
        }))

        ws.on('message', async (msg) => {
            const {channel, data} = JSON.parse(msg)

            switch (channel) {
                case "ledger": {
                    response(ws, channel, {ledger: cache.ledger})
                    break
                }
                case "gas-usage": {
                    response(ws, channel, {gas: cache.gasUsage})
                    break
                }
                case "operations-count": {
                    response(ws, channel, {operations: cache.operationsCount})
                    break
                }
                case "transactions-by-type": {
                    response(ws, channel, {transactions: cache.transactionsByType})
                    break
                }
                case "latest-user-transactions.pug": {
                    response(ws, channel, {transactions: cache.lastestUserTransactions})
                    break
                }
            }
        })
    })
}

export const response = (ws, channel, data) => {
    ws.send(JSON.stringify({
        channel,
        data
    }))
}

export const broadcast = (data) => {
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data))
        }
    })
}
