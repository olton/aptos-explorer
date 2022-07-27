-- Create indexes
CREATE INDEX idx_btree_transactions_function ON transactions USING BTREE ((payload->>'function'));
CREATE INDEX idx_btree_transactions_type ON transactions USING BTREE ((payload->>'type'));
create index idx_transactions_success on transactions (success);
create index idx_transactions_type on transactions (type);
create index idx_block_metadata_transactions_timestamp on block_metadata_transactions (timestamp);