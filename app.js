/**
 * MARMITAS BRASÍLIA - SISTEMA DE ATENDIMENTO & VITRINE GOURMET (100% CLIENT-SIDE)
 * Chatbot Conversacional com NLP Determinístico e Vitrine Interativa
 * SEM LLM / SEM APIs EXTERNAS / ZERO LATÊNCIA
 */

// ==========================================
// 1. MÓDULO DE PROCESSAMENTO DE LINGUAGEM NATURAL (NLP)
// ==========================================
class NLPProcessor {
  // Normalização e remoção de acentos (NFD)
  static normalize(text) {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  // Tokenização
  static tokenize(text) {
    const norm = this.normalize(text);
    return norm.match(/[\wÀ-ÿ]+/g) || [];
  }

  // Distância de Levenshtein (tolerância a erros de digitação)
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
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

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

  // Stemming simplificado em português
  static stem(word) {
    let w = this.normalize(word);
    if (w.endsWith('oes')) return w.slice(0, -3) + 'ao';
    if (w.endsWith('res') || w.endsWith('zes') || w.endsWith('nes')) return w.slice(0, -2);
    if (w.endsWith('is') && w.length > 3) return w.slice(0, -2) + 'l';
    if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) return w.slice(0, -1);
    return w;
  }

  // Reconhecimento de Intenção (Intent Classification)
  static detectIntent(text) {
    const norm = this.normalize(text);
    const tokens = this.tokenize(norm).map(t => this.stem(t));

    const intents = {
      GREETING: ['ola', 'oi', 'opa', 'bom dia', 'boa tarde', 'boa noite', 'e ai'],
      VIEW_MENU: ['cardapio', 'menu', 'prato', 'opcao', 'comida', 'almoco', 'refeicao', 'hoje', 'vitrine'],
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

  // Reconhecimento de Entidades Nomeadas (NER)
  static extractEntities(text) {
    const norm = this.normalize(text);
    const entities = {
      quantity: 1,
      cookingPoint: null,
      modifiers: [],
      paymentMethod: null
    };

    // 1. Quantidade
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

    // 2. Ponto da Carne
    if (/bem\s*passad[ao]|bem\s*tostad[ao]|torrad[ao]/.test(norm)) {
      entities.cookingPoint = 'Bem passado';
    } else if (/mal\s*passad[ao]|sangrand[ao]/.test(norm)) {
      entities.cookingPoint = 'Mal passado';
    } else if (/ao\s*ponto|ponto/.test(norm)) {
      entities.cookingPoint = 'Ao ponto';
    }

    // 3. Modificações de Ingredientes e Temperos
    const ingredientPatterns = [
      { regex: /(?:sem|tira|retira)\s+(cebola|cebolas)/i, tag: 'Sem cebola' },
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

    // 4. Pagamento
    if (norm.includes('pix')) entities.paymentMethod = 'PIX';
    else if (norm.includes('cartao') || norm.includes('credito') || norm.includes('debito')) entities.paymentMethod = 'Cartão na Entrega';
    else if (norm.includes('dinheiro')) entities.paymentMethod = 'Dinheiro';

    return entities;
  }
}

// ==========================================
// 2. BASE DE DADOS GASTRONÔMICA DE BRASÍLIA
// ==========================================
const MENU_DATA = {
  segunda: [
    { id: 'virado', name: 'Virado Tradicional do Chef', price: 23.00, desc: 'Bisteca suína dourada, tutu cremoso de feijão, couve refogada no alho e ovo frito caipira.', meatType: 'suino', icon: '🥩', fit: false, cals: '620 kcal' },
    { id: 'bife_vaca', name: 'Bife Bovino Acebolado', price: 26.00, desc: 'Alcatra grelhada com cebola dourada na manteiga, arroz soltinho, feijão carioca e salada fresca.', meatType: 'bovino', icon: '🥩', fit: false, cals: '580 kcal' },
    { id: 'frango_grelhado', name: 'Filé de Frango Grelhado Fit', price: 21.00, desc: 'Peito de frango marinado em ervas de Brasília, arroz integral e mix de legumes cozidos no vapor.', meatType: 'frango', icon: '🍗', fit: true, cals: '420 kcal' }
  ],
  terca: [
    { id: 'bife_vaca', name: 'Contrafilé Grelhado Gourmet', price: 27.00, desc: 'Contrafilé alto e suculento, arroz branco, feijão especial, vinagrete caseiro e farofa crocante.', meatType: 'bovino', icon: '🥩', fit: false, cals: '640 kcal' },
    { id: 'panqueca_carne', name: 'Panquecas Artesanais ao Pomodoro', price: 22.00, desc: 'Duas panquecas finas de carne moída com molho pomodoro rústico e queijo gratinado ao forno.', meatType: 'bovino', icon: '🥞', fit: false, cals: '530 kcal' },
    { id: 'frango_parmegiana', name: 'Parmegiana de Frango Crocante', price: 25.00, desc: 'Filé de frango empanado artesanal, coberto com queijo derretido, molho caseiro e batatas rústicas.', meatType: 'frango', icon: '🍗', fit: false, cals: '690 kcal' }
  ],
  quarta: [
    { id: 'feijoada', name: 'Feijoada Completa Tradicional', price: 29.00, desc: 'Carnes nobres selecionadas, arroz branco, couve fininha no alho, farofa de bacon e laranja fresca.', meatType: 'suino', icon: '🍲', fit: false, cals: '750 kcal' },
    { id: 'bife_vaca', name: 'Bife de Vaca Acebolado', price: 26.00, desc: 'Alcatra na chapa com cebolas glaceadas, arroz branco, feijão e salada verde.', meatType: 'bovino', icon: '🥩', fit: false, cals: '580 kcal' },
    { id: 'frango_assado', name: 'Sobrecoxa Dourada ao Forno', price: 22.00, desc: 'Frango com pele crocante temperado com limão e alecrim, batatas coradas e arroz soltinho.', meatType: 'frango', icon: '🍗', fit: false, cals: '510 kcal' }
  ],
  quinta: [
    { id: 'lasanha', name: 'Lasanha à Bolonhesa Clássica', price: 25.00, desc: 'Massa artesanal intercalada com molho rico de carne, bechamel aveludado e bastante muçarela.', meatType: 'bovino', icon: '🍝', fit: false, cals: '680 kcal' },
    { id: 'bife_vaca', name: 'Bife de Alcatra à Milanesa', price: 27.00, desc: 'Empanado sequinho e crocante, purê de batata cremoso, arroz branco e feijão carioca.', meatType: 'bovino', icon: '🥩', fit: false, cals: '650 kcal' },
    { id: 'strogonoff_frango', name: 'Strogonoff Cremoso de Frango', price: 23.00, desc: 'Cubos de peito de frango com champignon ao molho aveludado, arroz branco e batata palha fina.', meatType: 'frango', icon: '🍲', fit: false, cals: '590 kcal' }
  ],
  sexta: [
    { id: 'peixe_grelhado', name: 'Filé de Tilápia com Ervas Nobres', price: 28.00, desc: 'Tilápia fresca grelhada no azeite extravirgem, purê de mandioquinha, arroz e salada de folhas.', meatType: 'peixe', icon: '🐟', fit: true, cals: '410 kcal' },
    { id: 'bife_vaca', name: 'Bife Bovino Acebolado Especial', price: 26.00, desc: 'Alcatra macia na chapa, feijão preto temperado, arroz branco e salada colorida.', meatType: 'bovino', icon: '🥩', fit: false, cals: '580 kcal' },
    { id: 'feijoada_light', name: 'Feijoada Light Brasília', price: 29.00, desc: 'Feijoada suave sem excesso de gordura, lombo desfiado, couve no vapor e arroz integral.', meatType: 'suino', icon: '🍲', fit: true, cals: '520 kcal' }
  ],
  sabado: [
    { id: 'bife_picanha', name: 'Picanha na Brasa Brasília', price: 36.00, desc: 'Fatias nobres de picanha, arroz biro-biro com batata palha, farofa de ovos e vinagrete.', meatType: 'bovino', icon: '🥩', fit: false, cals: '720 kcal' },
    { id: 'feijoada_especial', name: 'Feijoada Premium de Sábado', price: 34.00, desc: 'Feijoada completa com torresmo à pururuca, bisteca grelhada, vinagrete, couve e laranja.', meatType: 'suino', icon: '🍲', fit: false, cals: '810 kcal' },
    { id: 'strogonoff_carne', name: 'Strogonoff de Filé Mignon', price: 28.00, desc: 'Tiras de carne nobre com cogumelos frescos de Brasília, arroz e batata palha artesanal.', meatType: 'bovino', icon: '🍲', fit: false, cals: '630 kcal' }
  ],
  domingo: [
    { id: 'frango_assado_familia', name: 'Frango Assado Especial de Domingo', price: 32.00, desc: 'Marinado no limão siciliano e ervas finas, maionese artesanal da casa e farofa rica.', meatType: 'frango', icon: '🍗', fit: false, cals: '640 kcal' },
    { id: 'bife_vaca', name: 'Bife ao Molho Madeira & Champignon', price: 34.00, desc: 'Filé bovino macio glaceado em molho madeira encorpado, arroz soltinho e purê cremoso.', meatType: 'bovino', icon: '🥩', fit: false, cals: '610 kcal' },
    { id: 'massa_artesanal', name: 'Nhoque Recheado ao Sugo Rústico', price: 27.00, desc: 'Nhoque artesanal de batata recheado com queijo, molho de tomate pelati e manjericão fresco.', meatType: 'vegetariano', icon: '🍝', fit: true, cals: '490 kcal' }
  ]
};

const DELIVERY_FEE = 6.00;

// ==========================================
// 3. ENGINE DO CHATBOT & GESTÃO DO CARRINHO
// ==========================================
class MarmitaBotEngine {
  constructor() {
    this.cart = [];
    this.currentDayKey = this.getTodayKey();
    this.sessionState = {
      step: 'GREETING',
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

  validateSecurityGuardrails(input) {
    if (!input || typeof input !== 'string') {
      return { safe: false, reason: 'Entrada vazia ou inválida.' };
    }

    const trimmed = input.trim();

    // Limite de 300 caracteres
    if (trimmed.length > 300) {
      return {
        safe: false,
        reason: '⚠️ Mensagem muito longa. O limite máximo é de 300 caracteres para segurança e economia de processamento.'
      };
    }

    const cleanInput = trimmed.toLowerCase();

    // Defesa contra Exfiltração de Tokens e Credenciais
    const tokenPatterns = [
      /(api[_-]?key|token|bearer|secret|auth|credencial|password|senha|session)/i,
      /ghp_[a-zA-Z0-9]{20,}/,
      /sk-[a-zA-Z0-9]{20,}/
    ];

    for (const pattern of tokenPatterns) {
      if (pattern.test(cleanInput)) {
        return {
          safe: false,
          isAttack: true,
          reason: '🛡️ BLOQUEIO DE SEGURANÇA: Menção a credenciais ou chaves detectada. A Marmitas Brasília opera 100% no navegador sem dados de autenticação de terceiros.'
        };
      }
    }

    // Injeção XSS & Jailbreak
    const injectionPatterns = [
      /ignore (all )?(previous|prior) (instructions|directions|prompts)/i,
      /you are now in (dan|developer|god) mode/i,
      /reveal (your )?(system prompt|instructions)/i,
      /mostre (seu|o) (prompt de sistema|instruções secretas)/i,
      /esqueça (todas as )?(suas )?(instruções|regras)/i,
      /jailbreak/i,
      /sudo /i,
      /<script[\s\S]*?>[\s\S]*?<\/script>/i,
      /javascript:/i,
      /onerror\s*=/i,
      /onload\s*=/i,
      /eval\s*\(/i,
      /document\.cookie/i
    ];

    for (const pattern of injectionPatterns) {
      if (pattern.test(cleanInput)) {
        return {
          safe: false,
          isAttack: true,
          reason: '🚨 TENTATIVA DE JAILBREAK/INJEÇÃO BLOQUEADA: Este chatbot opera com máquina de estados imutável dedicada exclusivamente a marmitas no DF.'
        };
      }
    }

    // Domínio restrito
    const forbiddenDomains = [
      /escreva (um|uma) (poema|código|redação|script|história)/i,
      /qual é a capital /i,
      /resolva (a|o) cálculo/i,
      /quem (foi|é) (o|a) presidente/i,
      /me conte uma piada/i,
      /como hackear/i,
      /fale sobre política/i
    ];

    for (const pattern of forbiddenDomains) {
      if (pattern.test(cleanInput)) {
        return {
          safe: false,
          isAttack: false,
          reason: '🚫 ESCOPO EXCLUSIVO: Sou a atendente da Marmitas Brasília e meu funcionamento é 100% focado no cardápio e no fechamento do seu almoço ou jantar!'
        };
      }
    }

    return { safe: true };
  }

  processUserMessage(rawText) {
    const securityCheck = this.validateSecurityGuardrails(rawText);
    if (!securityCheck.safe) {
      return { reply: securityCheck.reason, isGuardrailAlert: true };
    }

    const intent = NLPProcessor.detectIntent(rawText);
    const entities = NLPProcessor.extractEntities(rawText);

    // Fluxo de Endereço no DF
    if (this.sessionState.step === 'ASKING_ADDRESS') {
      if (rawText.trim().length < 5) {
        return {
          reply: 'Por favor, informe um endereço completo no DF (Ex: Asa Sul, Bloco X ou Águas Claras, Rua Y) para realizarmos a entrega.'
        };
      }
      this.sessionState.address = rawText;
      this.sessionState.step = 'PAYMENT';
      return {
        reply: `📍 Endereço registrado em Brasília: **${this.escapeHtml(rawText)}**\n\nQual será a forma de pagamento?\n1. **PIX**\n2. **Cartão (Débito/Crédito na entrega)**\n3. **Dinheiro**`
      };
    }

    // Fluxo de Pagamento
    if (this.sessionState.step === 'PAYMENT') {
      const payment = entities.paymentMethod || rawText;
      this.sessionState.payment = payment;
      this.sessionState.step = 'COMPLETED';
      return {
        reply: `🎉 Pedido registrado com sucesso na **Marmitas Brasília**!\n\nForma de Pagamento: **${this.escapeHtml(payment)}**.\nClique no botão verde **"Finalizar Pedido no WhatsApp"** na sua comanda para enviar o pedido pronto para nossa cozinha!`
      };
    }

    // Comandos de Intenção
    if (intent === 'RESTART') {
      this.cart = [];
      this.sessionState.step = 'GREETING';
      return { reply: '🔄 Comanda limpa e conversa reiniciada! Como posso te ajudar hoje na Marmitas Brasília? Escolha um prato ou digite "cardápio".' };
    }

    if (intent === 'HELP') {
      return {
        reply: `💡 **Como pedir na Marmitas Brasília:**
1. **Pelo Chat:** Digite *"Quero 2 bife bovino bem passado sem cebola"*
2. **Pela Vitrine:** Clique em **+ Adicionar** em qualquer prato acima para escolher temperos e ponto da carne
3. **Cardápio do dia:** Digite *"cardápio"* ou alterne os dias da semana no topo
4. **Finalizar:** Digite *"fechar pedido"* ou clique na sacola de compras!`
      };
    }

    if (intent === 'VIEW_MENU') {
      return { reply: this.formatMenuSummary(this.currentDayKey) };
    }

    if (intent === 'CHECKOUT') {
      return this.handleCheckoutSummary();
    }

    // Reconhecimento de prato por NLP
    const matchedItem = this.findMatchingItemNLP(rawText);
    if (matchedItem) {
      return this.handleItemSelectionNLP(matchedItem, rawText, entities);
    }

    return {
      reply: `Desculpe, não consegui identificar o prato. Você gostaria de escolher alguma das opções da vitrine de hoje?\n\nExemplo:\n👉 *"Quero 1 Bife bovino ao ponto sem cebola"* ou digite **"cardápio"**.`
    };
  }

  findMatchingItemNLP(text) {
    const norm = NLPProcessor.normalize(text);
    const tokens = NLPProcessor.tokenize(norm).map(t => NLPProcessor.stem(t));
    const currentMenu = MENU_DATA[this.currentDayKey] || MENU_DATA['segunda'];

    for (const item of currentMenu) {
      const itemNorm = NLPProcessor.normalize(item.name);
      if (norm.includes(itemNorm) || norm.includes(NLPProcessor.normalize(item.id))) {
        return item;
      }

      const itemTokens = NLPProcessor.tokenize(itemNorm).map(t => NLPProcessor.stem(t));
      for (const t of tokens) {
        for (const it of itemTokens) {
          if (it.length > 3 && NLPProcessor.similarity(t, it) >= 0.8) {
            return item;
          }
        }
      }

      if (item.meatType === 'bovino' && (norm.includes('bife') || norm.includes('vaca') || norm.includes('carne') || norm.includes('alcatra') || norm.includes('contrafile') || norm.includes('picanha'))) {
        return item;
      }
      if (item.meatType === 'suino' && (norm.includes('feijoada') || norm.includes('virado') || norm.includes('bisteca') || norm.includes('porco'))) {
        return item;
      }
      if (item.meatType === 'frango' && (norm.includes('frango') || norm.includes('strogonoff') || norm.includes('parmegiana') || norm.includes('sobrecoxa'))) {
        return item;
      }
      if (item.meatType === 'peixe' && (norm.includes('peixe') || norm.includes('tilapia') || norm.includes('pescado'))) {
        return item;
      }
    }

    return null;
  }

  handleItemSelectionNLP(item, rawText, entities) {
    const quantity = entities.quantity || 1;
    let cookingPoint = null;

    if (item.meatType === 'bovino') {
      cookingPoint = entities.cookingPoint || 'Ao ponto (Padrão)';
    }

    const modifications = [...entities.modifiers];
    const obsMatch = rawText.match(/obs:?\s*(.*?)(?=\.|$)/i);
    if (obsMatch && obsMatch[1]) {
      modifications.push(`Obs: ${obsMatch[1].trim()}`);
    }

    const notes = modifications.length > 0 ? modifications.join(', ') : 'Tempero padrão artesanal';

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

    let reply = `🍽️ Adicionado à sua comanda:\n- **${quantity}x ${item.name}**\n- Valor unitário: R$ ${item.price.toFixed(2).replace('.', ',')}`;
    if (cookingPoint) {
      reply += `\n- Ponto da carne: **${cookingPoint}**`;
    }
    reply += `\n- Ajuste de temperos: **${notes}**`;
    reply += `\n- Subtotal do item: **R$ ${orderItem.total.toFixed(2).replace('.', ',')}**`;

    const subtotal = this.calculateSubtotal();
    const total = subtotal + DELIVERY_FEE;

    reply += `\n\n📦 Sua comanda possui **${this.cart.length} item(ns)** somando **R$ ${total.toFixed(2).replace('.', ',')}** (com entrega no DF inclusa).\n\nDeseja adicionar mais marmitas ou quer **fechar o pedido** agora?`;

    return { reply, cartUpdated: true };
  }

  handleCheckoutSummary() {
    if (this.cart.length === 0) {
      return {
        reply: 'Sua comanda ainda está vazia! Escolha algum prato da nossa vitrine gourmet ou digite "cardápio" para começar.'
      };
    }

    const subtotal = this.calculateSubtotal();
    const total = subtotal + DELIVERY_FEE;

    let summary = `📋 **Resumo da Comanda - Marmitas Brasília:**\n\n`;
    this.cart.forEach((item, index) => {
      summary += `${index + 1}. **${item.quantity}x ${item.name}** (R$ ${item.unitPrice.toFixed(2).replace('.', ',')} un.)\n`;
      if (item.cookingPoint) summary += `   🥩 Ponto: ${item.cookingPoint}\n`;
      summary += `   🧂 Temperos: ${item.notes}\n`;
      summary += `   💵 Subtotal: R$ ${item.total.toFixed(2).replace('.', ',')}\n\n`;
    });

    summary += `------------------------------\n`;
    summary += `🍲 Subtotal: R$ ${subtotal.toFixed(2).replace('.', ',')}\n`;
    summary += `🛵 Taxa de Entrega (DF): R$ ${DELIVERY_FEE.toFixed(2).replace('.', ',')}\n`;
    summary += `💰 **TOTAL A PAGAR: R$ ${total.toFixed(2).replace('.', ',')}**\n`;
    summary += `------------------------------\n\n`;

    this.sessionState.step = 'ASKING_ADDRESS';
    summary += `Por favor, digite seu **endereço no DF (Bairro, quadra/rua e número)** para realizarmos a entrega:`;

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

    let text = `📅 **Cardápio de ${dayNames[dayKey]} em Brasília:**\n\n`;
    list.forEach(item => {
      text += `${item.icon} **${item.name}** - R$ ${item.price.toFixed(2).replace('.', ',')}\n`;
      text += `   _${item.desc}_\n\n`;
    });
    text += `🛵 *Taxa de entrega:* R$ ${DELIVERY_FEE.toFixed(2).replace('.', ',')} (fixa no DF)\n`;
    text += `💬 Peça digitando: *"Quero 1 ${list[0].name} sem cebola"*`;
    return text;
  }

  escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}

// ==========================================
// 4. CONTROLADOR DA UI (VITRINE GOURMET & CHAT)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const botEngine = new MarmitaBotEngine();

  // Elementos do DOM
  const gourmetGrid = document.getElementById('gourmetGrid');
  const showcaseDayTitle = document.getElementById('showcaseDayTitle');
  const itemsCountBadge = document.getElementById('itemsCountBadge');
  const dayChips = document.getElementById('dayChips');
  const categoryFilters = document.getElementById('categoryFilters');

  // Chat Elements
  const chatSidebar = document.getElementById('chatSidebar');
  const chatMessages = document.getElementById('chatMessages');
  const chatForm = document.getElementById('chatForm');
  const userInput = document.getElementById('userInput');
  const charCounter = document.getElementById('charCounter');
  const btnOpenChat = document.getElementById('btnOpenChat');
  const btnCloseChat = document.getElementById('btnCloseChat');
  const btnClearChat = document.getElementById('btnClearChat');
  const quickActionsBar = document.getElementById('quickActionsBar');

  // Cart Drawer Elements
  const cartDrawer = document.getElementById('cartDrawer');
  const btnToggleCart = document.getElementById('btnToggleCart');
  const btnCloseCart = document.getElementById('btnCloseCart');
  const cartItemsList = document.getElementById('cartItemsList');
  const cartEmpty = document.getElementById('cartEmpty');
  const cartSubtotal = document.getElementById('cartSubtotal');
  const cartDeliveryFee = document.getElementById('cartDeliveryFee');
  const cartTotal = document.getElementById('cartTotal');
  const cartCount = document.getElementById('cartCount');
  const navCartCount = document.getElementById('navCartCount');
  const btnCheckout = document.getElementById('btnCheckout');

  // Modal Customização
  const customModal = document.getElementById('customModal');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const modalEmoji = document.getElementById('modalEmoji');
  const modalDishName = document.getElementById('modalDishName');
  const modalDishPrice = document.getElementById('modalDishPrice');
  const meatPointGroup = document.getElementById('meatPointGroup');
  const modalQtyDisplay = document.getElementById('modalQtyDisplay');
  const btnQtyMinus = document.getElementById('btnQtyMinus');
  const btnQtyPlus = document.getElementById('btnQtyPlus');
  const modalTotalPrice = document.getElementById('modalTotalPrice');
  const btnConfirmAdd = document.getElementById('btnConfirmAdd');

  let currentCategory = 'all';
  let modalSelectedItem = null;
  let modalQty = 1;

  // Renderizar Vitrine Gourmet com Filtros
  function renderGourmetShowcase(dayKey, category = 'all') {
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

    showcaseDayTitle.textContent = `Cardápio Gourmet • ${dayNames[dayKey] || 'Hoje'}`;

    // Filtragem por categoria
    let filtered = list;
    if (category === 'fit') {
      filtered = list.filter(item => item.fit);
    } else if (category !== 'all') {
      filtered = list.filter(item => item.meatType === category);
    }

    itemsCountBadge.textContent = `${filtered.length} prato(s) fresco(s)`;
    gourmetGrid.innerHTML = '';

    if (filtered.length === 0) {
      gourmetGrid.innerHTML = `
        <div style="grid-column: 1/-1; padding: 3rem; text-align: center; color: var(--slate-500); background: var(--white); border-radius: var(--radius-lg); border: 1.5px dashed var(--slate-200);">
          <i class="fa-solid fa-utensils" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
          <p>Nenhum prato encontrado nesta categoria para ${dayNames[dayKey]}.</p>
          <small>Selecione "Todos os Pratos" para ver o cardápio completo do dia.</small>
        </div>
      `;
      return;
    }

    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = 'gourmet-card';
      card.innerHTML = `
        <div class="card-media">
          <div class="card-top-tags">
            <span class="tag-day">${dayNames[dayKey]}</span>
            <span class="tag-meat">${item.fit ? '🥗 Linha Fit' : item.meatType.toUpperCase()}</span>
          </div>
          <span class="card-food-art">${item.icon}</span>
        </div>
        <div class="card-content">
          <h4 class="card-title">${item.name}</h4>
          <p class="card-desc">${item.desc}</p>
          <div class="card-perks">
            <span class="perk-pill"><i class="fa-solid fa-fire"></i> ${item.cals}</span>
            ${item.meatType === 'bovino' ? '<span class="perk-pill">🥩 Ponto à escolha</span>' : ''}
            <span class="perk-pill">🧂 Sem conservantes</span>
          </div>
          <div class="card-footer">
            <div class="price-box">
              <span class="price-label">Valor unitário</span>
              <span class="price-val">R$ ${item.price.toFixed(2).replace('.', ',')}</span>
            </div>
            <button class="btn-add-card" data-id="${item.id}">
              <i class="fa-solid fa-plus"></i> Adicionar
            </button>
          </div>
        </div>
      `;

      // Clique no botão Adicionar abre o modal de customização
      card.querySelector('.btn-add-card').addEventListener('click', () => {
        openCustomModal(item);
      });

      gourmetGrid.appendChild(card);
    });
  }

  // Modal de Customização do Prato
  function openCustomModal(item) {
    modalSelectedItem = item;
    modalQty = 1;
    modalEmoji.textContent = item.icon;
    modalDishName.textContent = item.name;
    modalDishPrice.textContent = `R$ ${item.price.toFixed(2).replace('.', ',')}`;

    // Mostra seletor de ponto apenas para bovinos
    meatPointGroup.style.display = item.meatType === 'bovino' ? 'flex' : 'none';

    // Reset checkboxes
    document.querySelectorAll('.custom-checkboxes input').forEach(chk => chk.checked = false);
    modalQtyDisplay.textContent = modalQty;
    updateModalTotal();

    customModal.classList.add('open');
  }

  function updateModalTotal() {
    if (!modalSelectedItem) return;
    const total = modalSelectedItem.price * modalQty;
    modalTotalPrice.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
  }

  btnQtyMinus.addEventListener('click', () => {
    if (modalQty > 1) {
      modalQty--;
      modalQtyDisplay.textContent = modalQty;
      updateModalTotal();
    }
  });

  btnQtyPlus.addEventListener('click', () => {
    if (modalQty < 20) {
      modalQty++;
      modalQtyDisplay.textContent = modalQty;
      updateModalTotal();
    }
  });

  btnCloseModal.addEventListener('click', () => {
    customModal.classList.remove('open');
  });

  customModal.addEventListener('click', (e) => {
    if (e.target === customModal) customModal.classList.remove('open');
  });

  // Confirmação de Adição no Modal
  btnConfirmAdd.addEventListener('click', () => {
    if (!modalSelectedItem) return;

    let cookingPoint = null;
    if (modalSelectedItem.meatType === 'bovino') {
      const selectedPoint = document.querySelector('input[name="meatPoint"]:checked');
      cookingPoint = selectedPoint ? selectedPoint.value : 'Ao ponto';
    }

    const modifications = [];
    document.querySelectorAll('.custom-checkboxes input:checked').forEach(chk => {
      modifications.push(chk.value);
    });

    const notes = modifications.length > 0 ? modifications.join(', ') : 'Tempero padrão da casa';

    const orderItem = {
      id: `${modalSelectedItem.id}-${Date.now()}`,
      name: modalSelectedItem.name,
      unitPrice: modalSelectedItem.price,
      quantity: modalQty,
      cookingPoint: cookingPoint,
      notes: notes,
      total: modalSelectedItem.price * modalQty
    };

    botEngine.cart.push(orderItem);
    updateCartUI();
    customModal.classList.remove('open');
    cartDrawer.classList.add('open');

    // Notificação sutil no chat
    appendMessage('bot', `🍱 Adicionei **${modalQty}x ${modalSelectedItem.name}** à sua comanda! Deseja mais alguma opção ou quer fechar o pedido?`);
  });

  // Atualizar Comanda / Carrinho
  function updateCartUI() {
    const count = botEngine.cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = count;
    navCartCount.textContent = count;

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
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index);
        botEngine.cart.splice(idx, 1);
        updateCartUI();
        appendMessage('bot', '🗑️ Item removido da comanda.');
      });
    });
  }

  // Adicionar Mensagem ao Chat
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

  // Envio de Mensagem no Chat
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = userInput.value.trim();
    if (!text) return;

    appendMessage('user', text);
    userInput.value = '';
    charCounter.textContent = '0/300';

    setTimeout(() => {
      const result = botEngine.processUserMessage(text);
      appendMessage('bot', result.reply, result.isGuardrailAlert || false);
      if (result.cartUpdated) {
        updateCartUI();
      }
    }, 250);
  });

  // Contador de caracteres
  userInput.addEventListener('input', () => {
    const len = userInput.value.length;
    charCounter.textContent = `${len}/300`;
  });

  // Alternar Dias na Vitrine
  dayChips.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;

    document.querySelectorAll('.day-chips .chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');

    const selectedDay = chip.dataset.day;
    botEngine.setDay(selectedDay);
    renderGourmetShowcase(botEngine.currentDayKey, currentCategory);
    appendMessage('bot', `🗓️ Vitrine alternada para **${selectedDay.toUpperCase()}** no DF!`);
  });

  // Filtros de Categoria
  categoryFilters.addEventListener('click', (e) => {
    const pill = e.target.closest('.cat-pill');
    if (!pill) return;

    document.querySelectorAll('.category-filters .cat-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');

    currentCategory = pill.dataset.cat;
    renderGourmetShowcase(botEngine.currentDayKey, currentCategory);
  });

  // Controles do Chat
  btnOpenChat.addEventListener('click', () => {
    chatSidebar.classList.remove('closed');
    chatSidebar.classList.add('open-mobile');
    userInput.focus();
  });

  btnCloseChat.addEventListener('click', () => {
    chatSidebar.classList.add('closed');
    chatSidebar.classList.remove('open-mobile');
  });

  btnClearChat.addEventListener('click', () => {
    chatMessages.innerHTML = '';
    botEngine.cart = [];
    botEngine.sessionState.step = 'GREETING';
    updateCartUI();
    initGreeting();
  });

  // Controles do Carrinho Drawer
  btnToggleCart.addEventListener('click', () => {
    cartDrawer.classList.toggle('open');
  });

  btnCloseCart.addEventListener('click', () => {
    cartDrawer.classList.remove('open');
  });

  // Ações Rápidas
  quickActionsBar.addEventListener('click', (e) => {
    const pill = e.target.closest('.quick-pill');
    if (!pill) return;
    const action = pill.dataset.action;

    if (action === 'ver_cardapio') {
      appendMessage('user', 'Ver cardápio');
      appendMessage('bot', botEngine.formatMenuSummary(botEngine.currentDayKey));
    } else if (action === 'fechar_pedido') {
      appendMessage('user', 'Fechar pedido');
      const res = botEngine.handleCheckoutSummary();
      appendMessage('bot', res.reply);
      cartDrawer.classList.add('open');
    } else if (action === 'ajuda') {
      appendMessage('user', 'Como pedir');
      const res = botEngine.processUserMessage('ajuda');
      appendMessage('bot', res.reply);
    } else if (action === 'limpar') {
      appendMessage('user', 'Limpar pedido');
      const res = botEngine.processUserMessage('limpar');
      appendMessage('bot', res.reply);
      updateCartUI();
    }
  });

  // Checkout WhatsApp
  btnCheckout.addEventListener('click', () => {
    if (botEngine.cart.length === 0) return;

    const subtotal = botEngine.calculateSubtotal();
    const total = subtotal + DELIVERY_FEE;

    let msg = `*🍱 NOVO PEDIDO - MARMITAS BRASÍLIA*\n`;
    msg += `_Cozinha Artesanal & Gourmet no DF_\n\n`;
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

    msg += `\n_Pedido gerado via Vitrine Gourmet & Chatbot Client-Side (Sem LLM)._`;

    const whatsappUrl = `https://wa.me/5561999999999?text=${encodeURIComponent(msg)}`;
    window.open(whatsappUrl, '_blank');
  });

  // Boas-vindas inicial no Chat
  function initGreeting() {
    const greeting = `👋 Olá! Seja muito bem-vindo(a) à **Marmitas Brasília**!
Eu sou a **Candanga**, sua atendente para montagem e entrega das suas marmitas aqui no DF.

🍛 **Como posso montar seu pedido hoje?**
• Escolha qualquer marmita do cardápio pelo nome
• Ajuste os temperos à vontade (ex: *sem cebola*, *pouco sal*, *sem salada*, *molho à parte*)
• Defina o ponto da sua carne (*ao ponto*, *bem passada*, *mal passada*)
• Informe a quantidade desejada (*"quero 2 marmitas..."*)

Diga o que você quer saborear ou clique em **"📋 Ver Cardápio"** para ver as opções frescas do dia!`;

    appendMessage('bot', greeting);
  }

  // Inicialização
  renderGourmetShowcase(botEngine.currentDayKey);
  updateCartUI();
  initGreeting();
});
