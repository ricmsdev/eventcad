-- Verificar status dos usuários
SELECT 
  email, 
  "isActive", 
  "loginAttempts", 
  "lockedUntil", 
  "emailVerified",
  "lastLoginAt"
FROM users; 