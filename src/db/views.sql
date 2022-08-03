create view v_minting(hash, mint, function, sender) as
WITH mints AS (SELECT t.hash,
                      ARRAY(SELECT btrim(jsonb_array_elements.value::text, '"'::text) AS btrim
                            FROM jsonb_array_elements(t.payload -> 'arguments'::text) jsonb_array_elements(value)) AS args,
                      t.payload ->> 'function'::text                                                               AS function,
        ut.sender
        FROM transactions t
        LEFT JOIN user_transactions ut ON t.hash::text = ut.hash::text
        WHERE t.type::text = 'user_transaction'::text
        AND (t.payload ->> 'function'::text) ~~ '%aptos_coin::mint%'::text)
SELECT mints.hash,
       mints.args[2]::bigint AS mint,
        mints.function,
       mints.sender
FROM mints;

alter table minting
    owner to indexer;

create view v_transactions
            (type, version, hash, state_root_hash, event_root_hash, success, vm_status, accumulator_root_hash, sender,
             timestamp, round, id, previous_block_votes, epoch, previous_block_votes_bitmap, failed_proposer_indices,
             signature, sequence_number, expiration_timestamp_secs, gas_used, max_gas_amount, gas_unit_price,
             inserted_at)
as
SELECT t.type,
       t.version,
       t.hash,
       t.state_root_hash,
       t.event_root_hash,
       t.success,
       t.vm_status,
       t.accumulator_root_hash,
       COALESCE(bmt.proposer, ut.sender)                        AS sender,
       COALESCE(bmt."timestamp", ut."timestamp", t.inserted_at) AS "timestamp",
       bmt.round,
       bmt.id,
       bmt.previous_block_votes,
       bmt.epoch,
       bmt.previous_block_votes_bitmap,
       bmt.failed_proposer_indices,
       ut.signature,
       ut.sequence_number,
       ut.expiration_timestamp_secs,
       t.gas_used,
       ut.max_gas_amount,
       ut.gas_unit_price,
       t.inserted_at
FROM transactions t
         LEFT JOIN block_metadata_transactions bmt ON t.hash::text = bmt.hash::text
         LEFT JOIN user_transactions ut ON t.hash::text = ut.hash::text;

alter table v_transactions
    owner to indexer;

