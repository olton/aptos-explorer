import http from "http";
import https from "https";
import fs from "fs";
import path from "path";
import express from "express";
import session from "express-session"
import {websocket} from "./websocket.js"
import {info} from "../helpers/logging.js";
import favicon from "serve-favicon"
import {
    getMetaTransactions, getReceivedEvents,
    getSentEvents,
    getTransaction, getUserEvents,
    getUserTransactions,
    searchAccount,
    searchTransaction
} from "./indexer.js";
import assert from "assert";

const app = express()

const route = () => {
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))
    app.use(session({
        resave: false,
        saveUninitialized: false,
        secret: 'Russian warship - Fuck You!',
        cookie: {
            maxAge: 24 * 3600000,
            secure: 'auto'
        }
    }))


    app.use(express.static(path.join(srcPath, 'client')))

    app.use('/css', express.static(path.join(clientPath, 'css')))
    app.use('/js', express.static(path.join(clientPath, 'js')))
    app.use('/vendor', express.static(path.join(clientPath, 'vendor')))
    app.use('/images', express.static(path.join(clientPath, 'images')))


    if (fs.existsSync(path.resolve(clientPath, 'favicon.ico')))
        app.use(favicon(path.join(srcPath, 'client', 'favicon.ico')))

    app.locals.pretty = true
    app.set('views', path.resolve(srcPath, 'client'))
    app.set('view engine', 'pug')

    const clientConfig = JSON.stringify({
        "server": {
            "host": config.server.host,
            "port": config.client.secure ? 443 : 80,
            "secure": !!config.client.secure
        },
        "theme": config.client.theme
    })
    const dateFormat = JSON.stringify(config['date-format'])

    app.get('/', async (req, res) => {
        res.render('index', {
            title: appName,
            appVersion,
            clientConfig,
            dateFormat,
        })
    })

    app.get('/transaction/:hash', async (req, res) => {
        res.render('transaction-info', {
            title: appName,
            appVersion,
            clientConfig,
            dateFormat,
            transaction: JSON.stringify(await getTransaction(req.params.hash))
        })
    })

    app.get('/account/:hash', async (req, res) => {
        const address = req.params.hash
        res.render('account-info', {
            title: appName,
            appVersion,
            clientConfig,
            dateFormat,
            address: JSON.stringify(address),
            account: JSON.stringify(await aptos.getAccount(address)),
            resources: JSON.stringify(await aptos.getAccountResources(address)),
            modules: JSON.stringify(await aptos.getAccountModules(address)),
            trans: JSON.stringify(await getUserTransactions(address)),
            meta: JSON.stringify(await getMetaTransactions(address)),
            events: JSON.stringify(await getUserEvents(address))
        })
    })

    app.post('/search', async (req, res) => {
        const val = req.body.search
        let result, target, value

        if (!result) {
            result = await searchTransaction(val)
            target = 'transaction'
        }
        if (!result) {
            result = await searchAccount(val)
            target = 'account'
        }
        if (!result) {
            try {
                const acc = await aptos.getAccount(val)
                target = 'account'
                assert(acc.authentication_key)
                result = val
            } catch (e) {

            }
        }

        if (!result) {
            res.send({
                ok: false
            })
        } else {
            res.send({
                ok: true,
                target,
                value: result
            })
        }
    })
}

export const runWebServer = () => {
    let httpWebserver, httpsWebserver

    if (ssl) {
        const {cert, key} = config.server.ssl
        httpWebserver = http.createServer((req, res)=>{
            res.writeHead(301,{Location: `https://${req.headers.host}:${config.server.ssl.port || config.server.port}${req.url}`});
            res.end();
        })

        httpsWebserver = https.createServer({
            key: fs.readFileSync(key[0] === "." ? path.resolve(rootPath, key) : key),
            cert: fs.readFileSync(cert[0] === "." ? path.resolve(rootPath, cert) : cert)
        }, app)
    } else {
        httpWebserver = http.createServer({}, app)
    }

    route()

    const runInfo = `Aptos Explorer Server running on ${ssl ? "HTTPS" : "HTTP"} on port ${ssl ? config.server.ssl.port : config.server.port}`

    httpWebserver.listen(config.server.port, () => {
        info(runInfo)
    })

    if (ssl) {
        httpsWebserver.listen(config.server.ssl.port || config.server.port, () => {
            info(runInfo)
        })
    }

    websocket(ssl ? httpsWebserver : httpWebserver)
}
