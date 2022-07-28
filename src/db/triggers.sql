
CREATE CONSTRAINT TRIGGER trans_count_update_trigger
	AFTER INSERT ON transactions INITIALLY DEFERRED
	FOR EACH ROW EXECUTE PROCEDURE trans_type_count_update_trigger();
CREATE TRIGGER rows_count_reset_trigger
	AFTER TRUNCATE ON transactions
	FOR EACH STATEMENT EXECUTE PROCEDURE trans_type_count_reset_trigger();