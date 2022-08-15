-- Tables
create table transaction_type_count
(
    id      integer           not null
        constraint pk_transaction_type_count
            primary key,
    type    varchar(100)      not null,
    counter integer default 0 not null
);

create table transaction_status_count
(
    id      integer          not null
        constraint pk_transaction_status_count
            primary key,
    type    varchar(50)      not null,
    counter bigint default 0 not null
);

-- alter table transaction_status_count owner to indexer;
-- alter table transaction_type_count owner to indexer;

-- Indexes
CREATE INDEX idx_btree_transactions_function ON transactions USING BTREE ((payload->>'function'));
CREATE INDEX idx_btree_transactions_type ON transactions USING BTREE ((payload->>'type'));
create index idx_transactions_success on transactions (success);
create index idx_transactions_type on transactions (type);
create index idx_block_metadata_transactions_timestamp on block_metadata_transactions (timestamp);
create index idx_user_transactions_timestamp on user_transactions (timestamp desc);
create index idx_block_metadata_transactions_epoch on block_metadata_transactions (epoch);
create unique index ui_transaction_type_count_id on transaction_type_count (id);
create unique index ui_transaction_type_count_type on transaction_type_count (type);
create unique index ui_transaction_status_count_id on transaction_status_count (id);
create unique index ui_transaction_status_count_type on transaction_status_count (type);
create index idx_transactions_payload on transactions using gin (payload);



-- Routines
CREATE OR REPLACE FUNCTION counter_reset_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
	tableTypes text;
	tableStatuses text;
BEGIN
	tableTypes := 'transaction_type_count';
	tableStatuses := 'transaction_status_count';

	EXECUTE 'update ' || tableTypes || ' set counter = 0';
	EXECUTE 'update ' || tableStatuses || ' set counter = 0';
END
$$;

CREATE OR REPLACE FUNCTION counter_update_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
	tableTypes text;
	tableStatuses text;
BEGIN
	tableTypes := 'transaction_type_count';
	tableStatuses := 'transaction_status_count';

	IF TG_OP = 'INSERT' THEN
	    EXECUTE 'update ' || tableTypes || ' set counter = counter + 1 where type = $1'
        USING NEW.type;

        if (NEW.success = true) then
            EXECUTE 'update ' || tableStatuses || ' set counter = counter + 1 where type = $1'
            USING 'success';
        elseif (NEW.success = false) then
            EXECUTE 'update ' || tableStatuses || ' set counter = counter + 1 where type = $1'
            USING 'failed';
        else
            EXECUTE 'update ' || tableStatuses || ' set counter = counter + 1 where type = $1'
            USING 'unknown';
        end if;

		RETURN NEW;
	END IF;
END
$$;

create function iif(condition boolean, true_result text, false_result text) returns text
    language plpgsql
as
$$
BEGIN
     IF condition THEN
        RETURN true_result;
ELSE
        RETURN false_result;
END IF;
END
$$;

-- alter function iif(boolean, text, text) owner to indexer;
-- alter function counter_reset_trigger() owner to indexer;
-- alter function counter_update_trigger() owner to indexer;

-- Triggers
CREATE CONSTRAINT TRIGGER counter_update_trigger
	AFTER INSERT ON transactions INITIALLY DEFERRED
	FOR EACH ROW EXECUTE PROCEDURE counter_update_trigger();

CREATE TRIGGER counter_reset_trigger
	AFTER TRUNCATE ON transactions
	FOR EACH STATEMENT EXECUTE PROCEDURE counter_reset_trigger();

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

-- alter table v_minting owner to indexer;

create index idx_block_metadata_transactions_proposer
    on block_metadata_transactions (proposer);

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

-- alter table v_transactions owner to indexer;

insert into transaction_status_count (id, type, counter) values(1, 'success', 0);
insert into transaction_status_count (id, type, counter) values(2, 'failed', 0);

insert into transaction_type_count (id, type, counter) values(1, 'genesis_transaction', 0);
insert into transaction_type_count (id, type, counter) values(2, 'block_metadata_transaction', 0);
insert into transaction_type_count (id, type, counter) values(3, 'state_checkpoint_transaction', 0);
insert into transaction_type_count (id, type, counter) values(4, 'user_transaction', 0);
