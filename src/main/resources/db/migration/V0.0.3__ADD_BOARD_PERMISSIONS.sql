alter table board add column owner_id uuid references usr(id);
update board b set owner_id = (
    select bu.user_id from board_user bu where bu.board_id = b.id order by bu.id limit 1
) where owner_id is null;
alter table board alter column owner_id set not null;

create table board_user_permission (
    board_user_id uuid        not null references board_user(id) on delete cascade,
    permission    varchar(50) not null,
    primary key (board_user_id, permission)
);

create table board_invitation (
    id               uuid        primary key,
    board_id         uuid        not null references board(id) on delete cascade,
    invited_email    varchar(100) not null,
    invited_by_id    uuid        not null references usr(id),
    status           varchar(20) not null check (status in ('PENDING', 'ACCEPTED', 'DECLINED')),
    created_at       timestamptz not null default now(),
    responded_at     timestamptz
);
create index idx_board_invitation_email_status on board_invitation (invited_email, status);
create unique index uq_board_invitation_pending on board_invitation (board_id, invited_email) where status = 'PENDING';
