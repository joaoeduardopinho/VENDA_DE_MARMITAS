# 🍱 Marmitas Brasília - Vitrine Gourmet & Chatbot 100% Client-Side (Sem LLM)

> 🌐 **Acesse o site online:** [https://joaoeduardopinho.github.io/VENDA_DE_MARMITAS/](https://joaoeduardopinho.github.io/VENDA_DE_MARMITAS/)

Aplicação web gastronômica de alto padrão para delivery de marmitas em Brasília (DF). O projeto une o **Estilo Vitrine Gourmet (inspirado em Liv Up & Factor)** a um **Chatbot conversacional 100% Client-Side**, processado inteiramente no navegador via **Processamento de Linguagem Natural (NLP)** e Máquina de Estados — **sem qualquer dependência de LLM, sem servidor backend e sem consumo de APIs pagas**.

---

## 🎨 O Que Há de Novo: Design "Vitrine Gourmet"

1. **Vitrine Gastronômica Interativa**:
   - Cards de pratos elegantes com ilustrações artísticas, contagem de calorias (`kcal`), tags de proteína (`Bovino`, `Frango`, `Linha Fit`, `Pescados`, `Feijoada`) e preço unitário destacado.
   - **Filtros por Linha e Preferência**: Botões de acesso rápido para `Fit / Leve`, `Bovinos`, `Aves`, `Pescados` e `Tradicional`.
   - **Cardápio Rotativo por Dia da Semana**: Seletor horizontal com abas de Segunda a Domingo e botão de "Hoje".
2. **Modal Gourmet de Customização**:
   - Ao clicar em **+ Adicionar**, abre-se uma gaveta/modal interativo para escolher o **Ponto da Carne** (*ao ponto, bem passado, mal passado*) e marcar preferências de tempero e porções em mais de 20 opções com cálculo em tempo real.
3. **Chatbot Integrado com Candanga (NLP no Browser)**:
   - A assistente virtual fica posicionada como um copiloto gastronômico lateral: o usuário pode pedir por cliques na vitrine ou digitando frases naturais.
4. **Comanda / Carrinho Flutuante (Drawer)**:
   - Gaveta lateral deslizante com resumo detalhado, cálculo automático da taxa de entrega fixa de Brasília (R$ 6,00) e exportação direta formatada para o WhatsApp do restaurante.
5. **Paleta Gourmet Orgânica**:
   - Tons de **Verde Esmeralda Nobre** (`#064e3b`, `#047857`), **Terracota Artesanal** (`#c2410c`) e **Ouro Brasília** (`#d97706`).

---

## 🥗 Amplo Catálogo de Personalizações e Acompanhamentos

O motor conversacional e o modal de customização oferecem dezenas de opções interpretadas via NLP:

- **Arroz & Grãos**: *Sem arroz*, *Arroz integral*, *Arroz branco*, *Pouco arroz*, *Arroz caprichado*.
- **Feijão & Caldos**: *Sem feijão*, *Só o caldo do feijão*, *Feijão sem caldo*, *Feijão à parte*, *Feijão preto*, *Feijão carioca*.
- **Saladas & Legumes**: *Sem salada*, *Salada à parte*, *Sem tomate*, *Sem alface*, *Sem pepino*, *Sem legumes*, *Salada extra*.
- **Cebola, Alho & Cheiro-Verde**: *Sem cebola*, *Pouca cebola*, *Cebola extra / bem acebolado*, *Sem alho*, *Alho extra*, *Sem cheiro-verde/coentro*.
- **Sal & Pimenta**: *Pouco sal*, *Sem sal*, *Sem pimenta*, *Com pimenta da casa*.
- **Batatas, Farofas & Frituras**: *Sem farofa*, *Farofa extra*, *Sem batata frita*, *Com purê no lugar das fritas*, *Sem purê*, *Sem batata palha*, *Batata palha à parte*.
- **Molhos & Extras**: *Sem molho*, *Molho à parte*, *Molho extra*, *Sem vinagrete*, *Vinagrete à parte*, *Sem queijo*, *Sem ovo*, *Ovo com gema mole*, *Ovo com gema dura*, *Sem couve*, *Sem torresmo*, *Sem champignon*.
- **Capturador Genérico Inteligente**: Identifica comandos livres como *"tira o ingrediente X"* ou *"sem X"* e atualiza a comanda automaticamente.
- **Alteração de Pedido Existente**: Se uma marmita já estiver na comanda e o cliente digitar apenas *"sem arroz"* ou *"pouco sal"*, a assistente atualiza a última marmita sem reiniciar o pedido.

---

## ⚡ Por que 100% Client-Side e Sem LLM?

- **Privacidade Total**: Nenhum dado do cliente (endereço, telefone, mensagens) é enviado a servidores de terceiros.
- **Custo Zero & Zero Latência**: Funciona instantaneamente sem necessidade de chaves de API pagas (OpenAI, Gemini, Claude).
- **Sem Alucinações**: Respostas exatas e determinísticas garantidas pela máquina de estados.
- **Disponibilidade Offline**: Funciona mesmo com instabilidade de rede após o primeiro carregamento.

---

## 🧠 Pipeline de Processamento de Linguagem Natural (NLP)

Desenvolvido em JavaScript Vanilla puro (`NLPProcessor` em [app.js](app.js)):
- **Normalização & Remoção de Acentos (NFD)**: Reconhece termos independentemente da ortografia com acentuação.
- **Tokenização e Stemming/Lematização**: Reduz termos flexionados às raízes em português.
- **Similaridade por Distância de Levenshtein**: Tolera pequenos erros ortográficos do usuário no celular.
- **Classificação de Intenções (Intent Recognition)**: Identifica saudações, cardápio, checkout, ajuda ou cancelamento.
- **Extração de Entidades Nomeadas (NER)**: Identifica automaticamente quantidades, ponto da carne, temperos e pagamento digitados no chat.

---

## 🛡️ Guardrails & Segurança

- **Limite Rígido de 300 Caracteres**: Trava física no campo (`maxlength="300"`), contador visual e validação na engine JS.
- **Anti-XSS & Anti-Jailbreak**: Sanitização rigorosa de entidades HTML e bloqueio de tentativas de injeção de código ou evasão de comandos.
- **Escopo Fechado**: Foco restrito a pedidos de marmitas.

---

## 📂 Estrutura de Arquivos

```text
├── index.html        # Estrutura da Vitrine Gourmet, Modal e Chatbot
├── styles.css        # Design System moderno: Paleta Esmeralda/Terracota e Glassmorphism
├── app.js            # Engine Client-side: NLP, Vitrine Dinâmica, Modal e Comanda
└── README.md         # Documentação completa
```

---

## 💻 Como Executar

Por ser **100% Client-Side**, basta clonar e abrir no navegador:
```bash
git clone https://github.com/joaoeduardopinho/VENDA_DE_MARMITAS.git
```
Dê um duplo clique no arquivo `index.html` e aproveite a experiência gourmet de Brasília!
