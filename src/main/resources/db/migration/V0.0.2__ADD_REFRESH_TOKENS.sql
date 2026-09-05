create table refresh_token (
    id          uuid        primary key,
    user_id     uuid        not null references usr(id) on delete cascade,
    token_hash  varchar(64) not null unique,
    expires_at  timestamptz not null,
    revoked_at  timestamptz,
    created_at  timestamptz not null default now()
);
create index idx_refresh_token_user on refresh_token (user_id);
create index idx_refresh_token_expires_at on refresh_token (expires_at);
