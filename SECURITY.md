# Security Policy

## 🔒 Política de Segurança do EventCAD+

### Versões Suportadas

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

### 🚨 Reportando Vulnerabilidades

**NÃO** abra issues públicos para vulnerabilidades de segurança.
Envie um email para: security@eventcad.com

### 🛡️ Medidas de Segurança Implementadas

#### 1. Autenticação e Autorização
- [x] JWT com expiração configurável
- [x] Refresh tokens com rotação
- [x] Multi-tenancy com isolamento de dados
- [x] Role-based access control (RBAC)
- [x] Rate limiting por IP/usuário

#### 2. Validação de Dados
- [x] Input validation com Zod
- [x] SQL injection protection (TypeORM)
- [x] XSS protection (helmet)
- [x] CORS configurado adequadamente

#### 3. Configuração de Segurança
- [x] Variáveis de ambiente para credenciais
- [x] Secrets não commitados no git
- [x] HTTPS em produção
- [x] Headers de segurança configurados

#### 4. Monitoramento
- [x] Logs estruturados
- [x] Health checks
- [x] Error tracking
- [x] Audit trails

### 🔧 Configurações de Segurança

#### Backend (.env)
```bash
# JWT
JWT_SECRET=your-super-secret-key-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Database
DB_PASSWORD=strong-password-here
DB_HOST=localhost
DB_PORT=5432

# Redis
REDIS_PASSWORD=redis-password-here

# Rate Limiting
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX_REQUESTS=100

# CORS
ALLOWED_ORIGINS=https://eventcad.com,https://app.eventcad.com
```

#### Frontend (.env)
```bash
# API
VITE_API_URL=https://api.eventcad.com
VITE_API_TIMEOUT=10000

# Security
VITE_ENABLE_DEBUG=false
VITE_ENABLE_ANALYTICS=true
```

### 🚫 Práticas Proibidas

1. **NUNCA** commitar credenciais
2. **NUNCA** usar senhas padrão em produção
3. **NUNCA** expor logs sensíveis
4. **NUNCA** usar HTTP em produção
5. **NUNCA** desabilitar validações

### ✅ Checklist de Segurança

#### Antes do Deploy
- [ ] Todas as credenciais em variáveis de ambiente
- [ ] HTTPS configurado
- [ ] Rate limiting ativo
- [ ] Logs de segurança ativos
- [ ] Backup automático configurado
- [ ] Monitoramento ativo

#### Durante o Deploy
- [ ] Secrets injetados corretamente
- [ ] Health checks passando
- [ ] SSL/TLS configurado
- [ ] Firewall configurado
- [ ] Backup testado

#### Pós Deploy
- [ ] Logs sendo coletados
- [ ] Alertas configurados
- [ ] Monitoramento ativo
- [ ] Backup funcionando
- [ ] Penetration test realizado

### 🔍 Auditoria de Segurança

#### Verificações Automáticas
- [x] Dependências atualizadas (npm audit)
- [x] Código escaneado (SonarQube)
- [x] Container escaneado (Trivy)
- [x] SSL/TLS verificado (SSL Labs)

#### Verificações Manuais
- [ ] Penetration testing
- [ ] Code review de segurança
- [ ] Configuração de rede
- [ ] Backup e recovery test

### 📞 Contato de Segurança

- **Email**: security@eventcad.com
- **PGP Key**: [Link para chave pública]
- **Response Time**: 24-48 horas
- **Bug Bounty**: Disponível para pesquisadores

### 🏆 Programa de Bug Bounty

#### Recompensas
- **Critical**: $500 - $1000
- **High**: $200 - $500
- **Medium**: $50 - $200
- **Low**: $10 - $50

#### Escopo
- eventcad.com
- api.eventcad.com
- app.eventcad.com

#### Exclusões
- Rate limiting
- Logout após inatividade
- Validações de frontend (duplicadas no backend)

---

**Última atualização**: Dezembro 2024
**Próxima revisão**: Janeiro 2025 