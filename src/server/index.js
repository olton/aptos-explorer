import path from "path"
import { fileURLToPath } from 'url'
import fs from "fs";
import {info, error} from "./helpers/logging.js"
import {runWebServer} from "./components/webserver.js";
import {broadcast} from "./components/websocket.js";
import {createDBConnection} from "./components/postgres.js";
import {cacheLedger, initAptos} from "./components/aptos.js";
import {
    cacheGasUsage,
    cacheGaugeTransactionsPerMinuteAll, cacheGaugeTransactionsPerMinuteMeta,
    cacheGaugeTransactionsPerMinuteUser,
    cacheLatestTransactions,
    cacheOperationsCount,
    cacheTransactionsByType
} from "./components/indexer.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const readJson = (path) => JSON.parse(fs.readFileSync(path, 'utf-8'))

globalThis.rootPath = path.dirname(path.dirname(__dirname))
globalThis.serverPath = __dirname
globalThis.clientPath = rootPath + "/src/client"
globalThis.srcPath = rootPath + "/src"
globalThis.pkg = readJson(""+path.resolve(rootPath, "package.json"))
globalThis.config = readJson(""+path.resolve(serverPath, "config.json"))
globalThis.appVersion = pkg.version
globalThis.appName = `Aptos Explorer v${pkg.version}`

const runProcesses = () => {
    setImmediate( cacheLedger )
    setImmediate( cacheGasUsage )
    setImmediate( cacheOperationsCount )
    setImmediate( cacheTransactionsByType )
    setImmediate( cacheLatestTransactions )
    setImmediate( cacheGaugeTransactionsPerMinuteAll )
    setImmediate( cacheGaugeTransactionsPerMinuteUser )
    setImmediate( cacheGaugeTransactionsPerMinuteMeta )
}

export const run = (configPath) => {
    info("Starting Server...")

    try {

        globalThis.ssl = config.server.ssl && (config.server.ssl.cert && config.server.ssl.key)
        globalThis.cache = new Proxy({
        }, {
            set(target, p, value, receiver) {
                target[p] = value
                return true
            }
        })

        globalThis.everyone = new Proxy({
        }, {
            set(target, p, value, receiver) {
                target[p] = value

                broadcast({
                    channel: p,
                    data: value
                })

                return true
            }
        })

        initAptos()
        createDBConnection()
        runProcesses()
        runWebServer()

        info("Welcome to Server!")
    } catch (e) {
        error(e)
        error(e.stack)
        process.exit(1)
    }
}

run()