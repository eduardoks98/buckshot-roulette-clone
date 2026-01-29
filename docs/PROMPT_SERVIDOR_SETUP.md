# PROMPT PARA EXECUTAR NO SERVIDOR

Copie e cole este prompt em uma nova conversa com Claude no servidor:

---

## PROMPT:

```
Preciso configurar o servidor Linux com Apache para hospedar múltiplos projetos no domínio mysys.shop.

## CONTEXTO

Temos 3 projetos principais:
1. **games-admin** - Painel administrativo Laravel para gerenciar jogos
2. **bangshot** - Jogo multiplayer (Node.js backend + React frontend)
3. **larakit** - Monorepo com pacotes Laravel reutilizáveis

## ESTRUTURA DE SUBDOMÍNIOS DESEJADA

```
mysys.shop                    → Landing Page (Portal de jogos estilo Friv)
admin.mysys.shop              → Games Admin Panel (Laravel)
bangshot.mysys.shop           → Jogo BangShot (Node.js + React)
sponsors.mysys.shop           → Portal de Sponsors (futuro)
```

## O QUE PRECISO QUE VOCÊ FAÇA

### FASE 1: Diagnóstico do Servidor
Primeiro, execute estes comandos para entender o que já temos instalado:

```bash
# Sistema operacional
cat /etc/os-release

# Apache
apache2 -v
ls /etc/apache2/sites-available/
ls /etc/apache2/sites-enabled/
apache2ctl -M | grep -E "(rewrite|proxy|ssl)"

# PHP
php -v
php -m | grep -E "(pdo|mysql|mbstring|xml|curl|zip)"

# Node.js
node -v
npm -v
pm2 -v 2>/dev/null || echo "PM2 não instalado"

# MySQL/MariaDB
mysql --version

# Composer
composer --version

# Estrutura atual
ls -la /var/www/
df -h
```

### FASE 2: Configurar Apache Virtual Hosts

Preciso de Virtual Hosts para cada subdomínio:

1. **admin.mysys.shop** → Laravel (DocumentRoot: /var/www/mysys/games-admin/public)
2. **bangshot.mysys.shop** → Node.js com proxy (React estático + API proxy para porta 3000)
3. **mysys.shop** → Landing page (pode ser Laravel ou estático)

### FASE 3: Configurar SSL com Let's Encrypt

Usar Certbot para gerar certificados para todos os subdomínios.

### FASE 4: Deploy dos Projetos

Os repositórios estão em:
- games-admin: vai ser clonado/enviado para /var/www/mysys/games-admin
- bangshot: vai ser clonado/enviado para /var/www/mysys/bangshot

### FASE 5: PM2 para Node.js

Configurar PM2 para manter o servidor Node.js do BangShot rodando.

---

## IMPORTANTE

- Servidor usa **Apache** (não Nginx)
- Não usar serviços pagos (sem Redis externo, sem S3 pago)
- Cache com Laravel File/Database Cache
- Storage local para arquivos

---

Por favor, comece executando os comandos de diagnóstico da FASE 1 para vermos o estado atual do servidor.
```

---

## APÓS O DIAGNÓSTICO

Depois que o Claude executar o diagnóstico, ele vai saber:
- Versão do Linux/Apache/PHP/Node
- O que já está instalado
- Estrutura atual de diretórios
- Módulos Apache disponíveis

Com isso ele pode criar os Virtual Hosts corretos e configurar tudo.

---

## CHECKLIST DE VERIFICAÇÃO

Após a configuração, testar:

- [ ] `curl -I https://admin.mysys.shop` → deve retornar 200
- [ ] `curl -I https://bangshot.mysys.shop` → deve retornar 200
- [ ] `curl -I https://mysys.shop` → deve retornar 200
- [ ] WebSocket do BangShot funcionando
- [ ] SSL válido em todos os subdomínios
- [ ] PM2 rodando o servidor Node.js
- [ ] Laravel migrations executadas
- [ ] Banco de dados criado
