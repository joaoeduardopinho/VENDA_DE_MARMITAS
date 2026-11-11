# 🍱 MarmitaBot - Chatbot de Vendas de Marmitas

> 🌐 **Acesse o site online:** [https://joaoeduardopinho.github.io/VENDA_DE_MARMITAS/](https://joaoeduardopinho.github.io/VENDA_DE_MARMITAS/)

Chatbot conversacional interativo desenvolvido em **JavaScript Vanilla (100% Client-Side)** para atendimento, personalização de marmitas, cálculo dinâmico de taxa de entrega e fechamento de pedidos com suporte a checkout via WhatsApp.

Desenvolvido sob padrões de **Engenharia de Software / Sistemas de Informação**, com arquitetura modular, sanitização de entrada e **Guardrails defensivos multicamadas contra Prompt Injection, Jailbreak e Exfiltração de Tokens**.

---

## 🌐 Demonstração Online

A aplicação está hospedada e disponível via GitHub Pages:
👉 **[Clique aqui para abrir o MarmitaBot](https://joaoeduardopinho.github.io/VENDA_DE_MARMITAS/)**

---

## 🚀 Funcionalidades

- **Cardápio Dinâmico por Dia da Semana**:
  - Exibe os pratos disponíveis hoje ou permite ao usuário consultar o cardápio de qualquer dia da semana (Segunda a Domingo).
  - Preços unitários por item claramente informados.
- **Processamento de Linguagem Natural & Seleção por Texto**:
  - Reconhecimento flexível de intenções e nomes dos pratos digitados no chat.
- **Personalização Completa da Marmita**:
  - Customização de ingredientes e temperos (ex: *"sem cebola"*, *"sem salada"*, *"molho à parte"*).
  - Ponto de cozimento para carnes (*"ao ponto"*, *"bem passada"*, *"mal passada"*).
  - Quantidade de marmitas e itens adicionais.
- **Cálculo Transparente de Entrega e Total**:
  - Endereço de entrega com cálculo automático de taxa e prazo estimado.
  - Resumo de pedido discriminado item por item com subtotais.
- **Fechamento e Integração com WhatsApp**:
  - Opções de pagamento (PIX, Cartão na Entrega, Dinheiro).
  - Exportação formatada direta para o WhatsApp do restaurante.
- **Segurança & Guardrails Defensivos (Anti-Injection / Anti-Jailbreak)**:
  - **Validação de Entrada (Regex & Heurísticas)**: Bloqueia tentativas como `ignore previous instructions`, `DAN mode`, `system prompt`, `<script>`, markdown de injeção, etc.
  - **Escopo Rígido de Conversação**: Se a mensagem fugir do domínio de pedidos de marmitas, o bot adota fallback seguro e orienta o cliente a focar no pedido.
  - **Sanitização de HTML contra XSS**: Renderização segura de todas as mensagens na tela.
  - **Suporte Híbrido**: Funciona 100% offline via State-Machine/NLP local e suporta chave Gemini API opcional (executada totalmente pelo browser do usuário).

---

## 🛠️ Tecnologias Utilizadas

- **HTML5** & **CSS3 Moderno** (Design responsivo, Glassmorphism, temas de restaurante aconchegante, adaptável a smartphones e desktops).
- **JavaScript ES6+ (Client-side puro)**: Zero dependências de servidor ou Node.js backend.
- **Font Awesome & Google Fonts**: Ícones e tipografia moderna.

---

## 📂 Estrutura de Arquivos

```text
├── index.html        # Interface de usuário do Chatbot e carrinho
├── styles.css        # Estilos modernos, responsividade e animações
├── app.js            # Lógica do chatbot, máquina de estados, regras de negócio e guardrails
└── README.md         # Documentação técnica do projeto
```

---

## 🛡️ Camada de Guardrails (Segurança)

O sistema implementa 4 camadas defensivas:
1. **Sanitização XSS**: Converte entidades HTML para impedir execução de scripts maliciosos.
2. **Detector de Jailbreak & Prompt Injection**:
   - Detecta termos de evasão como `jailbreak`, `override`, `system prompt`, `sudo`, `pretend you are`, `mode developer`, etc.
   - Dispara alerta de segurança interno e responde com mensagem padronizada de conformidade.
3. **Validador de Tamanho e Repetição**:
   - Previne estouro de contexto e spam de caracteres repetidos.
4. **Isolamento de Contexto**:
   - Respostas geradas por regras e templates de negócio controlados, garantindo que o assistente não alucine descontos indevidos nem mude preços tabelados.

---

## 💻 Como Executar

Por ser uma aplicação **100% Client-Side**, não é necessário instalar nenhum ambiente ou servidor:

1. Clone o repositório ou baixe os arquivos:
   ```bash
   git clone <URL_DO_SEU_REPOSITORIO>
   ```
2. Abra o arquivo `index.html` em qualquer navegador moderno (Chrome, Edge, Firefox, Safari).
3. Comece a conversar e pedir suas marmitas!
   git add .
   git commit -m "feat: Chatbot de vendas de marmitas client-side com guardrails"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
   git push -u origin main
   ```
