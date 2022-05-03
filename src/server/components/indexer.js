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

export const getUserTransactionsAll = async ({limit = 25, offset = 0}) => {
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
        where type = 'user_transaction'
        order by t.inserted_at desc
        limit $1 offset $2    
    `

    return (await query(sql, [limit, offset])).rows
}

export const cacheLatestUserTransactions = async (limit = 50) => {
    cache.lastestUserTransactions = await getUserTransactionsAll({limit})
    setTimeout(cacheLatestUserTransactions, 5000, limit)
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

