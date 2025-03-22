-- Create quizzes table
create table if not exists public.quizzes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  documents jsonb not null,
  questions jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.quizzes enable row level security;

-- Create policies
create policy "Users can create their own quizzes"
  on public.quizzes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can view their own quizzes"
  on public.quizzes for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can update their own quizzes"
  on public.quizzes for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own quizzes"
  on public.quizzes for delete
  to authenticated
  using (auth.uid() = user_id);

-- Create updated_at trigger
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create trigger handle_quizzes_updated_at
  before update on public.quizzes
  for each row
  execute function public.handle_updated_at(); 