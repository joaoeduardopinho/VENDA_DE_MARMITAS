/**
 * MARMITAS BRASÍLIA - SISTEMA DE ATENDIMENTO 100% CLIENT-SIDE
 * Chatbot Conversacional Determinístico baseado em Engenharia de Software e NLP
 * SEM LLM / SEM APIs EXTERNAS / PROCESSAMENTO TOTALMENTE NO NAVEGADOR
 */

// ==========================================
// MÓDULO DE PROCESSAMENTO DE LINGUAGEM NATURAL (NLP)
// ==========================================
class NLPProcessor {
  // Remove acentuação e padroniza texto (Normalização)
  static normalize(text) {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove acentos
      .trim();
  }

  // Tokenização básica (quebra em palavras ignorando pontuações supérfluas)
  static tokenize(text) {
    const norm = this.normalize(text);
    return norm.match(/[\wÀ-ÿ]+/g) || [];
  }

  // Distância de Levenshtein para medir proximidade entre duas palavras (Tolerância a erros de digitação)
  static levenshteinDistance(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substituição
            matrix[i][j - 1] + 1,     // inserção
            matrix[i - 1][j] + 1      // deleção
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  // Similaridade baseada em Levenshtein normalizada (0 a 1)
  static similarity(s1, s2) {
    const a = this.normalize(s1);
    const b = this.normalize(s2);
    if (!a && !b) return 1.0;
    if (!a || !b) return 0.0;
    if (a === b) return 1.0;
    if (a.includes(b) || b.includes(a)) return 0.9;

    const distance = this.levenshteinDistance(a, b);
    const maxLen = Math.max(a.length, b.length);
    return 1 - (distance / maxLen);
  }

  // Stemming / Lematização simplificada para português (reduz plurais e variações comuns)
  static stem(word) {
    let w = this.normalize(word);
    if (w.endsWith('oes')) return w.slice(0, -3) + 'ao';
    if (w.endsWith('res') || w.endsWith('zes') || w.endsWith('nes')) return w.slice(0, -2);
    if (w.endsWith('is') && w.length > 3) return w.slice(0, -2) + 'l';
    if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) return w.slice(0, -1);
    return w;
  }

  // Classificador de Intenção (Intent Recognition)
  static detectIntent(text) {
    const norm = this.normalize(text);
    const tokens = this.tokenize(norm).map(t => this.stem(t));

    const intents = {
      GREETING: ['ola', 'oi', 'opa', 'bom dia', 'boa tarde', 'boa noite', 'e ai'],
      VIEW_MENU: ['cardapio', 'menu', 'prato', 'opcao', 'comida', 'almoco', 'refeicao', 'hoje'],
      CHECKOUT: ['fechar', 'finalizar', 'pagar', 'encerrar', 'total', 'conta', 'carrinho', 'resumo', 'pedir'],
      HELP: ['ajuda', 'socorro', 'como funciona', 'duvida', 'instrucao', 'exemplo'],
      RESTART: ['limpar', 'reiniciar', 'cancelar tudo', 'recomecar', 'zerar', 'novo pedido'],
      AFFIRMATIVE: ['sim', 'claro', 'pode ser', 'isso', 'correto', 'quero', 'com certeza'],
      NEGATIVE: ['nao', 'nunca', 'cancelar', 'deixa']
    };

    for (const [intent, phrases] of Object.entries(intents)) {
      for (const phrase of phrases) {
        if (norm.includes(phrase)) return intent;
        for (const token of tokens) {
          if (this.similarity(token, phrase) >= 0.85) return intent;
        }
      }
    }

    return 'UNKNOWN';
  }

