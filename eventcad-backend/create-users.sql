-- Script para criar usuários iniciais do EventCAD+
-- Execute este script no PostgreSQL

-- Usuário Admin
INSERT INTO users (
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

-- Verificar se foram criados
SELECT "fullName", email, role, "isActive" FROM users WHERE email IN ('admin@eventcad.com', 'demo@eventcad.com'); 