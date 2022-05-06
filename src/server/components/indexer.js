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

export const searchTransaction = async (val) => {
    let result, _value = ""+val

    if (!_value.startsWith("0x") && !isNaN(+val)) {
        result = (await query(`select hash from transactions where version = $1 limit 1`, [val])).rows
    } else {
        result = (await query(`select hash from transactions where hash = $1 limit 1`, [val])).rows
    }

    return result.length ? result[0].hash : null
}

export const searchAccount = async (val) => {
    const res1 = (await query(`select 1 from block_metadata_transactions where proposer = $1 limit 1`, [val])).rows
    const res2 = (await query(`select 1 from user_transactions where sender = $1 limit 1`, [val])).rows

    return res1.length || res2.length ? val : null
}

export const getTransaction = async (hash) => {
    const tr_data = (await query(`select * from transactions t where t.hash = $1`, [hash])).rows
    const tr_user = (await query(`select * from user_transactions where hash = $1`, [hash])).rows
    const tr_meta = (await query(`select * from block_metadata_transactions where hash = $1`, [hash])).rows
    const tr_events = (await query(`select * from events where transaction_hash = $1`, [hash])).rows
    const tr_changes = (await query(`select * from write_set_changes where transaction_hash = $1`, [hash])).rows
    return {
        tran: tr_data.length ? tr_data[0] : null,
        user: tr_user.length ? tr_user[0] : null,
        meta: tr_meta.length ? tr_meta[0] : null,
        events: tr_events.length ? tr_events : null,
        changes: tr_changes.length ? tr_changes : null
    }
}

export const getUserTransactions = async (sender, {limit = 25, offset = 0} = {}) => {
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
        order by ut.timestamp desc
        limit $2 offset $3    
    `

    return (await query(sql, [sender, limit, offset])).rows
}

export const getMetaTransactions = async (proposer, {limit = 25, offset = 0} = {}) => {
    const sql = `
        select
            t.version,
            t.type,
            t.hash,
            t.gas_used,
            t.success,
            t.vm_status,
            m.id,
            m.round,
            m.previous_block_votes,
            m.proposer,
            m.timestamp at time zone 'utc' as timestamp
        from transactions t
        left join block_metadata_transactions m on t.hash = m.hash
        where type = 'block_metadata_transaction' and proposer = $1
        order by m.timestamp desc
        limit $2 offset $3    
    `

    return (await query(sql, [proposer, limit, offset])).rows
}

export const gaugeTransactionsPerMinute = async (limit = 60) => {
    const sql = `
        with trans as (select
                    t.version,
                    coalesce(ut.timestamp, m.timestamp) at time zone 'utc' as timestamp
                from transactions t
                    left join user_transactions ut on t.hash = ut.hash
                    left join block_metadata_transactions m on t.hash = m.hash
                where version > 0
                order by t.version desc)
        select
            date_trunc('minute', tr.timestamp) as minute,
            count(tr.version)
        from trans tr
        group by 1
        order by 1 desc
        limit $1
    `

    return (await query(sql, [limit])).rows
}

export const TRANSACTION_TYPE_USER = 'user_transaction'
export const TRANSACTION_TYPE_META = 'block_metadata_transaction'

export const gaugeTransactionsPerMinuteByType = async (type = TRANSACTION_TYPE_USER, limit = 60) => {
    const sql = `
        with trans as (select
                    t.version,
                    coalesce(ut.timestamp, m.timestamp) at time zone 'utc' as timestamp
                from transactions t
                    left join user_transactions ut on t.hash = ut.hash
                    left join block_metadata_transactions m on t.hash = m.hash
                where version > 0
                and t.type = $1 
                order by t.version desc)
        select
            date_trunc('minute', tr.timestamp) as minute,
            count(tr.version)
        from trans tr
        group by 1
        order by 1 desc
        limit $2
    `

    return (await query(sql, [type, limit])).rows
}

export const cacheGaugeTransactionsPerMinuteAll = async (limit = 61) => {
    cache.gaugeTransPerMinuteAll = await gaugeTransactionsPerMinute(limit)
    setTimeout(cacheGaugeTransactionsPerMinuteAll, 60000, limit)
}
export const cacheGaugeTransactionsPerMinuteUser = async (limit = 61) => {
    cache.gaugeTransPerMinuteUser = await gaugeTransactionsPerMinuteByType(TRANSACTION_TYPE_USER, limit)
    setTimeout(cacheGaugeTransactionsPerMinuteUser, 60000, limit)
}
export const cacheGaugeTransactionsPerMinuteMeta = async (limit = 61) => {
    cache.gaugeTransPerMinuteMeta = await gaugeTransactionsPerMinuteByType(TRANSACTION_TYPE_META, limit)
    setTimeout(cacheGaugeTransactionsPerMinuteMeta, 60000, limit)
}

export const getReceivedEvents = async (address, {limit = 25, offset = 0} = {}) => {
    const sql = `
    select 
        ut.sender,
        t.hash,
        e.key,
        e.sequence_number,
        e.type,
        e.data->>'amount' as amount,
        iif(e.type = '0x1::TestCoin::ReceivedEvent', e.data->>'from', e.data->>'to') as target,
        e.inserted_at,
        t.version,
        t.gas_used,
        ut.gas_unit_price,
        t.success,
        t.vm_status,
        ut.expiration_timestamp_secs,
        ut.timestamp
    from events e
    left join transactions t on e.transaction_hash = t.hash
    left join user_transactions ut on t.hash = ut.hash
    where e.data->>'to' = $1
    order by e.inserted_at desc
    limit $2 offset $3
    `

    return (await query(sql, [address, limit, offset])).rows
}

export const getSentEvents = async (address, {limit = 25, offset = 0} = {}) => {
    const sql = `
    select 
        ut.sender,
        t.hash,
        e.key,
        e.sequence_number,
        e.type,
        e.data->>'amount' as amount,
        iif(e.type = '0x1::TestCoin::ReceivedEvent', e.data->>'from', e.data->>'to') as target,
        e.inserted_at,
        t.version,
        t.gas_used,
        ut.gas_unit_price,
        t.success,
        t.vm_status,
        ut.expiration_timestamp_secs,
        ut.timestamp
    from events e
    left join transactions t on e.transaction_hash = t.hash
    left join user_transactions ut on t.hash = ut.hash
    where ut.sender = $1 and e.type = '0x1::TestCoin::SentEvent'
    order by e.inserted_at desc
    limit $2 offset $3
    `

    return (await query(sql, [address, limit, offset])).rows
}

export const getUserEvents = async (address, {limit = 25, offset = 0} = {}) => {
    const sql = `select * from events where data::text like $1 limit $2 offset $3`
    return (await query(sql, [`%${address}%`, limit, offset])).rows
}
