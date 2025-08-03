-- Desbloquear usuários e resetar tentativas de login
UPDATE users 
SET 
  "loginAttempts" = 0,
  "lockedUntil" = NULL
WHERE email IN ('admin@eventcad.com', 'demo@eventcad.com');

-- Verificar resultado
SELECT 
  email, 
  "isActive", 
  "loginAttempts", 
  "lockedUntil", 
  "emailVerified"
FROM users; 