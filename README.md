# 🚚 Vale o Frete?

> **Descubra se o frete realmente vale a pena.**  
> Ferramenta profissional de análise financeira e tomada de decisão para motoristas e transportadores autônomos.

Desenvolvido para viagens de carga em geral e fretes urbanos (**Mercado Livre Envios Flex**, **LalaMove** e **inDrive Fretes**). Funciona 100% no navegador do celular, sem cadastro e sem necessidade de backend.

---

## ✨ Funcionalidades Principais

### 🚛 1. Análise Completa de Fretes (Viagens)
- **Informações do Frete**: Origem, Destino, Valor bruto, Distância de ida e Pedágios.
- **Recurso de Retorno Vazio**: Switch inteligente que dobra a quilometragem e ajusta os indicadores instantaneamente com aviso visual destacando o custo da volta sem receita.
- **Cálculo Rápido vs Completo**: Permite calcular em segundos com as médias salvas do veículo ou detalhar despesas extras como alimentação, hospedagem e ajudante.

### 📦 2. Fretes Urbanos e Entregas Rápidas
- **Mercado Livre Envios Flex**: Valor da rota, quantidade de paradas, deslocamento até o galpão e rota de entrega → lucro por parada e por km real.
- **LalaMove / inDrive Fretes**: Valor da corrida, deslocamento até o cliente, trajeto de entrega e pedágios extras.

### 🟢🟡🔴 3. Veredito e Tomada de Decisão
Card visual de alto destaque que responde imediatamente: **"Devo aceitar esse frete?"**
- 🟢 **VALE A PENA!** — Margem de lucro saudável ($\ge 22\%$) e bom retorno por km.
- 🟡 **VALE COM ATENÇÃO** — Margem positiva porém apertada ($10\%$ a $22\%$).
- 🔴 **NÃO VALE A PENA** — Margem baixa ($< 10\%$) ou prejuízo financeiro.

### 📊 4. Quatro Métricas de Destaque
- 💵 **Lucro Líquido Estimado** (R$)
- 📈 **Margem Líquida** (%)
- 📏 **Receita por Km** (R$/km)
- ⛽ **Custo por Km** (R$/km)
- Tabela detalhada com a composição de combustível, desgaste de pneus, manutenção, depreciação e pedágios.

### ⚙️ 5. Configurações "Meu Veículo"
- **Tipos de Veículo**: 🚛 Carreta / Bitrem, 🚚 Caminhão Toco/Truck, 🚐 Van / VUC, 🚗 Carro de Passeio, 🏍️ Moto.
- **Combustíveis**: Suporte a **Diesel**, Gasolina, Etanol e Flex.
- **Custos Operacionais por Km**: Manutenção, Desgaste de Pneus, Depreciação e Outros por km.
- **Preços Médios ANP**: Detecção por GPS ou seletor com todos os 27 estados do Brasil.

### 📋 6. Histórico e Repetição de Cálculo
- Salva o histórico das viagens calculadas com data, rota, valor, distância, lucro e margem.
- Botão **"🔄 Repetir"**: Recarrega todos os dados da viagem no formulário com 1 clique.
- Exclusão individual de registros e exportação para planilha **`.csv`**.

### 📱 7. PWA — Instalável e Mobile-First
- Interface limpa com botões grandes, pensada para uso na cabine do caminhão ou durante paradas.
- Adicione à tela inicial pelo navegador do celular e use offline.

---

## 🛠️ Tecnologias Utilizadas

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + Vite 7 |
| Estilo | CSS3 puro (Mobile-First, Design System nativo) |
| Persistência | `localStorage` (Privacidade total, sem cadastro) |
| Geolocalização | Browser Geolocation API |
| Geocodificação de Estado | [Nominatim / OpenStreetMap](https://nominatim.openstreetmap.org/) |
| Cálculo de Rota por Endereço | [OSRM](http://project-osrm.org/) |
| Preços de Combustível | Base ANP (Agência Nacional do Petróleo) |
| PWA | Web App Manifest + Service Worker |

---

## 🚀 Como Rodar Localmente

```bash
# Clone o repositório
git clone https://github.com/MarcosN7/vale-o-frete.git
cd vale-o-frete

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
# Acesse http://localhost:5173
```

```bash
# Gerar build de produção
npm run build

# Pré-visualizar build localmente
npm run preview
```

---

## 📁 Estrutura do Projeto

```
vale-o-frete/
├── public/
│   ├── favicon.svg
│   ├── manifest.json            # Configuração PWA
│   └── sw.js                    # Service Worker Offline
├── src/
│   ├── services/
│   │   ├── fuelPrices.js        # Tabela ANP (Diesel, Gasolina, Etanol) + Detecção GPS
│   │   └── osrm.js              # Geocodificação e roteamento OpenStreetMap
│   ├── components/
│   │   ├── ModoFreteGeral.jsx   # Calculadora principal de fretes e viagens
│   │   ├── ModoML.jsx           # Modo Mercado Livre Flex
│   │   ├── ModoLalamove.jsx     # Modo LalaMove / inDrive
│   │   ├── ResultDisplay.jsx    # Card de veredito e breakdown financeiro
│   │   ├── DistanceInput.jsx    # Entrada manual e cálculo de rota
│   │   ├── SettingsModal.jsx    # Configurações do veículo e custos operacionais
│   │   ├── FuelBanner.jsx       # Resumo de combustível no topo
│   │   └── History.jsx          # Histórico com repetição e exportação CSV
│   ├── App.jsx                  # Navegação por abas e gerenciamento de estado
│   ├── utils.js                 # Motor de cálculo financeiro desacoplado
│   └── index.css                # Estilos globais e responsivos
├── index.html
├── vite.config.js
└── package.json
```

---

## 🌐 Deploy na Vercel

O projeto está otimizado para deploy instantâneo na **Vercel**:
1. Conecte seu repositório GitHub à Vercel.
2. O framework Vite será detectado automaticamente.
3. Cada `git push` na branch `main` atualizará a versão online em produção.

---

## 📄 Licença

Distribuído sob a licença **MIT** — livre para uso pessoal e comercial.