  // Reconhecimento de Entidades Nomeadas / Argumentos (NER - Named Entity Recognition)
  static extractEntities(text) {
    const norm = this.normalize(text);
    const entities = {
      quantity: 1,
      cookingPoint: null,
      modifiers: [],
      paymentMethod: null
    };

    // 1. Extração Numérica / Quantidade (algarismos ou palavras)
    const numberWords = {
      'um': 1, 'uma': 1, 'dois': 2, 'duas': 2, 'tres': 3, 'quatro': 4,
      'cinco': 5, 'seis': 6, 'sete': 7, 'oito': 8, 'nove': 9, 'dez': 10
    };
    const digitsMatch = norm.match(/\b(\d+)\b/);
    if (digitsMatch) {
      const q = parseInt(digitsMatch[1]);
      if (q > 0 && q <= 30) entities.quantity = q;
    } else {
      for (const [word, val] of Object.entries(numberWords)) {
        if (new RegExp(`\\b${word}\\b`).test(norm)) {
          entities.quantity = val;
          break;
        }
      }
    }

    // 2. Extração do Ponto da Carne
    if (/bem\s*passad[ao]|bem\s*tostad[ao]|torrad[ao]/.test(norm)) {
      entities.cookingPoint = 'Bem passado';
    } else if (/mal\s*passad[ao]|sangrand[ao]/.test(norm)) {
      entities.cookingPoint = 'Mal passado';
    } else if (/ao\s*ponto|ponto/.test(norm)) {
      entities.cookingPoint = 'Ao ponto';
    }

    // 3. Modificações de Ingredientes e Temperos (NER com negações e preferências)
    const ingredientPatterns = [
      { regex: /(?:sem|tira|retira|sem)\s+(cebola|cebolas)/i, tag: 'Sem cebola' },
      { regex: /(?:pouco|menos|baixo|sem)\s+(sal)/i, tag: 'Pouco sal' },
      { regex: /(?:sem|tira|retira)\s+(alho)/i, tag: 'Sem alho' },
      { regex: /(?:sem|tira|retira)\s+(feijao|feijoes)/i, tag: 'Sem feijão' },
      { regex: /(?:com\s+arroz\s+integral|arroz\s+integral)/i, tag: 'Arroz integral' },
      { regex: /(?:sem|tira|retira)\s+(salada|alface|tomate)/i, tag: 'Sem salada' },
      { regex: /(?:molho\s+[aà]\s*parte|separado)/i, tag: 'Molho à parte' },
      { regex: /(?:bastante|com|mais)\s+(pimenta)/i, tag: 'Com pimenta da casa' },
      { regex: /(?:com\s+bastante\s+cebola|capricha\s+na\s+cebola)/i, tag: 'Com cebola extra' }
    ];

    ingredientPatterns.forEach(pattern => {
      if (pattern.regex.test(norm)) {
        entities.modifiers.push(pattern.tag);
      }
    });

    // 4. Reconhecimento de Forma de Pagamento
    if (norm.includes('pix')) entities.paymentMethod = 'PIX';
    else if (norm.includes('cartao') || norm.includes('credito') || norm.includes('debito')) entities.paymentMethod = 'Cartão na Entrega';
    else if (norm.includes('dinheiro')) entities.paymentMethod = 'Dinheiro';

    return entities;
  }
}

// 1. BASE DE CONHECIMENTO & CARDÁPIO DIÁRIO
const MENU_DATA = {
  segunda: [
    { id: 'virado', name: 'Virado à Paulista', price: 22.00, desc: 'Bisteca suína, tutu de feijão, couve refogada, ovo frito e arroz.', meatType: 'suino' },
    { id: 'bife_vaca', name: 'Bife de Vaca Acebolado', price: 25.00, desc: 'Alcatra grelhada com cebola dourada, arroz, feijão carioca e salada.', meatType: 'bovino' },
    { id: 'frango_grelhado', name: 'Filé de Frango Grelhado', price: 20.00, desc: 'Filé macio com ervas finas, arroz integral ou branco e legumes.', meatType: 'frango' }
  ],
  terca: [
    { id: 'bife_vaca', name: 'Bife de Vaca Grelhado', price: 25.00, desc: 'Contrafilé macio, arroz soltinho, feijão, farofa e vinagrete.', meatType: 'bovino' },
    { id: 'panqueca_carne', name: 'Panquecas de Carne Moída', price: 21.00, desc: 'Duas panquecas ao molho pomodoro rústico, arroz e queijo gratinado.', meatType: 'bovino' },
    { id: 'frango_parmegiana', name: 'Frango à Parmegiana', price: 24.00, desc: 'Empanado crocante coberto com queijo e molho, arroz e fritas.', meatType: 'frango' }
  ],
  quarta: [
    { id: 'feijoada', name: 'Feijoada Completa Tradicional', price: 28.00, desc: 'Carnes nobres, arroz, couve refogada no alho, farofa e laranja.', meatType: 'suino' },
    { id: 'bife_vaca', name: 'Bife de Vaca Acebolado', price: 25.00, desc: 'Bife fatiado na chapa com cebolas douradas, arroz e feijão.', meatType: 'bovino' },
    { id: 'frango_assado', name: 'Sobrecoxa Assada ao Forno', price: 21.00, desc: 'Frango dourado com batatas coradas, arroz e salada fresca.', meatType: 'frango' }
  ],
  quinta: [
    { id: 'lasanha', name: 'Lasanha à Bolonhesa', price: 24.00, desc: 'Massa artesanal, bastante queijo, molho de carne e arroz opcional.', meatType: 'bovino' },
    { id: 'bife_vaca', name: 'Bife de Vaca à Milanesa', price: 26.00, desc: 'Carne bovina empanada sequinha, arroz, feijão e purê de batata.', meatType: 'bovino' },
    { id: 'strogonoff_frango', name: 'Strogonoff de Frango', price: 22.00, desc: 'Peito de frango em cubos com champignon, arroz e batata palha.', meatType: 'frango' }
  ],
  sexta: [
    { id: 'peixe_grelhado', name: 'Filé de Tilápia Grelhado', price: 27.00, desc: 'Tilápia com azeite de ervas, arroz branco, purê e salada verde.', meatType: 'peixe' },
    { id: 'bife_vaca', name: 'Bife de Vaca Acebolado', price: 25.00, desc: 'Bife bovino suculento, arroz, feijão preto e couve.', meatType: 'bovino' },
    { id: 'feijoada_light', name: 'Feijoada Light de Sexta', price: 28.00, desc: 'Feijoada suave sem gordura em excesso, arroz e farofa crocante.', meatType: 'suino' }
  ],
  sabado: [
    { id: 'feijoada_especial', name: 'Feijoada Premium', price: 32.00, desc: 'Acompanha arroz, torresmo pururuca, couve, vinagrete e bisteca.', meatType: 'suino' },
    { id: 'bife_picanha', name: 'Bife de Picanha na Brasa', price: 35.00, desc: 'Picanha fatiada, farofa de ovos, arroz biro-biro e batatas.', meatType: 'bovino' },
    { id: 'strogonoff_carne', name: 'Strogonoff de Carne Bovina', price: 26.00, desc: 'Alcatra em tiras ao molho cremoso, champignon e batata palha.', meatType: 'bovino' }
  ],
  domingo: [
    { id: 'frango_assado_familia', name: 'Frango Assado Especial', price: 30.00, desc: 'Frango temperado com ervas e limão, farofa rica e maionese.', meatType: 'frango' },
    { id: 'bife_vaca', name: 'Bife de Vaca ao Molho Madeira', price: 32.00, desc: 'Filé bovino macio com cogumelos frescos, arroz e purê.', meatType: 'bovino' },
    { id: 'massa_artesanal', name: 'Nhoque Recheado ao Sugo', price: 26.00, desc: 'Nhoque de batata artesanal com queijo derretido e manjericão.', meatType: 'vegetariano' }
  ]
};

