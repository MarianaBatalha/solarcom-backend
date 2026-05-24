-- Tabela de usuários
create table if not exists usuarios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cpf text unique not null,
  email text unique not null,
  senha text not null,
  telefone text,
  endereco text,
  distribuidora text,
  codigo_cliente text,
  conta_antes numeric default 200,
  modelo text default 'fixo',
  assinatura numeric default 79,
  ativo boolean default true,
  created_at timestamptz default now()
);

-- Tabela de créditos
create table if not exists creditos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references usuarios(id) on delete cascade,
  credito_valor numeric not null,
  created_at timestamptz default now()
);

-- Tabela de fazendas
create table if not exists fazendas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  localizacao text,
  capacidade_kwp numeric not null,
  max_familias integer default 50,
  status text default 'operacional',
  distribuidora text,
  created_at timestamptz default now()
);

-- Desabilitar RLS nas tabelas (backend usa service_role)
alter table usuarios disable row level security;
alter table creditos disable row level security;
alter table fazendas disable row level security;

-- Inserir fazenda de exemplo se não existir
insert into fazendas (nome, localizacao, capacidade_kwp, max_familias, status, distribuidora)
select 'Fazenda Solar Vila União', 'Zona Sul — São Paulo/SP', 30, 50, 'operacional', 'Enel São Paulo'
where not exists (select 1 from fazendas);
