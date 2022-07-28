
CREATE CONSTRAINT TRIGGER trans_count_update_trigger
	AFTER INSERT ON transactions INITIALLY DEFERRED
	FOR EACH ROW EXECUTE PROCEDURE trans_type_count_update_trigger();
CREATE TRIGGER rows_count_reset_trigger
	AFTER TRUNCATE ON transactions
	FOR EACH STATEMENT EXECUTE PROCEDURE trans_type_count_reset_trigger();

-- auto-generated definition
create constraint trigger trans_status_count_update_trigger
    after insert
    on transactions
    deferrable initially deferred
    for each row
execute procedure trans_status_count_update_trigger();

-- auto-generated definition
create trigger rows_status_count_reset_trigger
    after truncate
    on transactions
execute procedure trans_status_count_reset_trigger();

