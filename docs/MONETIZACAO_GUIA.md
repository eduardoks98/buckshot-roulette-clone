# GUIA COMPLETO DE MONETIZACAO - BANG SHOT

## PASSO A PASSO PARA CONFIGURAR O ADSENSE

---

## ETAPA 1: DEPLOY DO SITE (Vercel - GRATIS)

### 1.1 Criar conta na Vercel
1. Acesse: **https://vercel.com**
2. Clique em "Sign Up"
3. Faca login com sua conta **GitHub**

### 1.2 Subir projeto no GitHub (se ainda nao estiver)
```bash
cd E:\buckshot-roulette-clone
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/SEU_USUARIO/bangshot.git
git push -u origin main
```

### 1.3 Importar projeto na Vercel
1. Na Vercel, clique em "Add New Project"
2. Selecione o repositorio do Bang Shot
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `src/client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Adicione variaveis de ambiente (Environment Variables):
   ```
   VITE_API_URL=https://seu-backend.com
   VITE_ADSENSE_ENABLED=false
   ```
5. Clique em "Deploy"

### 1.4 Configurar dominio customizado
1. Compre um dominio em: **https://registro.br** (~R$40/ano)
   - Sugestoes: bangshot.com.br, bangshot.fun, playbangshot.com
2. Na Vercel:
   - Va em "Settings" > "Domains"
   - Adicione seu dominio
   - Configure os DNS conforme instruido

---

## ETAPA 2: DEPLOY DO BACKEND (Railway ou Render)

### Opcao A: Railway (recomendado)
1. Acesse: **https://railway.app**
2. Login com GitHub
3. "New Project" > "Deploy from GitHub repo"
4. Selecione a pasta `src/server`
5. Configure variaveis:
   ```
   DATABASE_URL=mysql://...
   GOOGLE_CLIENT_ID=seu_client_id
   GOOGLE_CLIENT_SECRET=seu_secret
   JWT_SECRET=uma_chave_secreta_longa
   FRONTEND_URL=https://seu-dominio.com
   ```

### Opcao B: Render (gratis)
1. Acesse: **https://render.com**
2. Crie um "Web Service"
3. Conecte ao repositorio
4. Configure Root Directory: `src/server`

---

## ETAPA 3: CADASTRAR NO GOOGLE ADSENSE

### 3.1 Criar conta
1. Acesse: **https://adsense.google.com**
2. Clique em "Comecar"
3. Faca login com sua conta Google
4. Informe:
   - **URL do site**: https://seu-dominio.com
   - **Pais**: Brasil
   - **Aceite os termos**

### 3.2 Verificar propriedade do site
O Google vai fornecer um codigo como:
```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>
```

**Adicione em `src/client/index.html`:**
```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Bang Shot</title>

    <!-- GOOGLE ADSENSE - Adicione esta linha -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### 3.3 Aguardar aprovacao
- **Tempo**: 1 dia a 2 semanas
- O Google vai verificar:
  - Conteudo original (OK - jogo proprio)
  - Politica de Privacidade (OK - criada)
  - Termos de Uso (OK - criados)
  - Trafego minimo (divulgue o jogo!)

---

## ETAPA 4: APOS APROVACAO - CRIAR AD UNITS

### 4.1 No painel do AdSense
1. Va em "Anuncios" > "Por unidade de anuncio" > "Criar novo anuncio"
2. Crie estas unidades:

| Nome | Tipo | Formato |
|------|------|---------|
| `bangshot-lobby` | Display | Responsivo |
| `bangshot-gameover` | Display | Responsivo |
| `bangshot-leaderboard` | Display | Retangulo (300x250) |

3. Para cada unidade, copie o **Slot ID** (numero de ~10 digitos)

### 4.2 Configurar no projeto

**Atualize o `.env` do cliente:**
```env
VITE_ADSENSE_PUBLISHER_ID=ca-pub-XXXXXXXXXXXXXXXX
VITE_ADSENSE_ENABLED=true
VITE_AD_SLOT_LOBBY=1234567890
VITE_AD_SLOT_GAMEOVER=0987654321
VITE_AD_SLOT_LEADERBOARD=1122334455
```

### 4.3 Usar o componente AdBanner
O componente ja existe em `src/client/src/components/common/AdBanner/AdBanner.tsx`

**Exemplo de uso no Lobby:**
```tsx
import AdBanner from '../../components/common/AdBanner/AdBanner';

// No componente:
<AdBanner
  slotId={import.meta.env.VITE_AD_SLOT_LOBBY}
  format="responsive"
/>
```

---

## ETAPA 5: CONFIGURAR PAGAMENTO

### 5.1 No AdSense
1. Va em "Pagamentos" > "Informacoes de pagamento"
2. Adicione:
   - **Nome completo** (igual ao documento)
   - **CPF**
   - **Endereco**

### 5.2 Metodo de pagamento
1. Escolha: **PIX** ou Transferencia bancaria
2. Para PIX: Adicione sua chave
3. Para transferencia: Informe agencia e conta

### 5.3 Limites
- **Limite minimo**: $100 USD (~R$500)
- **Pagamento**: Dia 21 de cada mes
- **Moeda**: USD convertido para BRL

---

## CHECKLIST FINAL

### Antes de submeter ao AdSense:
- [ ] Site hospedado com dominio proprio (HTTPS)
- [ ] Pagina /privacy funcionando
- [ ] Pagina /terms funcionando
- [ ] Jogo funcionando corretamente
- [ ] Pelo menos alguns usuarios jogando

### Apos aprovacao:
- [ ] Criar ad units no painel
- [ ] Configurar VITE_ADSENSE_PUBLISHER_ID
- [ ] Configurar VITE_ADSENSE_ENABLED=true
- [ ] Adicionar AdBanner nas paginas
- [ ] Testar se anuncios aparecem
- [ ] Configurar pagamento

---

## DICAS PARA APROVACAO RAPIDA

1. **Tenha trafego**: Convide amigos para jogar antes de submeter
2. **Conteudo unico**: Seu jogo e original, isso e bom!
3. **Sem conteudo proibido**: O jogo tem violencia simulada leve, OK para AdSense
4. **SSL obrigatorio**: Vercel ja fornece HTTPS gratis
5. **Mobile-friendly**: O jogo ja e responsivo

---

## ALTERNATIVA: PROPELLERADS (Aprovacao rapida)

Se AdSense demorar muito ou recusar:

1. Acesse: **https://propellerads.com**
2. Cadastre-se como "Publisher"
3. Adicione seu site
4. Aprovacao em 24-48 horas
5. Paga via PayPal, Payoneer ou Pix

---

## ESTIMATIVA DE GANHOS

| Jogadores/mes | Impressoes | Ganho estimado |
|---------------|------------|----------------|
| 1.000 | ~5.000 | $5-10/mes |
| 5.000 | ~25.000 | $25-50/mes |
| 10.000 | ~50.000 | $50-100/mes |
| 50.000 | ~250.000 | $250-500/mes |

*Valores aproximados, dependem de CPM e CPC*

---

## LINKS UTEIS

- AdSense: https://adsense.google.com
- Vercel: https://vercel.com
- Railway: https://railway.app
- Registro.br: https://registro.br
- PropellerAds: https://propellerads.com
- Google Analytics: https://analytics.google.com

---

**Boa sorte com a monetizacao do Bang Shot!**
