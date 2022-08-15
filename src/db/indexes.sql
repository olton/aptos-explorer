-- Create indexes
CREATE INDEX idx_btree_transactions_function ON transactions USING BTREE ((payload->>'function'));
CREATE INDEX idx_btree_transactions_type ON transactions USING BTREE ((payload->>'type'));
create index idx_transactions_success on transactions (success);
create index idx_transactions_type on transactions (type);
create index idx_block_metadata_transactions_timestamp on block_metadata_transactions (timestamp);
create index idx_user_transactions_timestamp on user_transactions (timestamp desc);
create index idx_block_metadata_transactions_epoch on block_metadata_transactions (epoch);
create index idx_block_metadata_transactions_proposer on block_metadata_transactions (proposer);
create index idx_transactions_payload on transactions using gin (payload);

