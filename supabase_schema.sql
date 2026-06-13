-- ============================================
-- مخطط قاعدة البيانات لمنصة "إنجاز" التعليمية
-- نفّذ هذا الكود كاملاً في Supabase: SQL Editor > New query
-- ============================================

-- جدول الطلاب
create table students (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password text not null,
  name text not null,
  avatar text default '🕌',
  total_points integer not null default 0,
  streak integer not null default 0,
  last_active_date date,
  created_at timestamptz not null default now()
);

-- جدول المهام (عامة لجميع الطلاب)
create table tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  points integer not null default 0,
  due_date date not null,
  image_url text,
  created_at timestamptz not null default now()
);

-- جدول حالة كل طالب من كل مهمة
create table submissions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  task_id uuid not null references tasks(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','done')),
  submission_image text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (student_id, task_id)
);

-- جدول النقاط الإضافية (يدوية من المعلم)
create table bonus_points (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  points integer not null,
  note text,
  created_at timestamptz not null default now()
);

-- سجل تاريخي للنقاط (لرسم بياني لتطور الطالب)
create table points_history (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  points integer not null,
  total_after integer not null,
  date date not null default current_date,
  created_at timestamptz not null default now()
);

-- ============================================
-- دالة: عند إنشاء مهمة جديدة، أنشئ صفًا "pending" لكل طالب تلقائياً
-- ============================================
create or replace function create_submissions_for_new_task()
returns trigger as $$
begin
  insert into submissions (student_id, task_id, status)
  select id, NEW.id, 'pending' from students;
  return NEW;
end;
$$ language plpgsql;

create trigger trg_new_task
after insert on tasks
for each row execute function create_submissions_for_new_task();

-- ============================================
-- دالة: عند إضافة طالب جديد، أنشئ صفًا "pending" لكل المهام الموجودة
-- ============================================
create or replace function create_submissions_for_new_student()
returns trigger as $$
begin
  insert into submissions (student_id, task_id, status)
  select NEW.id, id, 'pending' from tasks;
  return NEW;
end;
$$ language plpgsql;

create trigger trg_new_student
after insert on students
for each row execute function create_submissions_for_new_student();

-- ============================================
-- تفعيل RLS (Row Level Security) مع سياسات مفتوحة
-- (التطبيق بسيط ولا يعتمد على Supabase Auth، لذا نسمح بالوصول
--  عبر المفتاح العام anon، مع التحقق من كلمات المرور في كود التطبيق)
-- ============================================
alter table students enable row level security;
alter table tasks enable row level security;
alter table submissions enable row level security;
alter table bonus_points enable row level security;
alter table points_history enable row level security;

create policy "allow all students" on students for all using (true) with check (true);
create policy "allow all tasks" on tasks for all using (true) with check (true);
create policy "allow all submissions" on submissions for all using (true) with check (true);
create policy "allow all bonus_points" on bonus_points for all using (true) with check (true);
create policy "allow all points_history" on points_history for all using (true) with check (true);

-- ============================================
-- (اختياري) بيانات تجريبية - يمكنك حذف هذا الجزء
-- ============================================
-- insert into students (username, password, name, avatar) values
-- ('ahmad', '1234', 'أحمد', '🕌'),
-- ('sara', '1234', 'سارة', '🌙');

-- ============================================
-- ملاحظة بخصوص تخزين الصور:
-- في Supabase Dashboard > Storage > أنشئ Bucket باسم "uploads" واجعله Public
-- (يُستخدم لصور المهام وصور تسليم الطلاب)
-- ============================================
