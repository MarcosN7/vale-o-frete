# Calcular pela rota — distância automática

## Análise do repositório

Base analisada: `main`, commit `1797a0e465ecf8dba317c18a9412a3953bff2632`.
Aplicação React 19 + Vite, sem backend próprio. `src/App.jsx` coordena os modos,
configurações, tutorial e histórico. `src/utils.js` concentra custos, taxas e lucro;
`ModoFreteGeral`, `ModoML` e `ModoLalamove` consomem essa lógica. Existe uma busca
anterior em `DistanceInput.jsx` / `services/osrm.js` usando Nominatim e OSRM.
A interface antiga de `DistanceInput` foi substituída pelo cálculo ORS compartilhado;
`services/osrm.js` permanece no repositório, mas não é usado nessa interface. O service worker atual ignora domínios
externos; o proxy desta implementação deve usar uma origem separada.
Não havia suíte de testes nem workflows de deploy versionados na árvore analisada.

## Plano e escopo

1. **Implementado:** mapa, saída digitada ou GPS, destino e até oito paradas;
   coleta intermediária opcional. Worker ORS com chave protegida.
2. **Correção solicitada em 18/09:** `DistanceInput` compartilhado dentro de Frete
   Geral, Mercado Livre e Lalamove/inDrive. Ao selecionar todos os endereços, a rota
   é consultada automaticamente (400 ms de espera para agrupar alterações) e a
   distância alimenta os campos existentes. Não é necessário digitar quilômetros.
   Frete Geral recebe o total de ida; os outros modos recebem coleta e entrega
   separados, somados uma única vez. Fórmulas de custos e taxas não foram alteradas.
3. **Homologação pendente:** configurar chave e Worker de preview, validar rotas reais,
   GPS e layout em celular. Chave ORS e Worker publicado ainda não estão disponíveis.
4. **Produção futura:** sem merge/deploy neste pedido. Habilitar a flag no ambiente
   aprovado somente após homologação. Retorno vazio continua sendo uma opção
   separada existente; a rota automática não solicita nem adiciona uma volta.

## Arquitetura

- Mapa: MapLibre GL JS, estilo `https://tiles.openfreemap.org/styles/liberty`.
  Tiles e estilo vêm diretamente de OpenFreeMap; não consomem chamadas ORS.
- Geolocalização: `navigator.geolocation.getCurrentPosition`, somente após clique,
  timeout de 12 segundos, erro explicativo e continuidade sem GPS.
- Navegador → Worker: POST `/geocode` e POST `/route`; nenhum segredo `VITE_*`.
- Worker → ORS/HeiGIT: `/geocode/search`, limitado ao Brasil; e
  `/v2/directions/driving-car/geojson`, com coordenadas `[longitude, latitude]`.
- `instructions: true` preserva segmentos (o backend ORS remove segmentos quando
  false). As instruções não são devolvidas ao cliente, apenas distância/duração.
- Ordem: saída (endereço ou GPS) → coleta (se habilitada) → paradas → destino. Sem otimização
  automática, retorno implícito ou mudanças nas fórmulas financeiras.
- Distância em metros e tempo em segundos preservados; arredondamento só na tela.
- Endereços são confirmados pelo usuário entre até cinco resultados. Busca por botão
  ou Enter, sem requisições a cada tecla. Alterações invalidam a rota anterior, zeram a distância vinculada à calculadora e
  cancelam consultas obsoletas. O cálculo financeiro fica bloqueado até uma nova
  distância válida, evitando usar quilômetros de outro endereço. Paradas possuem IDs estáveis.
- Dados de localização/endereço ficam apenas no estado do painel; não são gravados
  em localStorage, histórico ou cache do proxy. Mudar para entrada manual ou trocar o modo de serviço descarta os pontos.
  Voltar ao modo por endereços limpa a distância antiga. Reiniciar a viagem limpa o
  editor; carregar histórico começa em modo manual para preservar a distância salva.
- Atribuições OpenFreeMap/OSM no mapa e ORS/HeiGIT abaixo do resumo.

## Arquivos

| Área | Arquivos |
| --- | --- |
| Integração | `DistanceInput.jsx`, `ModoFreteGeral.jsx`, `ModoML.jsx`, `ModoLalamove.jsx` |
| Interface e mapa | `src/features/route-calculator/*.jsx`, `route-calculator.css` |
| HTTP e modelo | `route-api.js`, `route-model.js` |
| Proxy | `workers/route-proxy/src/index.js`, `wrangler.jsonc` |
| Configuração exemplo | `.env.example`, `workers/route-proxy/.dev.vars.example` |
| Testes | `tests/route-calculator.test.js` |

`src/utils.js` e suas fórmulas, configurações e serviço OSRM existente permanecem
sem alterações. Os componentes de modo apenas recebem a distância calculada e
reiniciam o estado do editor. Origem/destino informativos foram renomeados para
“Identificação no histórico” para não confundir com os endereços do roteamento.

## Executar localmente

Use Node compatível com Vite 7 (Node 22.12+ recomendado; validação feita com Node 24).

```sh
npm ci
cp .env.example .env.local
```

No `.env.local`, habilite apenas a flag local:

```dotenv
VITE_ROUTE_CALCULATOR_ENABLED=true
VITE_ROUTE_PROXY_URL=http://localhost:8787
```

