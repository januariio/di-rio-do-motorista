-- Execute este SQL no Supabase SQL Editor para criar a tabela de perfis

create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  nome text not null,
  email text not null,
  whatsapp text default '',
  modelo_caminhao text not null default 'Scania R450',
  media_km_litro numeric not null default 2.5,
  tipo_combustivel text not null default 'Diesel S10',
  created_at timestamp with time zone default now()
);

alter table profiles enable row level security;

create policy "Usuários podem ver próprio perfil"
  on profiles for select
  using (auth.uid() = id);

create policy "Usuários podem atualizar próprio perfil"
  on profiles for update
  using (auth.uid() = id);

create policy "Usuários podem inserir próprio perfil"
  on profiles for insert
  with check (auth.uid() = id);
