create view minting(hash, mint, function, sender) as
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

