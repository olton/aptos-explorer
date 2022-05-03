-- Create routines
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

alter function iif(boolean, text, text) owner to aptos;

-- Create indexes
CREATE INDEX idx_btree_transactions_function ON transactions USING BTREE ((payload->>'function'));
CREATE INDEX idx_btree_transactions_type ON transactions USING BTREE ((payload->>'type'));
create index idx_transactions_success on transactions (success);
create index idx_transactions_type on transactions (type);