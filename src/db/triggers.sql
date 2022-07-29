
CREATE CONSTRAINT TRIGGER counter_update_trigger
	AFTER INSERT ON transactions INITIALLY DEFERRED
	FOR EACH ROW EXECUTE PROCEDURE counter_update_trigger();

CREATE TRIGGER counter_reset_trigger
	AFTER TRUNCATE ON transactions
	FOR EACH STATEMENT EXECUTE PROCEDURE counter_reset_trigger();


