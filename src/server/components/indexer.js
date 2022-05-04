import {query} from "./postgres.js";

export const getGasUsage = async () => {
    const sql = `
        select
            payload->'function' as func,
            floor(avg(gas_used)) as gas_avg,
            max(gas_used) as gas_max,
            min(gas_used) as gas_min
        from transactions
        where gas_used > 0
        --and success = true
        and substring(payload->>'function', 1, 5) = '0x1::'
        group by payload->'function'
    `

    return (await query(sql)).rows
}

export const cacheGasUsage = async () => {
    cache.gasUsage = await getGasUsage()
    setTimeout(cacheGasUsage, 1000)
}

export const getOperationsCount = async () => {
    const sql = `
        select
            payload->'function' as func,
            count(hash) as operations_count
        from transactions
        where substring(payload->>'function', 1, 5) = '0x1::'
        group by payload->'function'
    `

    return (await query(sql)).rows
}

export const cacheOperationsCount = async () => {
    cache.operationsCount = await getOperationsCount()
    setTimeout(cacheOperationsCount, 1000)
}

export const getTransactionsByType = async () => {
    const sql = `
        select type as type, count(*) as count
        from transactions
        where type != 'genesis_transaction'
        group by type

        union

        select iif(success, 'success_transactions', 'failed_transactions') as type, count(*) as count
        from transactions
        where type != 'genesis_transaction'
        group by success
    `

    return (await query(sql)).rows
}

export const cacheTransactionsByType = async () => {
    cache.transactionsByType = await getTransactionsByType()
    setTimeout(cacheTransactionsByType, 1000)
}

export const getTransactions = async ({limit = 25, offset = 0}) => {
    const sql = `
        select
            t.version,
            t.type,
            t.payload->>'type' as payload_type,
            t.payload->>'function' as payload_func,
            t.payload->>'arguments' as payload_args,
            t.hash,
            t.gas_used,
            t.success,
            t.vm_status,
            coalesce(ut.sender, m.proposer) as sender,
            coalesce(ut.sequence_number, 0) as sequence_number,
            coalesce(ut.gas_unit_price, 0) as gas_unit_price,
            coalesce(ut.timestamp, m.timestamp) at time zone 'utc' as timestamp
        from transactions t
            left join user_transactions ut on t.hash = ut.hash
            left join block_metadata_transactions m on t.hash = m.hash
        where version > 0
        order by t.version desc
        limit $1 offset $2    
    `

    return (await query(sql, [limit, offset])).rows
}

export const cacheLatestTransactions = async (limit = 50) => {
    cache.lastestTransactions = await getTransactions({limit})
    setTimeout(cacheLatestTransactions, 5000, limit)
}

export const getTransaction = async (hash) => {
    const tr_data = (await query(`select * from transactions t where t.hash = $1`, [hash])).rows
    const tr_user = (await query(`select * from user_transactions where hash = $1`, [hash])).rows
    const tr_meta = (await query(`select * from block_metadata_transactions where hash = $1`, [hash])).rows
    return {
        tran: tr_data.length ? tr_data[0] : null,
        user: tr_user.length ? tr_user[0] : null,
        meta: tr_meta.length ? tr_meta[0] : null
    }
}

export const getUserTransactions = async (sender, {limit = 25, offset = 0}) => {
    const sql = `
        select
            t.version,
            t.type,
            t.payload->>'type' as payload_type,
            t.payload->>'function' as payload_func,
            t.payload->>'arguments' as payload_args,
            t.hash,
            t.gas_used,
            t.success,
            t.vm_status,
            t.inserted_at at time zone 'utc' as inserted_at,
            ut.sender,
            ut.sequence_number,
            ut.gas_unit_price,
            ut.expiration_timestamp_secs as expiration,
            ut.timestamp at time zone 'utc' as timestamp,
            ut.inserted_at at time zone 'utc' as inserted_ut
        from transactions t
        left join user_transactions ut on t.hash = ut.hash
        where type = 'user_transaction' and sender = $1
        order by t.inserted_at desc
        limit $2 offset $3    
    `

    return (await query(sql, [sender, limit, offset])).rows
}

