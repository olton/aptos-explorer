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

alter function iif(boolean, text, text) owner to indexer;
alter function counter_reset_trigger() owner to indexer;
alter function counter_update_trigger() owner to indexer;