const DELIVERY_FEE = 6.00;

// 2. MÁQUINA DE ESTADOS DO CHATBOT & CARRINHO
class MarmitaBotEngine {
  constructor() {
    this.cart = [];
    this.currentDayKey = this.getTodayKey();
    this.conversationHistory = [];
    this.sessionState = {
      step: 'GREETING', // GREETING, ORDERING, CONFIRMING_ITEM, ASKING_ADDRESS, PAYMENT, COMPLETED
      pendingItem: null
    };
  }

  getTodayKey() {
    const days = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const todayIndex = new Date().getDay();
    return days[todayIndex];
  }

  setDay(dayKey) {
    if (dayKey === 'hoje') {
      this.currentDayKey = this.getTodayKey();
    } else if (MENU_DATA[dayKey]) {
      this.currentDayKey = dayKey;
    }
  }

  // ==========================================
  // CAMADA DE SEGURANÇA, TOKEN DEFENSE & GUARDRAILS
  // ==========================================
  validateSecurityGuardrails(input) {
    if (!input || typeof input !== 'string') {
      return { safe: false, reason: 'Entrada vazia ou inválida.' };
    }

    const trimmed = input.trim();

    // 1. Defesa contra estouro de tokens / Flood / DoS / Limite de Caracteres
    if (trimmed.length > 300) {
      return {
        safe: false,
        reason: '⚠️ Mensagem muito longa. O limite máximo permitido é de 300 caracteres para segurança e economia de processamento.'
      };
    }

    const cleanInput = trimmed.toLowerCase();

    // 2. Defesa contra Exfiltração de Tokens & Chaves de API
    const tokenTheftPatterns = [
      /(api[_-]?key|token|bearer|secret|auth|credencial|password|senha|session)/i,
      /ghp_[a-zA-Z0-9]{20,}/,
      /github_pat_[a-zA-Z0-9_]{20,}/,
      /sk-[a-zA-Z0-9]{20,}/,
      /ai[a-zA-Z0-9_-]{25,}/
    ];

    for (const pattern of tokenTheftPatterns) {
      if (pattern.test(cleanInput)) {
        return {
          safe: false,
          isAttack: true,
          reason: '🛡️ BLOQUEIO DE SEGURANÇA: Menção ou tentativa de requisição de chaves/tokens detectada. Nenhuma credencial ou token pode ser acessada ou processada por esta aplicação.'
        };
      }
    }

    // 3. Jailbreak, Roleplay Evasivo, Modo Desenvolvedor e Prompt Injection
    const injectionPatterns = [
      /ignore (all )?(previous|prior) (instructions|directions|prompts)/i,
      /you are now in (dan|developer|god) mode/i,
      /act as an? (unfiltered|hacker|programmer|ai|assistant|expert|terminal|bash)/i,
      /reveal (your )?(system prompt|instructions|initial prompt)/i,
      /mostre (seu|o) (prompt de sistema|prompt inicial|instruções secretas)/i,
      /esqueça (todas as )?(suas )?(instruções|regras|ordens)/i,
      /finja que você (é|não tem regras|é um hacker|é um bot livre)/i,
      /desconsidere as restrições/i,
      /bypass safety/i,
      /modo (desenvolvedor|dan|livre|sem regras)/i,
      /jailbreak/i,
      /sudo /i,
      /<script[\s\S]*?>[\s\S]*?<\/script>/i,
      /javascript:/i,
      /onerror\s*=/i,
      /onload\s*=/i,
      /eval\s*\(/i,
      /document\.cookie/i,
      /window\.location/i
    ];

    for (const pattern of injectionPatterns) {
      if (pattern.test(cleanInput)) {
        return {
          safe: false,
          isAttack: true,
          reason: '🚨 TENTATIVA DE JAILBREAK/INJEÇÃO BLOQUEADA: O sistema detectou tentativa de evasão de diretrizes. Este chatbot possui escopo rígido e imutável para vendas de marmitas.'
        };
      }
    }

    // 4. Domínio Fechado (Strict Domain Restriction)
    // Impede o uso de tokens para geração de redações, código, conversas aleatórias, etc.
    const forbiddenDomains = [
      /escreva (um|uma) (poema|código|redação|script|história|artigo)/i,
      /qual é a capital /i,
      /resolva (a|o) cálculo/i,
      /quem (foi|é) (o|a) presidente/i,
      /me conte uma piada/i,
      /traduza para o inglês/i,
      /como hackear/i,
      /crie um código/i,
      /fale sobre política/i,
      /fale sobre futebol/i
    ];

    for (const pattern of forbiddenDomains) {
      if (pattern.test(cleanInput)) {
        return {
          safe: false,
          isAttack: false,
          reason: '🚫 ESCOPO EXCLUSIVO: Sou a atendente virtual da Marmitas Brasília e meu funcionamento é 100% focado no atendimento e montagem do seu pedido de marmita! Não realizo tarefas externas como redações, códigos ou bate-papo geral.'
        };
      }
    }

    return { safe: true };
  }

  matchesAny(text, keywords) {
    return keywords.some(keyword => text.includes(keyword));
  }

  // ==========================================
  // PROCESSAMENTO DE LINGUAGEM NATURAL (CLIENT-SIDE NLP PIPELINE)
  // ==========================================
  processUserMessage(rawText) {
    // 1. Validação pelos Guardrails de Segurança Defensiva
    const securityCheck = this.validateSecurityGuardrails(rawText);
    if (!securityCheck.safe) {
      return {
        reply: securityCheck.reason,
        isGuardrailAlert: true
      };
    }

    // 2. Pré-processamento e Análise de NLP (Normalização e Classificação de Intenção)
    const norm = NLPProcessor.normalize(rawText);
    const intent = NLPProcessor.detectIntent(rawText);
    const entities = NLPProcessor.extractEntities(rawText);

    // Se estiver no fluxo de finalização e enviou endereço
    if (this.sessionState.step === 'ASKING_ADDRESS') {
      if (rawText.trim().length < 5) {
        return {
          reply: 'Por favor, informe um endereço completo válido (Rua, número e bairro) para calcularmos e realizarmos a entrega.'
        };
      }
      this.sessionState.address = rawText;
      this.sessionState.step = 'PAYMENT';
      return {
        reply: `📍 Endereço registrado: **${this.escapeHtml(rawText)}**\n\nQual será a forma de pagamento?\n1. **PIX**\n2. **Cartão (Débito/Crédito na entrega)**\n3. **Dinheiro**`
      };
    }

    if (this.sessionState.step === 'PAYMENT') {
      const payment = entities.paymentMethod || rawText;
      this.sessionState.payment = payment;
      this.sessionState.step = 'COMPLETED';
      return {
        reply: `🎉 Pedido registrado com sucesso!\n\nForma de Pagamento: **${this.escapeHtml(payment)}**.\nClique no botão verde **"Finalizar Pedido"** ao lado para enviar a comanda pronta no WhatsApp do restaurante ou confirmar.`
      };
    }

    // 3. Comandos baseados na Intenção detectada pelo NLP
    if (intent === 'RESTART') {
      this.cart = [];
      this.sessionState.step = 'GREETING';
      this.sessionState.pendingItem = null;
      return {
        reply: '🔄 Carrinho limpo e conversa reiniciada! Como posso te ajudar hoje? Diga o que deseja comer ou digite "cardápio".'
      };
    }

    if (intent === 'HELP') {
      return {
        reply: `💡 **Como posso te ajudar (Motor NLP Ativo):**
1. Peça marmitas em linguagem natural: *"Quero 2 bife de vaca bem passado sem cebola"*
2. Consulte o cardápio: *"ver cardápio"* ou *"o que tem pra hoje?"*
3. Finalize quando quiser: *"fechar pedido"* ou *"concluir"*
4. Personalize: altere temperos, acompanhamentos e pontos de carne à vontade!`
      };
    }

    if (intent === 'VIEW_MENU') {
      return {
        reply: this.formatMenuSummary(this.currentDayKey)
      };
    }

    if (intent === 'CHECKOUT') {
      return this.handleCheckoutSummary();
    }

    // 4. Reconhecimento de Prato com Algoritmo de Similaridade / NLP
    const matchedItem = this.findMatchingItemNLP(rawText);
    if (matchedItem) {
      return this.handleItemSelectionNLP(matchedItem, rawText, entities);
    }

    // Fallback inteligente
    return {
      reply: `Desculpe, não consegui identificar o prato desejado. Você gostaria de pedir algum prato do cardápio de hoje?\n\nExemplo de como pedir:\n👉 *"Quero 1 Bife de vaca ao ponto sem cebola e pouco sal"* ou digite **"cardápio"** para ver as opções do dia.`
    };
  }

  // Identifica prato usando NLP: correspondência exata, sinônimos e similaridade de Levenshtein
  findMatchingItemNLP(text) {
    const norm = NLPProcessor.normalize(text);
    const tokens = NLPProcessor.tokenize(norm).map(t => NLPProcessor.stem(t));
    const currentMenu = MENU_DATA[this.currentDayKey] || MENU_DATA['segunda'];

    // 1. Busca no cardápio de hoje
    for (const item of currentMenu) {
      const itemNorm = NLPProcessor.normalize(item.name);
      if (norm.includes(itemNorm) || norm.includes(NLPProcessor.normalize(item.id))) {
        return item;
      }

      // Token match
      const itemTokens = NLPProcessor.tokenize(itemNorm).map(t => NLPProcessor.stem(t));
      for (const t of tokens) {
        for (const it of itemTokens) {
          if (it.length > 3 && NLPProcessor.similarity(t, it) >= 0.8) {
            return item;
          }
        }
      }

      // Regras semânticas por tipo de carne
      if (item.meatType === 'bovino' && (norm.includes('bife') || norm.includes('vaca') || norm.includes('carne') || norm.includes('alcatra') || norm.includes('picanha'))) {
        return item;
      }
      if (item.meatType === 'suino' && (norm.includes('feijoada') || norm.includes('virado') || norm.includes('bisteca') || norm.includes('porco'))) {
        return item;
      }
      if (item.meatType === 'frango' && (norm.includes('frango') || norm.includes('strogonoff') || norm.includes('parmegiana') || norm.includes('sobrecoxa') || norm.includes('galinha'))) {
        return item;
      }
      if (item.meatType === 'peixe' && (norm.includes('peixe') || norm.includes('tilapia') || norm.includes('pescado'))) {
        return item;
      }
    }

    // 2. Busca nos outros dias caso o usuário mencione pratos de outro dia
    for (const day in MENU_DATA) {
      for (const item of MENU_DATA[day]) {
        const itemNorm = NLPProcessor.normalize(item.name);
        if (norm.includes(itemNorm)) {
          return item;
        }
      }
    }

    return null;
  }

  // Processa a seleção do item com entidades extraídas pelo NLP
  handleItemSelectionNLP(item, rawText, entities) {
    const quantity = entities.quantity || 1;
    let cookingPoint = null;

    if (item.meatType === 'bovino') {
      cookingPoint = entities.cookingPoint || 'Ao ponto (Padrão)';
    }

    // Combina modificações extraídas com observações manuais (obs: ...)
    const modifications = [...entities.modifiers];
    const obsMatch = rawText.match(/obs:?\s*(.*?)(?=\.|$)/i);
    if (obsMatch && obsMatch[1]) {
      modifications.push(`Obs: ${obsMatch[1].trim()}`);
    }

    const notes = modifications.length > 0 ? modifications.join(', ') : 'Tempero padrão da casa';

    const orderItem = {
      id: `${item.id}-${Date.now()}`,
      name: item.name,
      unitPrice: item.price,
      quantity: quantity,
      cookingPoint: cookingPoint,
      notes: notes,
      total: item.price * quantity
    };

    this.cart.push(orderItem);

    let reply = `🍽️ Adicionei ao seu pedido:\n- **${quantity}x ${item.name}**\n- Valor unitário: R$ ${item.price.toFixed(2).replace('.', ',')}`;
    if (cookingPoint) {
      reply += `\n- Ponto da carne: **${cookingPoint}**`;
    }
    reply += `\n- Ajuste de temperos: **${notes}**`;
    reply += `\n- Subtotal do item: **R$ ${orderItem.total.toFixed(2).replace('.', ',')}**`;

    const subtotal = this.calculateSubtotal();
    const total = subtotal + DELIVERY_FEE;

    reply += `\n\n📦 Seu pedido no momento tem **${this.cart.length} item(ns)** somando **R$ ${total.toFixed(2).replace('.', ',')}** (com taxa de entrega inclusa).\n\nDeseja adicionar mais alguma marmita ou quer **fechar o pedido** agora?`;

    return { reply, cartUpdated: true };
  }

  handleCheckoutSummary() {
    if (this.cart.length === 0) {
      return {
        reply: 'Seu carrinho ainda está vazio! Que tal dar uma olhada no cardápio de hoje e escolher sua refeição? Digite "cardápio" para ver.'
      };
    }

    const subtotal = this.calculateSubtotal();
    const total = subtotal + DELIVERY_FEE;

    let summary = `📋 **Resumo Geral do Pedido:**\n\n`;
    this.cart.forEach((item, index) => {
      summary += `${index + 1}. **${item.quantity}x ${item.name}** (R$ ${item.unitPrice.toFixed(2).replace('.', ',')} un.)\n`;
      if (item.cookingPoint) summary += `   🥩 Ponto: ${item.cookingPoint}\n`;
      summary += `   🧂 Ajustes: ${item.notes}\n`;
      summary += `   💵 Subtotal: R$ ${item.total.toFixed(2).replace('.', ',')}\n\n`;
    });

    summary += `------------------------------\n`;
    summary += `🍲 Subtotal: R$ ${subtotal.toFixed(2).replace('.', ',')}\n`;
    summary += `🛵 Taxa de Entrega: R$ ${DELIVERY_FEE.toFixed(2).replace('.', ',')}\n`;
    summary += `💰 **TOTAL A PAGAR: R$ ${total.toFixed(2).replace('.', ',')}**\n`;
    summary += `------------------------------\n\n`;

    this.sessionState.step = 'ASKING_ADDRESS';
    summary += `Por favor, digite seu **endereço completo com número e bairro** para realizarmos a entrega:`;

    return { reply: summary };
  }

  calculateSubtotal() {
    return this.cart.reduce((acc, item) => acc + item.total, 0);
  }

  formatMenuSummary(dayKey) {
    const list = MENU_DATA[dayKey] || MENU_DATA['segunda'];
    const dayNames = {
      segunda: 'Segunda-feira',
      terca: 'Terça-feira',
      quarta: 'Quarta-feira',
      quinta: 'Quinta-feira',
      sexta: 'Sexta-feira',
      sabado: 'Sábado',
      domingo: 'Domingo'
    };

    let text = `📅 **Cardápio de ${dayNames[dayKey]}:**\n\n`;
    list.forEach(item => {
      text += `🍱 **${item.name}** - R$ ${item.price.toFixed(2).replace('.', ',')}/unidade\n`;
      text += `   ${item.desc}\n\n`;
    });
    text += `🛵 *Taxa de entrega:* R$ ${DELIVERY_FEE.toFixed(2).replace('.', ',')} (fixa)\n`;
    text += `💬 *Dica:* Para pedir, diga por exemplo: *"Quero 1 ${list[0].name} sem cebola"*`;
    return text;
  }

  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}

// 3. CONTROLADOR DE INTERFACE DO USUÁRIO (UI CONTROLLER)
document.addEventListener('DOMContentLoaded', () => {
  const botEngine = new MarmitaBotEngine();

  // Elementos do DOM
  const chatMessages = document.getElementById('chatMessages');
  const chatForm = document.getElementById('chatForm');
  const userInput = document.getElementById('userInput');
  const daySelect = document.getElementById('daySelect');
  const menuList = document.getElementById('menuList');
  const menuDayLabel = document.getElementById('menuDayLabel');
  const cartItemsList = document.getElementById('cartItemsList');
  const cartEmpty = document.getElementById('cartEmpty');
  const cartSubtotal = document.getElementById('cartSubtotal');
  const cartDeliveryFee = document.getElementById('cartDeliveryFee');
  const cartTotal = document.getElementById('cartTotal');
  const cartCount = document.getElementById('cartCount');
  const btnCheckout = document.getElementById('btnCheckout');
  const btnClearChat = document.getElementById('btnClearChat');
  const btnToggleSidebar = document.getElementById('btnToggleSidebar');
  const sidebar = document.getElementById('sidebar');
  const quickActionsBar = document.getElementById('quickActionsBar');
  const charCounter = document.getElementById('charCounter');

  // Monitoramento dinâmico do contador de caracteres (limite 300)
  if (userInput && charCounter) {
    userInput.addEventListener('input', () => {
      const len = userInput.value.length;
      charCounter.textContent = `${len}/300`;

      if (len >= 300) {
        charCounter.classList.add('limit-reached');
        charCounter.classList.remove('limit-near');
      } else if (len >= 260) {
        charCounter.classList.add('limit-near');
        charCounter.classList.remove('limit-reached');
      } else {
        charCounter.classList.remove('limit-near', 'limit-reached');
      }
    });
  }

  // Renderizar cardápio na sidebar
  function renderSidebarMenu(dayKey) {
    const list = MENU_DATA[dayKey] || MENU_DATA['segunda'];
    menuList.innerHTML = '';
    menuDayLabel.textContent = dayKey;

    list.forEach(item => {
      const card = document.createElement('div');
      card.className = 'menu-card';
      card.innerHTML = `
        <div class="menu-card-title">
          <span>${item.name}</span>
          <span class="menu-card-price">R$ ${item.price.toFixed(2).replace('.', ',')}</span>
        </div>
        <div class="menu-card-desc">${item.desc}</div>
        <div class="menu-card-tags">
          <span class="mini-tag"><i class="fa-solid fa-tag"></i> Porção individual</span>
          ${item.meatType === 'bovino' ? '<span class="mini-tag">🥩 Escolha o ponto</span>' : ''}
          <span class="mini-tag">🧂 Temperos ajustáveis</span>
        </div>
      `;

      card.addEventListener('click', () => {
        userInput.value = `Quero 1 ${item.name} ao ponto sem cebola`;
        userInput.focus();
      });

      menuList.appendChild(card);
    });
  }

  // Atualizar visualização do carrinho
  function updateCartUI() {
    const count = botEngine.cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = count;

    if (botEngine.cart.length === 0) {
      cartEmpty.style.display = 'flex';
      cartItemsList.innerHTML = '';
      cartSubtotal.textContent = 'R$ 0,00';
      cartDeliveryFee.textContent = `R$ ${DELIVERY_FEE.toFixed(2).replace('.', ',')}`;
      cartTotal.textContent = `R$ ${DELIVERY_FEE.toFixed(2).replace('.', ',')}`;
      btnCheckout.disabled = true;
      return;
    }

    cartEmpty.style.display = 'none';
    cartItemsList.innerHTML = '';

    const subtotal = botEngine.calculateSubtotal();
    const total = subtotal + DELIVERY_FEE;

    botEngine.cart.forEach((item, index) => {
      const itemEl = document.createElement('div');
      itemEl.className = 'cart-item';
      itemEl.innerHTML = `
        <div class="cart-item-header">
          <span class="cart-item-name">${item.name}</span>
          <button class="cart-item-remove" data-index="${index}" title="Remover item">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
        <div class="cart-item-details">
          ${item.cookingPoint ? `• Ponto: ${item.cookingPoint}<br>` : ''}
          • ${item.notes}
        </div>
        <div class="cart-item-bottom">
          <span class="cart-item-qty">${item.quantity}x R$ ${item.unitPrice.toFixed(2).replace('.', ',')}</span>
          <span class="cart-item-price">R$ ${item.total.toFixed(2).replace('.', ',')}</span>
        </div>
      `;
      cartItemsList.appendChild(itemEl);
    });

    cartSubtotal.textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
    cartDeliveryFee.textContent = `R$ ${DELIVERY_FEE.toFixed(2).replace('.', ',')}`;
    cartTotal.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    btnCheckout.disabled = false;

    // Listeners de remoção
    document.querySelectorAll('.cart-item-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(btn.dataset.index);
        botEngine.cart.splice(idx, 1);
        updateCartUI();
        appendMessage('bot', '🗑️ Item removido do carrinho.');
      });
    });
  }

  // Adicionar mensagem na tela do chat
  function appendMessage(sender, text, isGuardrail = false) {
    const row = document.createElement('div');
    row.className = `message-row ${sender}`;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const formattedText = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');

    row.innerHTML = `
      <div class="msg-avatar">
        <i class="fa-solid ${sender === 'bot' ? 'fa-robot' : 'fa-user'}"></i>
      </div>
      <div class="msg-bubble ${isGuardrail ? 'guardrail-alert' : ''}">
        ${isGuardrail ? '<div class="guardrail-header"><i class="fa-solid fa-triangle-exclamation"></i> Alerta de Segurança (Guardrail)</div>' : ''}
        ${formattedText}
        <div class="msg-time">${timeStr}</div>
      </div>
    `;

    chatMessages.appendChild(row);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Envio de mensagem
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = userInput.value.trim();
    if (!text) return;

    appendMessage('user', text);
    userInput.value = '';
    if (charCounter) {
      charCounter.textContent = '0/300';
      charCounter.classList.remove('limit-near', 'limit-reached');
    }

    // Processar pelo motor inteligente com guardrails e NLP
    setTimeout(() => {
      const result = botEngine.processUserMessage(text);
      appendMessage('bot', result.reply, result.isGuardrailAlert || false);
      if (result.cartUpdated) {
        updateCartUI();
      }
    }, 300);
  });

  // Ações rápidas
  quickActionsBar.addEventListener('click', (e) => {
    if (e.target.classList.contains('quick-pill')) {
      const action = e.target.dataset.action;
      if (action === 'ver_cardapio') {
        appendMessage('user', 'Ver cardápio');
        appendMessage('bot', botEngine.formatMenuSummary(botEngine.currentDayKey));
      } else if (action === 'fechar_pedido') {
        appendMessage('user', 'Fechar pedido');
        const res = botEngine.handleCheckoutSummary();
        appendMessage('bot', res.reply);
      } else if (action === 'ajuda') {
        appendMessage('user', 'Como funciona');
        const res = botEngine.processUserMessage('ajuda');
        appendMessage('bot', res.reply);
      } else if (action === 'limpar') {
        appendMessage('user', 'Reiniciar pedido');
        const res = botEngine.processUserMessage('limpar');
        appendMessage('bot', res.reply);
        updateCartUI();
      }
    }
  });

  // Mudança de dia no seletor
  daySelect.addEventListener('change', (e) => {
    const selected = e.target.value;
    botEngine.setDay(selected);
    renderSidebarMenu(botEngine.currentDayKey);
    appendMessage('bot', `🗓️ Cardápio alternado para **${selected.toUpperCase()}**.\n` + botEngine.formatMenuSummary(botEngine.currentDayKey));
  });

  // Botão Limpar / Reiniciar do topo
  btnClearChat.addEventListener('click', () => {
    chatMessages.innerHTML = '';
    botEngine.cart = [];
    botEngine.sessionState.step = 'GREETING';
    updateCartUI();
    initGreeting();
  });

  // Toggle do menu em telas pequenas
  btnToggleSidebar.addEventListener('click', () => {
    sidebar.classList.toggle('active');
  });

  // Checkout WhatsApp
  btnCheckout.addEventListener('click', () => {
    if (botEngine.cart.length === 0) return;

    const subtotal = botEngine.calculateSubtotal();
    const total = subtotal + DELIVERY_FEE;

    let msg = `*🍱 NOVO PEDIDO - MARMITAS BRASÍLIA*\n`;
    msg += `_Atendimento Digital via Chatbot Web_\n\n`;
    botEngine.cart.forEach((item, i) => {
      msg += `*${i + 1}. ${item.quantity}x ${item.name}*\n`;
      if (item.cookingPoint) msg += `🥩 Ponto: ${item.cookingPoint}\n`;
      msg += `🧂 Temperos/Obs: ${item.notes}\n`;
      msg += `💵 Subtotal: R$ ${item.total.toFixed(2).replace('.', ',')}\n\n`;
    });

    msg += `-----------------------------\n`;
    msg += `🍲 Subtotal: R$ ${subtotal.toFixed(2).replace('.', ',')}\n`;
    msg += `🛵 Taxa de Entrega (DF): R$ ${DELIVERY_FEE.toFixed(2).replace('.', ',')}\n`;
    msg += `💰 *TOTAL A PAGAR: R$ ${total.toFixed(2).replace('.', ',')}*\n`;

    if (botEngine.sessionState.address) {
      msg += `📍 *Endereço no DF:* ${botEngine.sessionState.address}\n`;
    }
    if (botEngine.sessionState.payment) {
      msg += `💳 *Forma de Pagamento:* ${botEngine.sessionState.payment}\n`;
    }

    msg += `\n_Pedido gerado 100% no navegador (Client-Side, sem LLM)._`;

    const whatsappUrl = `https://wa.me/5561999999999?text=${encodeURIComponent(msg)}`;
    window.open(whatsappUrl, '_blank');
  });

  // Mensagem inicial de boas-vindas
  function initGreeting() {
    const greeting = `👋 Olá! Seja muito bem-vindo(a) à **Marmitas Brasília**!
Eu sou a **Candanga**, sua assistente virtual de atendimento inteligente aqui no DF.

⚡ **Chatbot 100% Client-Side:** Todo o processamento funciona diretamente no seu navegador usando algoritmos de NLP e Máquina de Estados, **sem depender de LLM ou servidores externos**!

🍛 **Como posso montar seu pedido hoje?**
• Escolha qualquer marmita do cardápio pelo nome
• Ajuste temperos à vontade (ex: *sem cebola*, *pouco sal*, *sem salada*, *molho à parte*)
• Defina o ponto da sua carne (*ao ponto*, *bem passada*, *mal passada*)
• Informe a quantidade (*"quero 2 marmitas..."*)

Diga o que você quer saborear ou clique em **"📋 Ver Cardápio"** para ver as opções do dia!`;

    appendMessage('bot', greeting);
  }

  // Inicialização
  renderSidebarMenu(botEngine.currentDayKey);
  updateCartUI();
  initGreeting();
});
