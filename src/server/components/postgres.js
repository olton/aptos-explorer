import pg from 'pg'
import {debug, error, info} from "../helpers/logging.js"
import {datetime} from "@olton/datetime"

const { Pool } = pg

const createPool = () => {
    const {host: _host, user, database, password} = config.indexer
    const [host, port] = _host.split(":")

    const pool = new Pool({
        user,
        host,
        database,
        password,
        port,
    })

    pool.on('error', (err, client) => {
        error(`Unexpected error on idle client ${err.message}`, err)
        process.exit(-1)
    })

    return pool
}

export const createDBConnection = () => {
    globalThis.postgres = createPool()

    const pool = globalThis.postgres

    pool.query('select now()', (err, res) => {
        if (err) {
            throw err
        }
        info(`DB clients pool created at ${datetime(+(res.rows[0].now)).format(config['date-format']['log'])}`)
    })
}

export const listenNotifies = async () => {
    const client = await globalThis.postgres.connect()

    client.query('LISTEN new_deal', (err, res) => {
        if (err) {
            throw err
        }
        info(`Start listening for DB events`)
    })
    client.on('notification', async (data) => {
        info(`${data.channel} notification:`, data.payload)
        if (data.channel === 'new_deal') {
            globalThis.everyone[data.channel] = JSON.parse(data.payload)
        }
    })
}

export const query = async (q, p) => {
    const client = await globalThis.postgres.connect()
    let result = null

    try {
        const start = Date.now()
        const res = await client.query(q, p)
        const duration = Date.now() - start
        if (config.debug.pg_query) {
            debug('Executed query', { q, p, duration: duration + 'ms', rows: res.rowCount })
        }
        result = res
    } catch (e) {
        info(e.message, config.debug.pg_query ? e : null)
    } finally {
        client.release()
    }

    return result
}

export const batch = async (a = []) => {
    if (!a.length) return
    const client = await globalThis.postgres.connect()
    let result
    try {
        const start = Date.now()
        client.query("BEGIN")
        for (let q of a) {
            const [sql, par] = q
            await client.query(sql, par)
        }
        client.query("COMMIT")
        const duration = Date.now() - start
        if (config.debug.pg_query) {
            debug('Executed batch', { duration: duration + 'ms' })
        }
        result = true
    } catch (e) {
        result = false
        client.query("ROLLBACK")
        error(e.message, config.debug.pg_query ? e : null)
    } finally {
        client.release()
    }
    return result
}

export const getClient = async () => {
    return await globalThis.postgres.connect()
}