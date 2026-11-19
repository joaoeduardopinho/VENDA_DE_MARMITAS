# 🍱 Marmitas Brasília - Chatbot 100% Client-Side & Sem LLM

> 🌐 **Acesse o site online:** [https://joaoeduardopinho.github.io/VENDA_DE_MARMITAS/](https://joaoeduardopinho.github.io/VENDA_DE_MARMITAS/)

Aplicação web gastronômica de alta performance para pedidos de marmitas em Brasília (DF). O atendimento conversacional é **100% Client-Side**, processado inteiramente dentro do navegador do usuário por algoritmos determinísticos de **Processamento de Linguagem Natural (NLP)** e Máquina de Estados Finita — **sem qualquer uso de LLM, sem servidores backend e sem consumo de APIs pagas**.

---

## 🎨 Design Profissional & UI Refinada

- **Identidade Visual Brasília**: Paleta gastronômica com tons quentes de terra, dourado e verde fresco (`#d9480f`, `#2b8a3e`, `#f59f00`).
- **Glassmorphism & Microinterações**: Transições suaves, sombras em camadas e tipografia com *Plus Jakarta Sans* e *Cabinet Grotesk*.
- **Arquitetura Visual em 3 Colunas (Desktop)**:
  1. **Sidebar Esquerda**: Cardápio do dia interativo (clique para adicionar), seletor de dias da semana e badges de entrega no DF.
  2. **Área Central**: Chatbot conversacional com balões estilizados, indicador de digitação, botões de ação rápida e contador de 300 caracteres em tempo real.
  3. **Sidebar Direita**: Comanda dinâmica com subtotal, taxa de entrega fixa de Brasília e botão direto para envio no WhatsApp.
- **Responsividade Total**: Layout adaptável para smartphones, tablets e desktops.

---

## ⚡ Por que 100% Client-Side e Sem LLM?

1. **Privacidade Absoluta**: Nenhuma mensagem, endereço ou dado do cliente trafega para servidores de terceiros ou modelos de linguagem externos.
2. **Custo Zero & Zero Latência**: Funciona instantaneamente sem necessidade de tokens de API (OpenAI, Gemini, Claude) nem backend Node/Python.
3. **Respostas Imediatas e Previsíveis**: Não há risco de "alucinações", invenção de pratos ou quebra de preços tabelados.
4. **Disponibilidade 100%**: A aplicação continua funcionando normalmente mesmo offline após ser carregada no navegador.

---

## 🧠 Pipeline de Processamento de Linguagem Natural (NLP no Browser)

O motor `NLPProcessor` em [app.js](app.js) executa um fluxo completo de NLP escrito em JavaScript puro:

1. **Normalização & Remoção de Acentos (NFD)**:
   - Converte o texto para minúsculas e remove acentos, permitindo que *"cardápio"*, *"cardapio"*, *"marmitão"* e *"marmitao"* sejam compreendidos identicamente.
2. **Tokenização & Lematização/Stemming em Português**:
   - Quebra as sentenças em tokens e reduz palavras flexionadas às suas raízes (ex: plurais como *"marmitas"* $\rightarrow$ *"marmita"*, *"opções"* $\rightarrow$ *"opcao"*).
3. **Similaridade por Distância de Levenshtein**:
   - Algoritmo que mede a distância entre termos para tolerar erros de digitação comuns no celular (ex: *"bifee"*, *"frangoo"*, *"feijoda"*).
4. **Classificador de Intenções (Intent Recognition)**:
   - Mapeia intenções do usuário (`VIEW_MENU`, `CHECKOUT`, `RESTART`, `HELP`, `AFFIRMATIVE`, `NEGATIVE`).
5. **Reconhecimento de Entidades Nomeadas (NER - Named Entity Recognition)**:
   - **Quantidades**: Detecta números em algarismos (`1`, `2`) e por extenso (`duas`, `três`).
   - **Ponto da Carne**: Extrai com precisão *"ao ponto"*, *"bem passado"*, *"mal passado"*.
   - **Modificadores & Restrições**: Filtra termos como *"sem cebola"*, *"pouco sal"*, *"sem salada"*, *"molho à parte"*, *"arroz integral"*.
   - **Forma de Pagamento**: Reconhece termos como *"PIX"*, *"cartão"* e *"dinheiro"*.

---

## 🛡️ Camada de Guardrails & Segurança Defensiva

1. **Limite Rígido de 300 Caracteres**:
   - Trava física via atributo HTML `maxlength="300"`.
   - Contador visual em tempo real no campo de entrada (`0/300`) com alertas de limite.
   - Validação preventiva na máquina de estados contra ataques de flood e estouro de memória.
2. **Anti-Injection & Sanitização XSS**:
   - Bloqueio de tags `<script>`, `onerror`, `onload`, `eval()`, chamadas a `document.cookie` e escape de HTML em todas as mensagens renderizadas.
3. **Anti-Jailbreak & Modo Imutável**:
   - Rejeição de instruções de evasão (`ignore instructions`, `DAN mode`, `sudo`, `system prompt`).
4. **Isolamento de Domínio**:
   - O assistente recusa ativamente perguntas que fujam do propósito de marmitas (ex: redações, código, assuntos gerais).

---

## 📂 Estrutura do Projeto

```text
├── index.html        # Estrutura HTML5 semântica e acessível
├── styles.css        # Design System moderno, responsivo e paleta gastronômica
├── app.js            # Engine Client-side: NLP, Guardrails e Máquina de Estados
└── README.md         # Documentação técnica do projeto
```

---

## 🚀 Como Executar

Por ser uma aplicação **100% Client-Side**, não requer Node.js, banco de dados ou instalação:

1. Clone ou baixe o repositório:
   ```bash
   git clone https://github.com/joaoeduardopinho/VENDA_DE_MARMITAS.git
   ```
2. Dê um duplo clique no arquivo `index.html` para abrir diretamente no seu navegador (Chrome, Edge, Firefox, Safari).
3. Converse com a **Candanga** e faça seus pedidos de marmitas em Brasília!
