-- Script para criar tenant e usuários iniciais do EventCAD+

-- Criar tenant padrão
INSERT INTO tenants (
  "tenantId",
  name,
  subdomain,
  "contactEmail",
  "contactPhone",
  country,
  currency,
  timezone,
  "defaultLanguage",
  "primaryColor",
  "secondaryColor",
  plan,
  "maxEvents",
  "maxUsers",
  "storageLimit",
  "storageUsed",
  "requireMfa",
  "passwordExpirationDays",
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES (
  'eventcad-default',
  'EventCAD+ Default',
  'eventcad',
  'admin@eventcad.com',
  '+55 11 99999-9999',
  'BR',
  'BRL',
  'America/Sao_Paulo',
  'pt-BR',
  '#1976d2',
  '#dc004e',
  'premium',
  1000,
  500,
  10737418240,
  0,
  false,
  90,
  true,
  NOW(),
  NOW()
) ON CONFLICT ("tenantId") DO NOTHING;

-- Obter o ID do tenant criado
DO $$
DECLARE
  tenant_id UUID;
BEGIN
  SELECT id INTO tenant_id FROM tenants WHERE "tenantId" = 'eventcad-default';
  
  -- Usuário Admin
  INSERT INTO users (
    "tenantId",
    "fullName", 
    email, 
    password, 
    role, 
    "isActive", 
    "emailVerified", 
    company, 
    position, 
    phone, 
    "preferredLanguage", 
    timezone, 
    settings,
    "createdAt",
    "updatedAt"
  ) VALUES (
    tenant_id,
    'Administrador EventCAD+',
    'admin@eventcad.com',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: EventCAD@2025
    'admin',
    true,
    true,
    'EventCAD+',
    'Administrador',
    '+55 11 99999-9999',
    'pt-BR',
    'America/Sao_Paulo',
    '{"theme": "light", "notifications": {"email": true, "push": true, "sms": false}}',
    NOW(),
    NOW()
  ) ON CONFLICT (email) DO NOTHING;

  -- Usuário Demo
  INSERT INTO users (
    "tenantId",
    "fullName", 
    email, 
    password, 
    role, 
    "isActive", 
    "emailVerified", 
    company, 
    position, 
    phone, 
    "preferredLanguage", 
    timezone, 
    settings,
    "createdAt",
    "updatedAt"
  ) VALUES (
    tenant_id,
    'Usuário Demo',
    'demo@eventcad.com',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: demo123
    'project_manager',
    true,
    true,
    'Empresa Demo',
    'Gerente de Eventos',
    '+55 11 88888-8888',
    'pt-BR',
    'America/Sao_Paulo',
    '{"theme": "light", "notifications": {"email": true, "push": true, "sms": false}}',
    NOW(),
    NOW()
  ) ON CONFLICT (email) DO NOTHING;

END $$;

-- Verificar se foram criados
SELECT t.name as tenant, u."fullName", u.email, u.role, u."isActive" 
FROM users u 
JOIN tenants t ON u."tenantId"::text = t.id::text 
WHERE u.email IN ('admin@eventcad.com', 'demo@eventcad.com'); 