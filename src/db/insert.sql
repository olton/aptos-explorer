insert into transaction_status_count (id, type, counter) values(1, 'success', 0);
insert into transaction_status_count (id, type, counter) values(2, 'failed', 0);

insert into transaction_type_count (id, type, counter) values(1, 'genesis_transaction', 0);
insert into transaction_type_count (id, type, counter) values(2, 'block_metadata_transaction', 0);
insert into transaction_type_count (id, type, counter) values(3, 'state_checkpoint_transaction', 0);
insert into transaction_type_count (id, type, counter) values(4, 'user_transaction', 0);