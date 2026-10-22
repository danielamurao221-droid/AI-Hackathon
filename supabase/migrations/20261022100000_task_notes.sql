-- Notes and links on a task (assignment brief, a doc link, the teacher's instructions).
alter table public.tasks add column notes text not null default '' check (char_length(notes) <= 4000);
