-- Drop existing objects if they exist
drop table if exists public.users cascade;
drop table if exists public.questions cascade;
drop table if exists public.user_answers cascade;
drop function if exists public.handle_updated_at cascade;

-- Create updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create users table
create table public.users (
  id uuid default gen_random_uuid() primary key,
  email varchar(255) unique not null,
  full_name varchar(255),
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create questions table
create table public.questions (
  id uuid default gen_random_uuid() primary key,
  text text not null,
  options jsonb not null, -- Array of answer options
  correct_answer text not null,
  explanation text not null,
  difficulty varchar(20) not null check (difficulty in ('easy', 'medium', 'hard')),
  topic varchar(50) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create user_answers table to track user responses and progress
create table public.user_answers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  question_id uuid references public.questions(id) on delete cascade not null,
  selected_answer text not null,
  is_correct boolean not null,
  time_taken integer, -- Time taken in seconds
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  -- Add unique constraint to prevent duplicate answers
  unique(user_id, question_id)
);

-- Enable Row Level Security
alter table public.users enable row level security;
alter table public.questions enable row level security;
alter table public.user_answers enable row level security;

-- Create policies for users table
drop policy if exists "Enable insert for users during signup" on public.users;
create policy "Enable insert for users during signup"
  on public.users for insert
  with check (true);  -- Allow all inserts, since we control the user ID from the application

create policy "Users can view their own profile" 
  on public.users for select 
  using (auth.uid() = id);

create policy "Users can update their own profile" 
  on public.users for update 
  using (auth.uid() = id);

-- Create policies for questions table
create policy "Questions are readable by all authenticated users"
  on public.questions for select
  using (auth.role() = 'authenticated');

-- Create policies for user_answers table
create policy "Users can view their own answers"
  on public.user_answers for select
  using (auth.uid() = user_id);

create policy "Users can insert their own answers"
  on public.user_answers for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own answers"
  on public.user_answers for update
  using (auth.uid() = user_id);

-- Add triggers for updated_at
create trigger handle_users_updated_at
  before update on public.users
  for each row
  execute function public.handle_updated_at();

create trigger handle_questions_updated_at
  before update on public.questions
  for each row
  execute function public.handle_updated_at();

create trigger handle_user_answers_updated_at
  before update on public.user_answers
  for each row
  execute function public.handle_updated_at();

-- Add helpful comments
comment on table public.users is 'Stores user profile information';
comment on column public.users.id is 'Unique identifier for the user';
comment on column public.users.email is 'User''s email address (unique)';
comment on column public.users.full_name is 'User''s full name';
comment on column public.users.avatar_url is 'URL to the user''s avatar image';
comment on column public.users.created_at is 'Timestamp when the user was created';
comment on column public.users.updated_at is 'Timestamp when the user was last updated';

comment on table public.questions is 'Stores SAT math practice questions';
comment on column public.questions.id is 'Unique identifier for the question';
comment on column public.questions.text is 'The question text';
comment on column public.questions.options is 'Array of possible answers';
comment on column public.questions.correct_answer is 'The correct answer';
comment on column public.questions.explanation is 'Detailed explanation of the solution';
comment on column public.questions.difficulty is 'Question difficulty level (easy, medium, hard)';
comment on column public.questions.topic is 'Math topic category';

comment on table public.user_answers is 'Tracks user responses to questions';
comment on column public.user_answers.id is 'Unique identifier for the answer attempt';
comment on column public.user_answers.user_id is 'Reference to the user who answered';
comment on column public.user_answers.question_id is 'Reference to the question answered';
comment on column public.user_answers.selected_answer is 'The answer selected by the user';
comment on column public.user_answers.is_correct is 'Whether the answer was correct';
comment on column public.user_answers.time_taken is 'Time taken to answer in seconds'; 