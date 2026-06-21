const PptxGenJS = require('pptxgenjs');
const prs = new PptxGenJS();
prs.layout = 'LAYOUT_WIDE';

// ─── PALETA ──────────────────────────────────────────────────────────────────
const C = {
  dark:    '0D1B2A', // azul muy oscuro (fondo oscuro)
  green1:  '1A6B3C', // verde oscuro
  green2:  '27AE60', // verde medio
  lime:    '2ECC71', // verde brillante (accent)
  teal:    '1ABC9C', // turquesa (accent 2)
  white:   'FFFFFF',
  gray1:   'F4F6F8', // fondo claro
  gray2:   '8D99AE', // texto secundario
  dark2:   '1C2A3A', // fondo de sección oscuro
  yellow:  'F4D03F', // amarillo accent
  card:    '162032', // card oscura
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function circleBullet(slide, x, y, num, color) {
  slide.addShape(prs.ShapeType.ellipse, {
    x, y, w: 0.38, h: 0.38,
    fill: { color },
    line: { color, width: 0 },
  });
  slide.addText(String(num), {
    x, y: y - 0.01, w: 0.38, h: 0.38,
    fontSize: 12, bold: true, color: C.white,
    align: 'center', valign: 'middle', fontFace: 'Calibri',
  });
}

function tag(slide, x, y, label, bgColor) {
  const w = label.length * 0.095 + 0.3;
  slide.addShape(prs.ShapeType.roundRect, {
    x, y, w, h: 0.3,
    fill: { color: bgColor },
    line: { color: bgColor, width: 0 },
    rectRadius: 0.08,
  });
  slide.addText(label, {
    x, y, w, h: 0.3,
    fontSize: 9, bold: true, color: C.white,
    align: 'center', valign: 'middle', fontFace: 'Calibri',
  });
}

function gradientBg(slide) {
  // deep dark gradient simulation
  slide.addShape(prs.ShapeType.rect, { x:0, y:0, w:'100%', h:'100%', fill:{ color: C.dark } });
  slide.addShape(prs.ShapeType.rect, { x:0, y:0, w:'50%', h:'100%', fill:{ color: C.dark2 }, line:{color:C.dark2} });
  // decorative corner
  slide.addShape(prs.ShapeType.rect, { x:0, y:6.6, w:'100%', h:0.9, fill:{ color: C.green1 }, line:{color:C.green1} });
  slide.addShape(prs.ShapeType.rect, { x:0, y:6.6, w: 3, h:0.9, fill:{ color: C.lime }, line:{color:C.lime} });
}

function lightBg(slide) {
  slide.addShape(prs.ShapeType.rect, { x:0, y:0, w:'100%', h:'100%', fill:{ color: C.gray1 } });
  slide.addShape(prs.ShapeType.rect, { x:0, y:0, w:0.08, h:'100%', fill:{ color: C.lime } });
  slide.addShape(prs.ShapeType.rect, { x:0, y:0, w:'100%', h:1.1, fill:{ color: C.dark2 } });
  slide.addShape(prs.ShapeType.rect, { x:0, y:1.1, w:'100%', h:0.06, fill:{ color: C.lime } });
  slide.addShape(prs.ShapeType.rect, { x:0, y:7.0, w:'100%', h:0.5, fill:{ color: C.dark } });
}

function titleBar(slide, text) {
  slide.addText(text, {
    x:0.2, y:0.1, w:13, h:0.9,
    fontSize:24, bold:true, color:C.white, fontFace:'Calibri', valign:'middle',
  });
}

function pageNum(slide, n) {
  slide.addText(`${n} / 14`, {
    x:11.8, y:7.1, w:1.5, h:0.35,
    fontSize:9, color:C.gray2, align:'right', fontFace:'Calibri',
  });
}

function bottomBrand(slide) {
  slide.addText('AgroBot — Universidad de Sonsonate', {
    x:0.2, y:7.1, w:8, h:0.35,
    fontSize:9, color:C.gray2, fontFace:'Calibri',
  });
}

// ─── SLIDE 1: PORTADA ────────────────────────────────────────────────────────
{
  const s = prs.addSlide();
  s.addShape(prs.ShapeType.rect, { x:0, y:0, w:'100%', h:'100%', fill:{color:C.dark} });
  // Left green panel
  s.addShape(prs.ShapeType.rect, { x:0, y:0, w:4.8, h:'100%', fill:{color:C.green1}, line:{color:C.green1} });
  // Accent triangle-like stripe
  s.addShape(prs.ShapeType.rect, { x:4.5, y:0, w:0.4, h:'100%', fill:{color:C.lime}, line:{color:C.lime} });
  // Top accent
  s.addShape(prs.ShapeType.rect, { x:0, y:0, w:4.8, h:0.15, fill:{color:C.lime}, line:{color:C.lime} });
  // Bottom accent
  s.addShape(prs.ShapeType.rect, { x:0, y:7.35, w:'100%', h:0.15, fill:{color:C.lime}, line:{color:C.lime} });

  // Dots decoration
  for(let i=0; i<5; i++) {
    s.addShape(prs.ShapeType.ellipse, { x:0.3+i*0.55, y:5.8, w:0.35, h:0.35, fill:{color:i===0?C.lime:C.teal}, line:{color:'00000000'} });
  }

  // LOGO area tag
  s.addShape(prs.ShapeType.roundRect, { x:0.3, y:0.4, w:1.8, h:0.5, fill:{color:C.lime}, line:{color:C.lime}, rectRadius:0.12 });
  s.addText('TESIS 2026', { x:0.3, y:0.4, w:1.8, h:0.5, fontSize:13, bold:true, color:C.dark, align:'center', valign:'middle', fontFace:'Calibri' });

  // Big title left
  s.addText('AgroBot', { x:0.3, y:1.1, w:4.2, h:1.0, fontSize:42, bold:true, color:C.white, fontFace:'Calibri' });
  s.addShape(prs.ShapeType.rect, { x:0.3, y:2.1, w:4.0, h:0.06, fill:{color:C.lime}, line:{color:C.lime} });
  s.addText('Asistente Virtual\npara Fertilización Agrícola', {
    x:0.3, y:2.3, w:4.2, h:1.2,
    fontSize:17, color:'C8E6C9', fontFace:'Calibri', wrap:true, lineSpacingMultiple:1.3,
  });
  s.addText('Universidad de Sonsonate\nFacultad de Ingeniería y Ciencias Naturales', {
    x:0.3, y:4.0, w:4.2, h:1.0,
    fontSize:12, color:'A5D6A7', fontFace:'Calibri', wrap:true,
  });

  // Right side content
  s.addText('Capítulo III', { x:5.2, y:1.2, w:8, h:0.7, fontSize:34, bold:true, color:C.white, fontFace:'Calibri' });
  s.addText('Metodología y Prototipo', { x:5.2, y:2.0, w:8, h:0.6, fontSize:20, color:C.lime, fontFace:'Calibri' });
  s.addShape(prs.ShapeType.rect, { x:5.2, y:2.65, w:7.5, h:0.05, fill:{color:C.gray2}, line:{color:C.gray2} });

  // 4 info cards right
  const cards = [
    { icon:'🏗️', label:'Arquitectura', val:'Full-Stack Moderno' },
    { icon:'🤖', label:'Modelo IA', val:'Qwen + Llama 3.2' },
    { icon:'🔍', label:'Búsqueda', val:'RAG + DistilBERT' },
    { icon:'🗄️', label:'Base de Datos', val:'PostgreSQL + pgvector' },
  ];
  cards.forEach((c,i) => {
    const cx = 5.2 + (i%2)*4.0;
    const cy = 2.9 + Math.floor(i/2)*1.7;
    s.addShape(prs.ShapeType.roundRect, { x:cx, y:cy, w:3.6, h:1.4, fill:{color:C.card}, line:{color:C.green2,width:1}, rectRadius:0.15 });
    s.addText(c.icon, { x:cx+0.15, y:cy+0.15, w:0.7, h:0.7, fontSize:22, align:'center' });
    s.addText(c.label, { x:cx+0.9, y:cy+0.15, w:2.5, h:0.4, fontSize:11, color:C.lime, bold:true, fontFace:'Calibri' });
    s.addText(c.val,   { x:cx+0.9, y:cy+0.55, w:2.5, h:0.6, fontSize:13, color:C.white, fontFace:'Calibri', wrap:true });
  });
}

// ─── SLIDE 2: SEPARADOR — PARTE 1 ────────────────────────────────────────────
{
  const s = prs.addSlide();
  gradientBg(s);
  s.addShape(prs.ShapeType.ellipse, { x:-1.5, y:-1.5, w:5, h:5, fill:{color:C.green1}, line:{color:C.green1} });
  s.addShape(prs.ShapeType.ellipse, { x:10, y:4, w:4, h:4, fill:{color:'0A2A18'}, line:{color:'0A2A18'} });
  s.addText('PARTE 1', { x:0.5, y:2.2, w:12.5, h:0.7, fontSize:16, bold:true, color:C.lime, align:'center', fontFace:'Calibri', charSpacing:8 });
  s.addText('Capítulo 3: Diseño y Metodología', { x:0.5, y:3.0, w:12.5, h:1.2, fontSize:38, bold:true, color:C.white, align:'center', fontFace:'Calibri' });
  s.addShape(prs.ShapeType.rect, { x:4.5, y:4.3, w:4.5, h:0.08, fill:{color:C.lime}, line:{color:C.lime} });
  pageNum(s, 2);
}

// ─── SLIDE 3: ARQUITECTURA ────────────────────────────────────────────────────
{
  const s = prs.addSlide();
  lightBg(s);
  titleBar(s, '🏗️  Arquitectura General del Sistema');

  const layers = [
    { icon:'🖥️', title:'FRONTEND', sub:'React 18 · Vite · TailwindCSS v4 · TypeScript', detail:'Interfaz rápida y responsiva. Zustand para estado global. React Query v5 para caché de datos.', color:C.green2 },
    { icon:'⚙️', title:'BACKEND API', sub:'Node.js · Express · Drizzle ORM · TypeScript', detail:'API RESTful con tipado estricto. Drizzle ORM garantiza consultas seguras y tipo-seguras.', color:C.teal },
    { icon:'🗄️', title:'BASE DE DATOS', sub:'PostgreSQL + extensión pgvector', detail:'Almacena sesiones de usuario y vectores (embeddings) de +60 documentos agrícolas.', color:C.green1 },
    { icon:'🔐', title:'AUTENTICACIÓN', sub:'Google OAuth 2.0 · Tokens JWT', detail:'Inicio de sesión seguro. Historial de chats 100% privado por usuario.', color:'7D3C98' },
  ];

  layers.forEach((l, i) => {
    const y = 1.25 + i * 1.35;
    s.addShape(prs.ShapeType.roundRect, { x:0.15, y, w:13.2, h:1.22, fill:{color:C.white}, line:{color:l.color, width:2}, rectRadius:0.12,
      shadow:{type:'outer', blur:8, offset:3, angle:45, color:'00000018'} });
    // left color bar
    s.addShape(prs.ShapeType.roundRect, { x:0.15, y, w:0.45, h:1.22, fill:{color:l.color}, line:{color:l.color}, rectRadius:0.12 });
    s.addText(l.icon, { x:0.7, y: y+0.2, w:0.9, h:0.8, fontSize:26, align:'center' });
    s.addText(l.title, { x:1.65, y: y+0.1, w:2.5, h:0.45, fontSize:14, bold:true, color:l.color, fontFace:'Calibri' });
    s.addText(l.sub,   { x:1.65, y: y+0.52, w:3.8, h:0.4, fontSize:10, color:C.dark, fontFace:'Calibri' });
    s.addShape(prs.ShapeType.rect, { x:5.6, y: y+0.2, w:0.04, h:0.8, fill:{color:C.gray2}, line:{color:C.gray2} });
    s.addText(l.detail, { x:5.8, y: y+0.12, w:7.3, h:0.98, fontSize:12, color:'333333', fontFace:'Calibri', wrap:true, valign:'middle' });
  });

  bottomBrand(s); pageNum(s,3);
}

// ─── SLIDE 4: MODELOS IA ──────────────────────────────────────────────────────
{
  const s = prs.addSlide();
  lightBg(s);
  titleBar(s, '🤖  Núcleo de IA: Benchmarking de Modelos Locales');

  // Left card — Generativo
  s.addShape(prs.ShapeType.roundRect, { x:0.2, y:1.25, w:6.2, h:5.6, fill:{color:C.dark2}, line:{color:C.lime,width:2}, rectRadius:0.2,
    shadow:{type:'outer', blur:15, offset:5, angle:45, color:'00000033'} });
  s.addShape(prs.ShapeType.roundRect, { x:0.2, y:1.25, w:6.2, h:0.65, fill:{color:C.lime}, line:{color:C.lime}, rectRadius:0.2 });
  s.addText('🧠  Motor Generativo (Ollama)', { x:0.35, y:1.28, w:5.9, h:0.55, fontSize:14, bold:true, color:C.dark, fontFace:'Calibri' });

  const genItems = [
    { tag:'Qwen', val:'0.6B params  ·  2-4 GB RAM\nUltraligero. Respuesta casi instantánea.\nIdeal para hardware limitado.' },
    { tag:'Llama 3.2', val:'3B params  ·  6-8 GB RAM\nRespuestas más elaboradas y naturales.\nMayor calidad técnica agrícola.' },
    { tag:'Veredicto', val:'Probamos AMBOS → elegimos el más eficiente según el hardware disponible.' },
    { tag:'Sin nube', val:'100% local · Sin pago por token · Sin internet requerido para inferencia.' },
  ];
  genItems.forEach((g, i) => {
    const y = 2.1 + i*1.1;
    s.addShape(prs.ShapeType.roundRect, { x:0.35, y, w:1.1, h:0.35, fill:{color:C.lime}, line:{color:C.lime}, rectRadius:0.1 });
    s.addText(g.tag, { x:0.35, y, w:1.1, h:0.35, fontSize:9, bold:true, color:C.dark, align:'center', valign:'middle', fontFace:'Calibri' });
    s.addText(g.val, { x:1.55, y, w:4.6, h:0.8, fontSize:11, color:C.white, fontFace:'Calibri', wrap:true, valign:'top' });
  });

  // Right card — DistilBERT
  s.addShape(prs.ShapeType.roundRect, { x:6.9, y:1.25, w:6.6, h:5.6, fill:{color:C.dark2}, line:{color:C.teal,width:2}, rectRadius:0.2,
    shadow:{type:'outer', blur:15, offset:5, angle:45, color:'00000033'} });
  s.addShape(prs.ShapeType.roundRect, { x:6.9, y:1.25, w:6.6, h:0.65, fill:{color:C.teal}, line:{color:C.teal}, rectRadius:0.2 });
  s.addText('🔍  Motor de Búsqueda (DistilBERT)', { x:7.05, y:1.28, w:6.3, h:0.55, fontSize:14, bold:true, color:C.dark, fontFace:'Calibri' });

  const bertItems = [
    { tag:'Tipo', val:'Modelo Encoder — lee y comprende.\nNO genera texto. Solo analiza significado.' },
    { tag:'Vector', val:'Cada texto → vector de 768 dimensiones.\nRepresenta matemáticamente el significado.' },
    { tag:'Modelo', val:'distiluse-base-multilingual-cased\nSoporte nativo en ESPAÑOL ✓' },
    { tag:'Creado por', val:'Google (BERT original) + Hugging Face.\nUsado por Google en su buscador.' },
    { tag:'Función', val:'Búsqueda semántica: entiende sinónimos\ny contexto, no solo palabras exactas.' },
  ];
  bertItems.forEach((b, i) => {
    const y = 2.1 + i*0.9;
    s.addShape(prs.ShapeType.roundRect, { x:7.05, y, w:1.2, h:0.32, fill:{color:C.teal}, line:{color:C.teal}, rectRadius:0.1 });
    s.addText(b.tag, { x:7.05, y, w:1.2, h:0.32, fontSize:9, bold:true, color:C.dark, align:'center', valign:'middle', fontFace:'Calibri' });
    s.addText(b.val, { x:8.35, y, w:4.9, h:0.75, fontSize:11, color:C.white, fontFace:'Calibri', wrap:true, valign:'top' });
  });

  bottomBrand(s); pageNum(s,4);
}

// ─── SLIDE 5: RAG FLOW ────────────────────────────────────────────────────────
{
  const s = prs.addSlide();
  lightBg(s);
  titleBar(s, '🔄  Arquitectura RAG — Retrieval-Augmented Generation');

  const steps = [
    { n:'R', label:'Retrieval\nRECUPERACIÓN', desc:'DistilBERT convierte la pregunta en vectores y busca en PostgreSQL los fragmentos más relevantes.', color:C.green1, light:'D5F5E3' },
    { n:'A', label:'Augmented\nAUMENTADA', desc:'Los fragmentos recuperados se inyectan al prompt enviado al modelo de lenguaje (invisible para el usuario).', color:C.green2, light:'A9DFBF' },
    { n:'G', label:'Generation\nGENERACIÓN', desc:'El modelo (Qwen / Llama) lee el contexto inyectado y genera una respuesta técnica natural.', color:C.teal, light:'A2D9CE' },
    { n:'✓', label:'Resultado\nSIN ALUCINACIONES', desc:'La IA solo puede responder con información de tus Excels validados. No inventa datos.', color:C.lime, light:'D4EFDF' },
  ];

  steps.forEach((st, i) => {
    const x = 0.15 + i * 3.3;
    // card bg
    s.addShape(prs.ShapeType.roundRect, { x, y:1.25, w:3.1, h:5.5, fill:{color:'F8FDF9'}, line:{color:st.color,width:2}, rectRadius:0.18,
      shadow:{type:'outer', blur:12, offset:4, angle:45, color:'00000020'} });
    // header
    s.addShape(prs.ShapeType.roundRect, { x, y:1.25, w:3.1, h:1.5, fill:{color:st.color}, line:{color:st.color}, rectRadius:0.18 });
    // big letter
    s.addText(st.n, { x, y:1.3, w:3.1, h:0.9, fontSize:40, bold:true, color:C.white, align:'center', fontFace:'Calibri' });
    s.addText(st.label, { x:x+0.1, y:2.05, w:2.9, h:0.65, fontSize:11, bold:true, color:C.white, align:'center', fontFace:'Calibri', wrap:true });
    s.addText(st.desc, { x:x+0.15, y:2.9, w:2.8, h:3.6, fontSize:12, color:'1A1A1A', fontFace:'Calibri', wrap:true, valign:'top', lineSpacingMultiple:1.4 });

  // ─ Conectores mejorados entre pasos ─
    if(i < 3) {
      // Flecha con fondo circular
      s.addShape(prs.ShapeType.ellipse, { x: x+3.0, y:3.55, w:0.42, h:0.42,
        fill:{color:C.dark2}, line:{color:C.lime, width:1.5} });
      s.addText('❯', { x: x+3.0, y:3.55, w:0.42, h:0.42,
        fontSize:16, bold:true, color:C.lime, align:'center', valign:'middle', fontFace:'Calibri' });
      // Línea delgada conectora encima y abajo de la flecha
      s.addShape(prs.ShapeType.rect, { x: x+3.1, y:2.2, w:0.22, h:1.3,
        fill:{color:C.lime}, line:{color:C.lime} });
      s.addShape(prs.ShapeType.rect, { x: x+3.1, y:4.0, w:0.22, h:2.5,
        fill:{color:C.lime}, line:{color:C.lime} });
      // Paso numérico
      s.addText(String(i+1), { x: x+2.82, y: 1.26, w:0.6, h:0.35,
        fontSize:11, bold:true, color:C.white, align:'center', fontFace:'Calibri',
        fill:{color:st.color} });
    }
  });

  // Nota inferior
  s.addShape(prs.ShapeType.roundRect, { x:0.15, y:6.85, w:13.2, h:0.5, fill:{color:C.dark2}, line:{color:C.dark2}, rectRadius:0.1 });
  s.addText('💡  RAG no es una IA — es la TÉCNICA que une DistilBERT + Llama/Qwen y elimina las alucinaciones.', {
    x:0.3, y:6.87, w:13, h:0.42, fontSize:12, color:C.lime, fontFace:'Calibri', bold:true
  });
  bottomBrand(s); pageNum(s,5);
}

// ─── SLIDE 6: SEPARADOR — PROTOTIPO ──────────────────────────────────────────
{
  const s = prs.addSlide();
  gradientBg(s);
  s.addShape(prs.ShapeType.ellipse, { x:9, y:-2, w:6, h:6, fill:{color:C.green1}, line:{color:C.green1} });
  s.addShape(prs.ShapeType.ellipse, { x:-2, y:4, w:5, h:5, fill:{color:'0A2A18'}, line:{color:'0A2A18'} });
  s.addText('PARTE 2', { x:0.5, y:2.2, w:12.5, h:0.7, fontSize:16, bold:true, color:C.lime, align:'center', fontFace:'Calibri', charSpacing:8 });
  s.addText('Demostración del Prototipo', { x:0.5, y:3.0, w:12.5, h:1.2, fontSize:38, bold:true, color:C.white, align:'center', fontFace:'Calibri' });
  s.addShape(prs.ShapeType.rect, { x:4.5, y:4.3, w:4.5, h:0.08, fill:{color:C.lime}, line:{color:C.lime} });
  s.addText('Sección 3.4 de la Tesis', { x:0.5, y:4.5, w:12.5, h:0.5, fontSize:15, color:C.gray2, align:'center', fontFace:'Calibri' });
  pageNum(s,6);
}

// ─── HELPER: browser mockup ─────────────────────────────────────────────────
function browserMockup(s, x, y, w, h, imgPath) {
  const barH = 0.36;
  const barColor = '2D2D2D';
  const totalH = h + barH;

  // Sombra exterior (rect ligeramente más grande)
  s.addShape(prs.ShapeType.roundRect, { x: x-0.04, y: y-0.04, w: w+0.08, h: totalH+0.08,
    fill:{color:'BBBBBB'}, line:{color:'BBBBBB'}, rectRadius:0.18 });

  // Marco exterior
  s.addShape(prs.ShapeType.roundRect, { x, y, w, h: totalH,
    fill:{color:barColor}, line:{color:'1A1A1A', width:1.5}, rectRadius:0.16 });

  // Barra superior del navegador
  s.addShape(prs.ShapeType.roundRect, { x, y, w, h: barH,
    fill:{color:barColor}, line:{color:barColor}, rectRadius:0.16 });

  // 3 puntos rojo / amarillo / verde
  const dotColors = ['FF5F57','FFBD2E','28CA41'];
  dotColors.forEach((col, i) => {
    s.addShape(prs.ShapeType.ellipse, { x: x+0.14+i*0.24, y: y+0.1, w:0.14, h:0.14,
      fill:{color:col}, line:{color:col} });
  });

  // Barra de URL falsa
  s.addShape(prs.ShapeType.roundRect, { x: x+1.0, y: y+0.06, w: w-1.8, h: 0.24,
    fill:{color:'3D3D3D'}, line:{color:'555555', width:0.5}, rectRadius:0.06 });
  s.addText('localhost:5173', { x: x+1.05, y: y+0.07, w: w-1.9, h: 0.21,
    fontSize:8, color:'AAAAAA', fontFace:'Calibri', valign:'middle' });

  // Imagen de la captura dentro del marco
  s.addImage({ path: imgPath, x: x+0.04, y: y+barH, w: w-0.08, h: h-0.04,
    sizing:{ type:'cover' } });
}

// ─── HELPER: KPI strip ───────────────────────────────────────────────────
function kpiStrip(s, x, y, w, kpis, accentColor) {
  const colW = w / kpis.length;
  // Fondo de la franja
  s.addShape(prs.ShapeType.roundRect, { x, y, w, h:0.72,
    fill:{color:C.dark2}, line:{color:accentColor, width:1.5}, rectRadius:0.12 });
  kpis.forEach((k, i) => {
    const cx = x + i * colW;
    // Separador vertical entre KPIs
    if (i > 0) {
      s.addShape(prs.ShapeType.rect, { x: cx, y: y+0.1, w:0.02, h:0.52, fill:{color:accentColor}, line:{color:accentColor} });
    }
    s.addText(k.val, { x: cx+0.1, y: y+0.04, w: colW-0.2, h:0.36,
      fontSize:20, bold:true, color:accentColor, align:'center', fontFace:'Calibri' });
    s.addText(k.label, { x: cx+0.1, y: y+0.4, w: colW-0.2, h:0.28,
      fontSize:9, color:'AAAAAA', align:'center', fontFace:'Calibri' });
  });
}

// ─── HELPER: feature slide ───────────────────────────────────────────────────
function featureSlide(num, title, imgPath, features, noteText, accentColor, kpis) {
  const s = prs.addSlide();
  lightBg(s);
  titleBar(s, title);

  // ─ Imagen con marco de navegador ─
  const imgX = 0.15, imgY = 1.2, imgW = 7.0, imgH = 4.5;
  if (imgPath) {
    browserMockup(s, imgX, imgY, imgW, imgH, imgPath);
  } else {
    s.addShape(prs.ShapeType.roundRect, { x:imgX, y:imgY, w:imgW, h:imgH+0.36,
      fill:{color:'E8F8F5'}, line:{color:accentColor,width:2,dashType:'dash'}, rectRadius:0.2 });
    s.addText('📸', { x:3.0, y:2.8, w:1.5, h:1.5, fontSize:40, align:'center', valign:'middle' });
  }

  // Columna de texto a la derecha — más compacta, texto grande y en negro
  features.forEach((f, i) => {
    const y = 1.25 + i * 1.08;
    // Bala numérica
    s.addShape(prs.ShapeType.ellipse, { x:7.5, y: y+0.08, w:0.42, h:0.42, fill:{color:accentColor}, line:{color:accentColor} });
    s.addText(String(i+1), { x:7.5, y: y+0.08, w:0.42, h:0.42, fontSize:13, bold:true, color:'FFFFFF', align:'center', valign:'middle', fontFace:'Calibri' });
    // Título del punto
    s.addText(f.title, { x:8.05, y, w:5.4, h:0.42, fontSize:15, bold:true, color:'111111', fontFace:'Calibri' });
    // Descripción
    s.addText(f.desc, { x:8.05, y: y+0.44, w:5.4, h:0.58, fontSize:13, color:'222222', fontFace:'Calibri', wrap:true, lineSpacingMultiple:1.2 });
  });

  s.addNotes(noteText);
  bottomBrand(s); pageNum(s,num);
}

// ─── SLIDE 7: LOGIN ───────────────────────────────────────────────────────────
featureSlide(7,
  '🔐  Autenticación Segura — Google OAuth 2.0 (Sección 3.4.1-3.4.2)',
  'C:/Users/Moris/OneDrive/Documentos/Tesis/capturas/login.png',
  [
    { title:'Google OAuth 2.0', desc:'Estándar de la industria. Sin contraseñas que hackear.' },
    { title:'Historial Privado', desc:'Cada usuario ve solo sus propias conversaciones.' },
    { title:'Sin registro manual', desc:'Un clic y estás dentro. Compatible con cualquier cuenta Google.' },
    { title:'Tokens JWT', desc:'Sesión segura y con expiración automática.' },
    { title:'Cero almacenamiento de contraseñas', desc:'Nunca tocamos la contraseña del usuario.' },
  ],
  'Qué decir: "El sistema usa Google OAuth 2.0, el mismo estándar que usa Gmail o YouTube. Nosotros nunca vemos ni guardamos contraseñas. El historial es completamente privado para cada agricultor."',
  C.teal,
  [
    { val: 'OAuth 2.0', label: 'Estándar Seg.' },
    { val: 'JWT', label: 'Token Seguro' },
    { val: '100%', label: 'Sin almacenar contraseñas' },
  ]
);

// ─── SLIDE 8: CHAT UI ─────────────────────────────────────────────────────────
featureSlide(8,
  '💬  Interfaz de Chat — UX/UI Principal (Sección 3.4.3)',
  'C:/Users/Moris/OneDrive/Documentos/Tesis/capturas/interfaz de chat.png',
  [
    { title:'Indicador RAG inteligente', desc:'"Consultando base de datos agrícola..." — confirma que RAG está activo.' },
    { title:'Botón STOP ⏹️', desc:'AbortController cancela la generación en cualquier momento.' },
    { title:'Copiar respuesta 📋', desc:'Un clic copia toda la respuesta al portapapeles.' },
    { title:'Auto-scroll ↕️', desc:'La pantalla baja automáticamente al final de la respuesta.' },
    { title:'Renombrar y Organizar ✏️', desc:'El agricultor puede etiquetar y organizar sus sesiones.' },
  ],
  'DEMO EN VIVO: Hacer una pregunta agrícola, mostrar el indicador de carga, luego mostrar el botón de STOP.',
  C.green2,
  [
    { val: 'RAG', label: 'Búsqueda Activa' },
    { val: '<2s', label: 'Tiempo respuesta' },
    { val: 'Markdown', label: 'Formato visual' },
  ]
);

// ─── SLIDE 9: EL MURO ────────────────────────────────────────────────────────
{
  const s = prs.addSlide();
  lightBg(s);
  titleBar(s, '🧱  Protocolo de Seguridad: "El Muro" (Sección 3.4.7)');

  // Imagen grande a la izquierda
  s.addImage({ path: 'C:/Users/Moris/OneDrive/Documentos/Tesis/capturas/protocolo de seguridad el muro.png', x:0.15, y:1.2, w:7.2, h:5.3, sizing: { type: 'contain' } });

  // Permitidas
  s.addShape(prs.ShapeType.roundRect, { x:7.6, y:1.25, w:5.8, h:2.3, fill:{color:'EAFAF1'}, line:{color:C.lime,width:2}, rectRadius:0.15 });
  s.addText('✅  Preguntas PERMITIDAS', { x:7.75, y:1.3, w:5.5, h:0.5, fontSize:15, bold:true, color:'145A32', fontFace:'Calibri' });
  ['¿Cuándo fertilizo el maíz?', '¿Qué dosis de nitrógeno usa el frijol?', '¿Cuál es el calendario del café?'].forEach((t,i)=>{
    s.addText(`▶  ${t}`, { x:7.75, y:1.88+i*0.48, w:5.5, h:0.44, fontSize:13, color:'111111', fontFace:'Calibri' });
  });

  // Bloqueadas
  s.addShape(prs.ShapeType.roundRect, { x:7.6, y:3.7, w:5.8, h:2.3, fill:{color:'FDEDEC'}, line:{color:'E74C3C',width:2}, rectRadius:0.15 });
  s.addText('🚫  Preguntas BLOQUEADAS', { x:7.75, y:3.75, w:5.5, h:0.5, fontSize:15, bold:true, color:'922B21', fontFace:'Calibri' });
  ['¿Quién ganó el mundial?', 'Escríbeme una canción.', '¿Qué película me recomiendas?'].forEach((t,i)=>{
    s.addText(`✕  ${t}`, { x:7.75, y:4.32+i*0.48, w:5.5, h:0.44, fontSize:13, color:'111111', fontFace:'Calibri' });
  });

  // Barra inferior
  s.addShape(prs.ShapeType.roundRect, { x:0.15, y:6.55, w:13.2, h:0.5, fill:{color:C.dark2}, line:{color:C.dark2}, rectRadius:0.1 });
  s.addText('💡  El prompt instruye al modelo: "Solo puedes responder sobre fertilización agrícola".',
    { x:0.3, y:6.57, w:13, h:0.42, fontSize:12, color:C.lime, fontFace:'Calibri', bold:true });

  s.addNotes('Qué decir: "Implementamos un protocolo de redirección. El sistema tiene un prompt que le dice que SOLO puede hablar de fertilización agrícola."');
  bottomBrand(s); pageNum(s,9);
}

// ─── SLIDE 10: TABLAS MARKDOWN ────────────────────────────────────────────────
featureSlide(10,
  '📊  Renderizado Dinámico de Tablas (Sección 3.4.6)',
  'C:/Users/Moris/OneDrive/Documentos/Tesis/capturas/renderizado de dinamico de tablas.png',
  [
    { title:'Origen: Excels agrícolas', desc:'Los calendarios son tablas en hojas de cálculo validadas.' },
    { title:'Conversión automática a Markdown', desc:'El sistema convierte filas y columnas a formato Markdown.' },
    { title:'Renderizado HTML nativo', desc:'react-markdown + GFM convierte Markdown a HTML visual.' },
    { title:'Negritas, listas y código', desc:'El modelo puede destacar dosis, pasos y fórmulas técnicas.' },
    { title:'Resultado visual', desc:'Tablas limpias, fáciles de leer para el agricultor.' },
  ],
  'Qué decir: "Usamos react-markdown con soporte GFM. Los datos de los Excels se presentan como tablas visuales y listas claras, no como texto plano."',
  C.green1,
  [
    { val: '60+', label: 'Calendarios' },
    { val: '768', label: 'Dimensiones vector' },
    { val: 'GFM', label: 'Formato Markdown' },
  ]
);

// ─── SLIDE 11: SEPARADOR — FACTIBILIDAD ──────────────────────────────────────
{
  const s = prs.addSlide();
  gradientBg(s);
  s.addShape(prs.ShapeType.ellipse, { x:-1, y:3, w:5, h:5, fill:{color:C.green1}, line:{color:C.green1} });
  s.addText('PARTE 3', { x:0.5, y:2.2, w:12.5, h:0.7, fontSize:16, bold:true, color:C.lime, align:'center', fontFace:'Calibri', charSpacing:8 });
  s.addText('Factibilidad y Conclusiones', { x:0.5, y:3.0, w:12.5, h:1.2, fontSize:38, bold:true, color:C.white, align:'center', fontFace:'Calibri' });
  s.addShape(prs.ShapeType.rect, { x:4.5, y:4.3, w:4.5, h:0.08, fill:{color:C.lime}, line:{color:C.lime} });
  s.addText('Sección 3.5 de la Tesis', { x:0.5, y:4.5, w:12.5, h:0.5, fontSize:15, color:C.gray2, align:'center', fontFace:'Calibri' });
  pageNum(s,11);
}

// ─── SLIDE 12: FACTIBILIDAD ───────────────────────────────────────────────────
{
  const s = prs.addSlide();
  lightBg(s);
  titleBar(s, '📋  Análisis de Factibilidad (Sección 3.5)');

  const cols = [
    {
      title:'✅  Técnica', color: C.green1,
      items:[
        'React 18 + Vite — Stack moderno y maduro.',
        'Ollama — Modelos IA en local, sin nube.',
        'Docker — Despliegue portable y reproducible.',
        'pgvector — Búsqueda vectorial en PostgreSQL.',
        'Funciona con conexión intermitente (edge).',
        'TypeScript — Código tipado y menos errores.',
      ]
    },
    {
      title:'💰  Económica', color: C.teal,
      items:[
        '$0 en APIs externas (OpenAI, Google AI).',
        'Hardware: PC estándar con 8 GB RAM.',
        'Open Source: Todas las tecnologías son gratuitas.',
        'Sin costo por consulta al chatbot.',
        'Escalable sin costo adicional de infraestructura.',
        'Solo costo: servidor local para producción.',
      ]
    },
    {
      title:'👥  Operativa', color: C.lime,
      items:[
        'Interfaz intuitiva, sin curva de aprendizaje.',
        'Acceso con cuenta Google (ya la tienen).',
        'Respuestas en lenguaje natural simple.',
        'Funciona en celular, tablet o PC.',
        'Agregar datos: solo ejecutar script de ingestión.',
        'Manual de instalación incluido (INSTALLATION.md).',
      ]
    },
  ];

  cols.forEach((col, i) => {
    const x = 0.15 + i * 4.45;
    s.addShape(prs.ShapeType.roundRect, { x, y:1.25, w:4.25, h:5.55, fill:{color:C.white}, line:{color:col.color,width:2}, rectRadius:0.18,
      shadow:{type:'outer', blur:12, offset:4, angle:45, color:'00000018'} });
    s.addShape(prs.ShapeType.roundRect, { x, y:1.25, w:4.25, h:0.72, fill:{color:col.color}, line:{color:col.color}, rectRadius:0.18 });
    s.addText(col.title, { x:x+0.15, y:1.29, w:3.95, h:0.62, fontSize:14, bold:true, color:C.white, fontFace:'Calibri', valign:'middle' });
    col.items.forEach((item, j) => {
      const y = 2.1 + j * 0.72;
      s.addShape(prs.ShapeType.ellipse, { x:x+0.15, y: y+0.08, w:0.22, h:0.22, fill:{color:col.color}, line:{color:col.color} });
      s.addText(item, { x:x+0.45, y, w:3.7, h:0.65, fontSize:11, color:C.dark, fontFace:'Calibri', wrap:true, valign:'middle' });
    });
  });

  bottomBrand(s); pageNum(s,12);
}

// ─── SLIDE 13: CITA CIERRE ────────────────────────────────────────────────────
{
  const s = prs.addSlide();
  s.addShape(prs.ShapeType.rect, { x:0, y:0, w:'100%', h:'100%', fill:{color:C.dark} });
  s.addShape(prs.ShapeType.rect, { x:0, y:0, w:0.6, h:'100%', fill:{color:C.lime}, line:{color:C.lime} });
  s.addShape(prs.ShapeType.rect, { x:0, y:7.2, w:'100%', h:0.3, fill:{color:C.green1}, line:{color:C.green1} });

  // Big quote mark
  s.addText('\u201C', { x:0.5, y:0.3, w:3, h:2, fontSize:130, color:C.lime, fontFace:'Georgia', bold:true });

  s.addText(
    'AgroBot transforma más de 60 calendarios de fertilización históricos en una herramienta de consulta inteligente, accesible e inmediata — democratizando el conocimiento agronómico técnico de la zona occidental de El Salvador.',
    { x:1.0, y:1.5, w:12, h:3.5, fontSize:22, color:C.white, fontFace:'Calibri', italic:true, wrap:true, lineSpacingMultiple:1.5, align:'left', valign:'middle' }
  );

  s.addShape(prs.ShapeType.rect, { x:1.0, y:5.1, w:4.5, h:0.06, fill:{color:C.lime}, line:{color:C.lime} });
  s.addText('— Capítulo 3: Metodología de AgroBot — 2026', {
    x:1.0, y:5.25, w:10, h:0.5, fontSize:14, color:C.lime, fontFace:'Calibri', bold:true
  });
  // Metrics row
  const metrics = [
    { val:'60+', label:'Calendarios' },
    { val:'10', label:'Años de datos' },
    { val:'85%', label:'Precisión objetivo' },
    { val:'$0', label:'Costo en APIs' },
  ];
  metrics.forEach((m,i) => {
    const x = 1.0 + i*3.1;
    s.addText(m.val, { x, y:5.85, w:3, h:0.65, fontSize:28, bold:true, color:C.lime, fontFace:'Calibri' });
    s.addText(m.label, { x, y:6.45, w:3, h:0.35, fontSize:11, color:C.gray2, fontFace:'Calibri' });
  });
  pageNum(s,13);
}

// ─── SLIDE 14: GRACIAS ────────────────────────────────────────────────────────
{
  const s = prs.addSlide();
  s.addShape(prs.ShapeType.rect, { x:0, y:0, w:'100%', h:'100%', fill:{color:C.dark} });
  s.addShape(prs.ShapeType.rect, { x:0, y:0, w:'100%', h:0.2, fill:{color:C.lime}, line:{color:C.lime} });
  s.addShape(prs.ShapeType.rect, { x:0, y:7.3, w:'100%', h:0.2, fill:{color:C.lime}, line:{color:C.lime} });
  // Big circles deco
  s.addShape(prs.ShapeType.ellipse, { x:-1.5, y:-1.5, w:5, h:5, fill:{color:C.green1}, line:{color:C.green1} });
  s.addShape(prs.ShapeType.ellipse, { x:10.5, y:4, w:5, h:5, fill:{color:'0A2A18'}, line:{color:'0A2A18'} });

  s.addText('¡Gracias!', {
    x:0.5, y:1.4, w:12.5, h:1.6,
    fontSize:62, bold:true, color:C.white, align:'center', fontFace:'Calibri',
  });
  s.addShape(prs.ShapeType.rect, { x:4.5, y:3.1, w:4.5, h:0.1, fill:{color:C.lime}, line:{color:C.lime} });
  s.addText('¿Preguntas?', {
    x:0.5, y:3.3, w:12.5, h:0.9,
    fontSize:30, color:C.lime, align:'center', fontFace:'Calibri', italic:true,
  });
  s.addText('AgroBot — Asistente Virtual para Fertilización Agrícola\nUniversidad de Sonsonate  |  Facultad de Ingeniería y Ciencias Naturales  |  2026', {
    x:0.5, y:6.0, w:12.5, h:1.0,
    fontSize:13, color:C.gray2, align:'center', fontFace:'Calibri', wrap:true, lineSpacingMultiple:1.4,
  });
}

// ─── GUARDAR ──────────────────────────────────────────────────────────────────
prs.writeFile({ fileName: 'C:/Users/Moris/OneDrive/Documentos/Tesis/AgroBot_Presentacion_Cap3_v2.pptx' })
  .then(() => console.log('✅  Presentación v2 creada: AgroBot_Presentacion_Cap3_v2.pptx'))
  .catch(err => console.error('❌ Error:', err));
