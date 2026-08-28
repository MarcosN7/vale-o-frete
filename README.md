# 🚚 Vale o Frete?

> Calculadora para motoristas de aplicativo decidirem em segundos se uma corrida ou rota vale a pena — considerando o custo real de combustível.

Feito para **Mercado Livre Envios Flex** e **Lalamove**, funciona 100% no navegador do celular, sem cadastro e sem backend.

---

## 📱 Demonstração

| Calculadora | Resultado | Configurações |
|---|---|---|
| Preencha valor, distância e paradas | Veredito instantâneo 🟢🟡🔴 | Configure seu veículo uma vez |

---

## ✨ Funcionalidades

### 🧮 Duas calculadoras
- **Mercado Livre Envios Flex** — valor da rota, quantidade de paradas, distância total → lucro por parada e por km
- **Lalamove** — valor da corrida, distância, pedágio/custos extras → lucro líquido

### 🟢🟡🔴 Veredito visual rápido
Resultado em destaque com cor de fundo para decisão em segundos:
- 🟢 **Verde** — Vale a pena!
- 🟡 **Amarelo** — No limite
- 🔴 **Vermelho** — Não vale a pena

As faixas de R$/km são configuráveis pelo próprio motorista.

### ⛽ Preço de combustível por estado
- Botão **"Preencher pelos preços médios do meu estado"** usa o GPS do celular + OpenStreetMap para detectar o estado automaticamente
- Preços médios estaduais embutidos no app (fonte: ANP — Agência Nacional do Petróleo)
- Seletor manual com todos os 27 estados caso o GPS não esteja disponível
- Alerta automático se os preços não forem atualizados há mais de 7 dias

### 🚗 Suporte a veículo flex
- Configure consumo e preço para **gasolina e etanol**
- O app calcula os dois e indica qual combustível é mais barato para aquela rota

### 🗺️ Distância real de rota
- **Modo manual** — informe os km diretamente
- **Modo por endereços** — informe os pontos da rota e o app calcula a distância real de dirigir usando [OSRM](http://project-osrm.org/) + [Nominatim (OpenStreetMap)](https://nominatim.org/), sem necessidade de chave de API

### 📋 Histórico do dia
- Cada corrida salva manualmente (você decide o que entra)
- Totais acumulados: km rodado, lucro total, número de corridas
- Exportar histórico como `.csv` para planilha
- Dados persistidos no `localStorage` (filtrados por dia automaticamente)

### 📤 Compartilhar resultado
- Botão no card do veredito envia o resumo via WhatsApp, Telegram ou qualquer app (Web Share API)
- Em desktop, copia para a área de transferência

### 📱 PWA — Instalável no celular
- Funciona como app nativo: adicione à tela inicial pelo navegador
- Funciona offline após o primeiro acesso

---

## 🛠️ Tecnologias

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + Vite 8 |
| Estilo | CSS puro, mobile-first |
| Persistência | `localStorage` (sem backend) |
| Geolocalização | Browser Geolocation API (nativa) |
| Geocodificação de estado | [Nominatim / OpenStreetMap](https://nominatim.openstreetmap.org/) |
| Cálculo de rota | [OSRM](http://router.project-osrm.org/) |
| Preços de combustível | Tabela ANP por estado (embutida) |
| PWA | `manifest.json` + Service Worker |

> Todas as APIs externas são **gratuitas e sem chave de API**.

---

## 🚀 Como rodar localmente

```bash
# Clone o repositório
git clone https://github.com/MarcosN7/vale-o-frete.git
cd vale-o-frete

# Instale as dependências
npm install

# Rode em desenvolvimento
npm run dev
# Acesse http://localhost:5173
```

```bash
# Build de produção
npm run build
npm run preview
```

---

## ⚙️ Configuração do veículo

No primeiro acesso, configure:

- **Tipo de veículo** — Carro, Moto ou Van
- **Consumo** — km/l na gasolina (e no etanol, se for flex)
- **Preço do combustível** — detectado automaticamente pelo estado ou manual
- **Faixas do veredito** — R$/km mínimo para cada cor (padrão: < R$0,50 🔴 | < R$1,00 🟡 | acima 🟢)

As configurações ficam salvas no dispositivo entre sessões.

---

## 📁 Estrutura do projeto

```
vale-o-frete/
├── public/
│   ├── favicon.svg
│   ├── manifest.json        # PWA manifest
│   └── sw.js                # Service Worker
├── src/
│   ├── services/
│   │   ├── fuelPrices.js    # Tabela ANP + detecção por GPS
│   │   └── osrm.js          # Geocodificação + cálculo de rota
│   ├── components/
│   │   ├── SettingsModal.jsx  # Configurações do veículo
│   │   ├── FuelBanner.jsx     # Resumo rápido de configuração
│   │   ├── DistanceInput.jsx  # Input manual ou por endereços
│   │   ├── ResultDisplay.jsx  # Veredito + breakdown de custos
│   │   ├── ModoML.jsx         # Calculadora Mercado Livre Flex
│   │   ├── ModoLalamove.jsx   # Calculadora Lalamove
│   │   └── History.jsx        # Histórico + exportar CSV
│   ├── App.jsx
│   ├── utils.js              # Cálculos, thresholds, localStorage
│   └── index.css
├── index.html
├── vite.config.js
└── package.json
```

---

## 🌐 Deploy gratuito

Conecte o repositório ao [Vercel](https://vercel.com) ou [Netlify](https://netlify.com) para publicar online com HTTPS — necessário para o GPS funcionar no celular.

No Vercel: importe o repositório → framework detectado automaticamente como Vite → deploy em 1 clique.

---

## 📄 Licença

MIT — use, modifique e distribua livremente.
