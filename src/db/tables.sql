create table transaction_type_count
(
    id      integer           not null
        constraint pk_transaction_type_count
            primary key,
    type    varchar(100)      not null,
    counter integer default 0 not null
);

alter table transaction_type_count
    owner to indexer;

create unique index ui_transaction_type_count_type
    on transaction_type_count (type);


create table transaction_status_count
(
    id      integer          not null
        constraint pk_transaction_status_count
            primary key,
    type    varchar(50)      not null,
    counter bigint default 0 not null
);

alter table transaction_status_count
    owner to indexer;

create unique index transaction_status_count_id_uindex
    on transaction_status_count (id);

create unique index ui_transaction_status_count_type
    on transaction_status_count (type);

