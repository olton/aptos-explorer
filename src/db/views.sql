create view v_minting(hash, mint, sender, receiver, function) as
WITH mints AS (SELECT t.hash,
                      (ARRAY(SELECT btrim(jsonb_array_elements.value::text, '"'::text) AS btrim
                             FROM jsonb_array_elements(t.payload -> 'arguments'::text) jsonb_array_elements(value)))[1] AS receiver,
                      (ARRAY(SELECT btrim(jsonb_array_elements.value::text, '"'::text) AS btrim
                             FROM jsonb_array_elements(t.payload -> 'arguments'::text) jsonb_array_elements(value)))[2] AS mint,
                      t.payload ->> 'function'::text                                                                    AS function,
                      ut.sender
               FROM transactions t
                        LEFT JOIN user_transactions ut ON t.hash::text = ut.hash::text
               WHERE t.type::text = 'user_transaction'::text
                 AND (ARRAY(SELECT btrim(jsonb_array_elements.value::text, '"'::text) AS btrim
                            FROM jsonb_array_elements(t.payload -> 'arguments'::text) jsonb_array_elements(value)))[2]::bigint >
                     0
                 AND (t.payload ->> 'function'::text) ~~ '%::mint'::text
                 AND ut.sender::text <> '0xa550c18'::text)
SELECT mints.hash,
       mints.mint,
       mints.sender,
       mints.receiver,
       mints.function
FROM mints;

alter table v_minting
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

