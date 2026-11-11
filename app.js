/**
 * MARMITABOT - SISTEMA CLIENT-SIDE DE ATENDIMENTO E VENDAS
 * Arquitetura de Engenharia de Software com Guardrails de Segurança Defensiva
 */

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

    // 1. Defesa contra estouro de tokens / Flood / DoS
    if (trimmed.length > 200) {
      return {
        safe: false,
        reason: '⚠️ Mensagem muito longa. Para economia de tokens e segurança, limite sua mensagem a no máximo 200 caracteres.'
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
      /onload\s*=/i
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
          reason: '🚫 ESCOPO EXCLUSIVO: Não estou autorizada a gastar tokens com tarefas gerais (redações, código, curiosidades). Meu único e exclusivo propósito é atender pedidos de marmitas da Marmitaria Sabor Real!'
        };
      }
    }

    return { safe: true };
  }

  matchesAny(text, keywords) {
    return keywords.some(keyword => text.includes(keyword));
  }

  // ==========================================
  // PROCESSAMENTO DE LINGUAGEM NATURAL (CLIENT-SIDE)
  // ==========================================
  processUserMessage(rawText) {
    // Validação pelos Guardrails
    const securityCheck = this.validateSecurityGuardrails(rawText);
    if (!securityCheck.safe) {
      return {
        reply: securityCheck.reason,
        isGuardrailAlert: true
      };
    }

    const text = rawText.trim().toLowerCase();

    // Comandos de controle
    if (this.matchesAny(text, ['limpar', 'reiniciar', 'cancelar tudo', 'começar de novo'])) {
      this.cart = [];
      this.sessionState.step = 'GREETING';
      this.sessionState.pendingItem = null;
      return {
        reply: '🔄 Carrinho limpo e conversa reiniciada! Como posso te ajudar hoje? Diga o que deseja comer ou digite "cardápio".'
      };
    }

    if (this.matchesAny(text, ['ajuda', 'socorro', 'como funciona', 'opções', 'comandos'])) {
      return {
        reply: `💡 **Como posso te ajudar:**
1. Peça marmitas pelo nome: *"Quero 2 bife de vaca bem passado sem cebola"*
2. Consulte o cardápio: *"ver cardápio"*
3. Finalize quando quiser: *"fechar pedido"* ou *"concluir"*
4. Personalize: altere temperos, acompanhamentos e pontos de carne à vontade!`
      };
    }

    if (this.matchesAny(text, ['cardápio', 'cardapio', 'menu', 'pratos', 'opcoes'])) {
      return {
        reply: this.formatMenuSummary(this.currentDayKey)
      };
    }

    if (this.matchesAny(text, ['total', 'fechar', 'concluir', 'finalizar', 'pagar', 'carrinho', 'resumo'])) {
      return this.handleCheckoutSummary();
    }

    // Identificação de Item do Cardápio
    const matchedItem = this.findMatchingItem(text);
    if (matchedItem) {
      return this.handleItemSelection(matchedItem, text);
    }

    // Se estiver no fluxo de finalização e enviou endereço
    if (this.sessionState.step === 'ASKING_ADDRESS') {
      this.sessionState.address = rawText;
      this.sessionState.step = 'PAYMENT';
      return {
        reply: `📍 Endereço registrado: **${this.escapeHtml(rawText)}**\n\nQual será a forma de pagamento?\n1. **PIX**\n2. **Cartão (Débito/Crédito na entrega)**\n3. **Dinheiro**`
      };
    }

    if (this.sessionState.step === 'PAYMENT') {
      this.sessionState.payment = rawText;
      this.sessionState.step = 'COMPLETED';
      return {
        reply: `🎉 Pedido registrado com sucesso!\n\nForma de Pagamento: **${this.escapeHtml(rawText)}**.\nClique no botão verde **"Finalizar Pedido"** ao lado para enviar a comanda pronta no WhatsApp do restaurante ou nos confirmar.`
      };
    }

    // Fallback defensivo com sugestões
    return {
      reply: `Desculpe, não entendi perfeitamente. Você gostaria de pedir algum prato do cardápio de hoje?\n\nExemplo de como pedir:\n👉 *"Quero 1 Bife de vaca ao ponto sem cebola e pouco sal"* ou digite **"cardápio"** para ver as opções.`
    };
  }

  // Identifica prato através de palavras-chave
  findMatchingItem(text) {
    const currentMenu = MENU_DATA[this.currentDayKey] || MENU_DATA['segunda'];
    
    // Busca no cardápio de hoje primeiro
    for (const item of currentMenu) {
      const nameTokens = item.name.toLowerCase().split(' ');
      if (text.includes(item.id) || text.includes(item.name.toLowerCase())) {
        return item;
      }
      if (item.meatType === 'bovino' && (text.includes('bife') || text.includes('vaca') || text.includes('carne'))) {
        return item;
      }
      if (item.meatType === 'suino' && (text.includes('feijoada') || text.includes('virado') || text.includes('bisteca'))) {
        return item;
      }
      if (item.meatType === 'frango' && (text.includes('frango') || text.includes('strogonoff') || text.includes('parmegiana'))) {
        return item;
      }
      if (item.meatType === 'peixe' && (text.includes('peixe') || text.includes('tilapia') || text.includes('tilápia'))) {
        return item;
      }
    }

    // Busca geral nos outros dias se mencionado
    for (const day in MENU_DATA) {
      for (const item of MENU_DATA[day]) {
        if (text.includes(item.name.toLowerCase())) {
          return item;
        }
      }
    }

    return null;
  }

  // Extrai customizações do texto (quantidade, ponto da carne, temperos)
  extractCustomizations(text, item) {
    // 1. Quantidade
    let quantity = 1;
    const qtyMatch = text.match(/(\d+)\s*(marmita|unidade|porcao|porção|bife|prato)?/i);
    if (qtyMatch && parseInt(qtyMatch[1]) > 0 && parseInt(qtyMatch[1]) < 50) {
      quantity = parseInt(qtyMatch[1]);
    } else {
      if (text.includes('duas') || text.includes('dois')) quantity = 2;
      if (text.includes('tres') || text.includes('três')) quantity = 3;
    }

    // 2. Ponto da carne (apenas relevante para bovino)
    let cookingPoint = null;
    if (item.meatType === 'bovino' || text.includes('ponto') || text.includes('passad')) {
      if (text.includes('bem passad') || text.includes('bem tostado') || text.includes('torrad')) {
        cookingPoint = 'Bem passado';
      } else if (text.includes('mal passad') || text.includes('sangrando')) {
        cookingPoint = 'Mal passado';
      } else if (text.includes('ao ponto') || text.includes('ponto')) {
        cookingPoint = 'Ao ponto';
      } else {
        cookingPoint = 'Ao ponto (Padrão do chef)';
      }
    }

    // 3. Temperos e Modificações de Ingredientes
    const modifications = [];
    if (text.includes('sem cebola') || text.includes('sem cebolas') || text.includes('tira cebola') || text.includes('não quero cebola')) {
      modifications.push('Sem cebola');
    }
    if (text.includes('pouco sal') || text.includes('menos sal') || text.includes('sem sal')) {
      modifications.push('Pouco sal');
    }
    if (text.includes('sem alho')) {
      modifications.push('Sem alho');
    }
    if (text.includes('sem feijao') || text.includes('sem feijão')) {
      modifications.push('Sem feijão');
    }
    if (text.includes('arroz integral')) {
      modifications.push('Arroz integral');
    }
    if (text.includes('sem salada')) {
      modifications.push('Sem salada');
    }
    if (text.includes('molho a parte') || text.includes('molho à parte')) {
      modifications.push('Molho à parte');
    }
    if (text.includes('bastante pimenta') || text.includes('com pimenta')) {
      modifications.push('Com pimenta da casa');
    }

    // Captura livre caso o usuário use "obs:" ou "com:"
    const obsMatch = text.match(/obs:?\s*(.*?)(?=\.|$)/i);
    if (obsMatch && obsMatch[1]) {
      modifications.push(`Obs: ${obsMatch[1].trim()}`);
    }

    return {
      quantity,
      cookingPoint,
      modifications: modifications.length > 0 ? modifications.join(', ') : 'Tempero padrão da casa'
    };
  }

  handleItemSelection(item, text) {
    const custom = this.extractCustomizations(text, item);

    const orderItem = {
      id: `${item.id}-${Date.now()}`,
      name: item.name,
      unitPrice: item.price,
      quantity: custom.quantity,
      cookingPoint: custom.cookingPoint,
      notes: custom.modifications,
      total: item.price * custom.quantity
    };

    this.cart.push(orderItem);

    let reply = `🍽️ Adicionei ao seu pedido:\n- **${custom.quantity}x ${item.name}**\n- Valor unitário: R$ ${item.price.toFixed(2).replace('.', ',')}`;
    if (custom.cookingPoint) {
      reply += `\n- Ponto da carne: **${custom.cookingPoint}**`;
    }
    reply += `\n- Ajuste de temperos: **${custom.modifications}**`;
    reply += `\n- Subtotal do item: **R$ ${orderItem.total.toFixed(2).replace('.', ',')}**`;

    const subtotal = this.calculateSubtotal();
    const total = subtotal + DELIVERY_FEE;

    reply += `\n\n📦 Seu pedido no momento tem **${this.cart.length} item(ns)** somando **R$ ${total.toFixed(2).replace('.', ',')}** (com entrega inclusa).\n\nDeseja adicionar mais alguma marmita ou quer **fechar o pedido** agora?`;

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

    // Processar pelo motor inteligente com guardrails
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

    let msg = `*NOVO PEDIDO - MARMITARIA SABOR REAL*\n\n`;
    botEngine.cart.forEach((item, i) => {
      msg += `*${i + 1}. ${item.quantity}x ${item.name}*\n`;
      if (item.cookingPoint) msg += `🥩 Ponto: ${item.cookingPoint}\n`;
      msg += `🧂 Temperos/Obs: ${item.notes}\n`;
      msg += `💵 Subtotal: R$ ${item.total.toFixed(2).replace('.', ',')}\n\n`;
    });

    msg += `-----------------------------\n`;
    msg += `🍲 Subtotal: R$ ${subtotal.toFixed(2).replace('.', ',')}\n`;
    msg += `🛵 Taxa Entrega: R$ ${DELIVERY_FEE.toFixed(2).replace('.', ',')}\n`;
    msg += `💰 *TOTAL: R$ ${total.toFixed(2).replace('.', ',')}*\n`;

    if (botEngine.sessionState.address) {
      msg += `📍 *Endereço:* ${botEngine.sessionState.address}\n`;
    }
    if (botEngine.sessionState.payment) {
      msg += `💳 *Pagamento:* ${botEngine.sessionState.payment}\n`;
    }

    const whatsappUrl = `https://wa.me/5511999999999?text=${encodeURIComponent(msg)}`;
    window.open(whatsappUrl, '_blank');
  });

  // Mensagem inicial de boas-vindas
  function initGreeting() {
    const greeting = `👋 Olá! Seja muito bem-vindo(a) à **Marmitaria Sabor Real**!
Eu sou a **Dona Benta**, sua assistente virtual de marmitas.

🍛 Você pode escolher qualquer item do cardápio e personalizar como preferir:
• Ajustar temperos (ex: *sem cebola*, *pouco sal*, *sem salada*)
• Escolher o ponto da carne (*ao ponto*, *bem passada*, *mal passada*)
• Definir a quantidade desejada

Diga o que gostaria de pedir ou clique em **"📋 Ver Cardápio"** para ver as delícias de hoje!`;

    appendMessage('bot', greeting);
  }

  // Inicialização
  renderSidebarMenu(botEngine.currentDayKey);
  updateCartUI();
  initGreeting();
});
