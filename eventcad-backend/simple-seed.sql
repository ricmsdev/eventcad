-- Script simples para criar tenant e usuários

-- Inserir tenant
INSERT INTO tenants (id, "tenantId", name, subdomain, "contactEmail", "contactPhone", country, currency, timezone, "defaultLanguage", "primaryColor", "secondaryColor", plan, "maxEvents", "maxUsers", "storageLimit", "storageUsed", "requireMfa", "passwordExpirationDays", "isActive", "createdAt", "updatedAt") 
VALUES (
  gen_random_uuid(),
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
);

-- Inserir usuário admin
INSERT INTO users (id, "tenantId", "fullName", email, password, role, "isActive", "emailVerified", company, position, phone, "preferredLanguage", timezone, settings, "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  t.id,
  'Administrador EventCAD+',
  'admin@eventcad.com',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
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
FROM tenants t WHERE t."tenantId" = 'eventcad-default';

-- Inserir usuário demo
INSERT INTO users (id, "tenantId", "fullName", email, password, role, "isActive", "emailVerified", company, position, phone, "preferredLanguage", timezone, settings, "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  t.id,
  'Usuário Demo',
  'demo@eventcad.com',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
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
FROM tenants t WHERE t."tenantId" = 'eventcad-default';

-- Verificar resultado
SELECT 'Tenants:' as info;
SELECT id, "tenantId", name FROM tenants;

SELECT 'Users:' as info;
SELECT "fullName", email, role, "isActive" FROM users; 