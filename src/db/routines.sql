CREATE OR REPLACE FUNCTION trans_type_count_reset_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
	tablename text;
BEGIN
	tablename := 'transaction_type_count';

	EXECUTE 'update ' || tablename || ' set counter = 0';
END
$$;

CREATE OR REPLACE FUNCTION trans_type_count_update_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
	tablename text;
BEGIN
	tablename := 'transaction_type_count';

	IF TG_OP = 'INSERT' THEN
	    EXECUTE 'update ' || tablename || ' set counter = counter + 1 where type = $1'
        USING NEW.type;

		RETURN NEW;
	END IF;
END
$$;

create function trans_type_count_reset_trigger() returns trigger
    language plpgsql
as
$$
DECLARE
	tablename text;
BEGIN
	tablename := 'transaction_type_count';

	EXECUTE 'update ' || tablename || ' set counter = 0';
END
$$;

alter function trans_type_count_reset_trigger() owner to indexer;

create function trans_type_count_update_trigger() returns trigger
    language plpgsql
as
$$
DECLARE
	tablename text;
BEGIN
	tablename := 'transaction_type_count';

	IF TG_OP = 'INSERT' THEN
	    EXECUTE 'update ' || tablename || ' set counter = counter + 1 where type = $1'
        USING NEW.type;

		RETURN NEW;
	END IF;
END
$$;

alter function trans_type_count_update_trigger() owner to indexer;

