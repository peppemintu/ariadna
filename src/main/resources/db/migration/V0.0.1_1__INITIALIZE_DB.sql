create table board (
   id          uuid         primary key,
   title       varchar(255) not null,
   created_at  timestamptz  not null default now(),
   updated_at  timestamptz  not null default now()
);

create table usr (
    id              uuid            primary key,
    email           varchar(100)    not null unique,
    password_hash   text            not null,
    name            varchar(100)    not null,
    role            varchar(20)     not null default 'USER' check (role in ('ADMIN', 'USER'))
);

create table board_user (
    id uuid primary key,
    board_id uuid references board(id),
    user_id uuid references usr(id),
    unique(board_id, user_id)
);

create table board_item (
    id          uuid             primary key,
    board_id    uuid             not null references board(id) on delete cascade,
    title       varchar(255)     not null,
    position    double precision not null,
    item_type   varchar(20)      not null check (item_type in ('COLUMN', 'CARD')),
    version     bigint           not null,
    created_at  timestamptz      not null default now(),
    updated_at  timestamptz      not null default now()
);
create index idx_board_item_board on board_item (board_id);

create table board_column (
    id    uuid       primary key references board_item(id) on delete cascade,
    color varchar(7) not null default '#252525'
);

create table card (
    id          uuid primary key references board_item(id) on delete cascade,
    description text,
    deadline    timestamptz,
    assignee_id uuid references board_user(id) on delete set null,
    column_id   uuid not null   references board_column(id) on delete cascade
);
create index idx_card_column   on card (column_id);
create index idx_card_assignee on card (assignee_id);

create table activity (
    id             uuid         primary key,
    board_id       uuid         not null references board(id) on delete cascade,
    target_item_id uuid         references board_item(id) on delete set null,
    user_id        uuid         references usr(id) on delete set null,
    action_type    varchar(50)  not null,
    payload        jsonb,
    created_at     timestamptz  not null default now()
);
create index idx_activity_board_time on activity (board_id, created_at desc);