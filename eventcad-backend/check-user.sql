-- Verificar usuário admin
SELECT 
  id, 
  email, 
  password, 
  "isActive", 
  "emailVerified",
  role,
  "fullName"
FROM users 
WHERE email = 'admin@eventcad.com'; 