Copie `workers/route-proxy/.dev.vars.example` para
`workers/route-proxy/.dev.vars` e preencha `ORS_API_KEY` com uma chave da sua conta
openrouteservice. Esses arquivos estão no `.gitignore`. Nunca coloque a chave em
`VITE_*`, commits, prints ou URLs do frontend.

```sh
npx wrangler@4 dev --config workers/route-proxy/wrangler.jsonc --port 8787
```

Em outro terminal:

```sh
npm run dev
```

Abra `http://localhost:5173` e selecione **Por endereços** na seção de distância.
Quando a flag está ligada, essa entrada é o padrão; o modo **Informar quilômetros**
continua disponível como alternativa. Selecione a saída e o destino nos resultados
de busca. A consulta da rota ocorre automaticamente, sem botão extra ou campo de km.
Localhost permite geolocalização; em um celular acessando um IP da rede é necessário
HTTPS. A flag está desligada por padrão. Sem URL do proxy, o painel mostra o mapa
com uma mensagem de configuração pendente. Reinicie Vite após mudar variáveis.

## Preparar preview (não executado)

- Criar/configurar Worker de preview separado; nenhum route/custom domain de produção
  está configurado. `workers_dev: true` apenas permite endereço próprio caso publicado.
- Definir `ORS_API_KEY` como secret do Worker com Wrangler; não adicionar ao JSONC.
- Configurar `ALLOWED_ORIGINS` com a origem exata do preview. Não usar wildcard para
  `*.vercel.app`. Alterar `VITE_ROUTE_PROXY_URL` para HTTPS e habilitar a flag somente
  no preview. Variáveis Vite são aplicadas no build.
- Verificar se `namespace_id: "1001"` está livre na conta Cloudflare, ajustando se já
  pertencer a outro limitador. Requer Wrangler >= 4.36 para o binding de rate limit.
- Não criar rewrite de mesmo domínio sem antes excluir essas APIs do cache do PWA.
- A chave e o ambiente Cloudflare não foram fornecidos nesta tarefa; teste externo
  de geocoding/routing e deploy continuam pendentes.

## Limites e operação

O Worker só acessa endpoints ORS fixos, aceita JSON de até 4096 bytes e entre 2 e 11
coordenadas válidas. Timeout do upstream: 15 s; cliente: 25 s. CORS por origem exata;
respostas sem cache; erros externos e metadados são removidos para não expor segredos.

Rate limit inicial: 30 consultas/minuto por IP e localização Cloudflare. É uma defesa
básica para o MVP anônimo, não autenticação nem garantia de quota global. Usuários em
rede móvel podem compartilhar IP; CORS também não impede clientes fora do navegador.
Antes da abertura ampla, revisar quotas atuais da conta ORS, monitoramento sem dados
pessoais e proteção global/Turnstile se necessária. Limites do plano não são fixados
no código. Observabilidade de requests desativada no exemplo; não registrar URLs de
geocoding do upstream, pois contêm chave/endereço. Os provedores ainda recebem os
pontos necessários para prestar o serviço.

Perfil `driving-car`: não representa restrições de peso/altura de caminhões. Tempo
estimado sem trânsito ao vivo ou espera/carga/descarga. Busca pode ser incompleta em
algumas regiões; usuário deve confirmar o endereço no mapa. Sem suporte offline.
O pacote MapLibre é grande e fica em chunk lazy; o build pode emitir aviso de tamanho.

## Verificação

```sh
npm test
npm run build
VITE_ROUTE_CALCULATOR_ENABLED=true VITE_ROUTE_PROXY_URL=http://localhost:8787 npm run build
```

Testes automatizados do modelo e Worker: ordem e validação de pontos, coleta separada,
CORS/preflight, métodos, tamanho de JSON, rate limit, ausência de chave, contrato ORS,
erros do provedor e remoção de metadados. Mocks não comprovam disponibilidade externa. Os testes do Worker, modelo e integração React cobrem também o envio de quilômetros
aos três componentes reais da calculadora, falha/retry, edição e resposta atrasada.
As consultas externas e o mapa WebGL são substituídos por mocks na integração.
Os testes passaram e os builds
com a flag ligada e desligada passaram. O empacotamento do Worker também passou
com `npx wrangler@4 deploy --dry-run --config workers/route-proxy/wrangler.jsonc`
(Wrangler 4.134.0), sem publicar. A verificação visual automatizada foi
bloqueada pela ausência de Chromium no ambiente e pela falha no download do navegador;
portanto, o layout e a interação ainda precisam de homologação no navegador.

Checklist de homologação real: localização aceita/negada; coleta e destino com bairro
homônimo; zero/oito paradas; reordenação; endereço editado após cálculo; falha de rede;
quota esgotada; rota sem cobertura; mapa mobile; atribuições; mesma simulação financeira
antes/depois. Não liberar em produção antes dessa homologação.

## Referências consultadas

- https://openfreemap.org/quick_start/
- https://giscience.github.io/openrouteservice/api-reference/endpoints/directions/requests-and-return-types
- https://giscience.github.io/openrouteservice/api-reference/endpoints/geocoder/
- https://github.com/GIScience/openrouteservice/blob/main/ors-engine/src/main/java/org/heigit/ors/routing/RouteResultBuilder.java
- https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
