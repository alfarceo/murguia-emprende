export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { memo, formData } = req.body;
  const m = memo || {};
  const f = formData || {};

  const nombre = m.proyecto || f.proyecto || 'Proyecto';
  const emprendedor = m.emprendedor || f.emprendedor || '';
  const tagline = m.tagline || '';
  const fecha = m.fecha || new Date().toLocaleDateString('es-MX', { year:'numeric', month:'long', day:'numeric' });

  const rec = m.recomendacion || '';
  const recColor = rec.includes('PITCH') ? '#c9a84c' : rec.includes('REVISAR') ? '#ff9800' : '#f44336';

  function bullets(str) {
    if (!str) return '<li style="color:#666">—</li>';
    return str.split(';').map(s => s.trim()).filter(Boolean).map(s => `<li>${s}</li>`).join('');
  }

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${nombre} — Murguía Emprende</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap');
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Inter',sans-serif;background:#0a0a0f;color:#f0ece4;print-color-adjust:exact;-webkit-print-color-adjust:exact;}

  /* SLIDE BASE */
  .slide{width:100%;min-height:100vh;display:flex;flex-direction:column;justify-content:center;padding:60px 80px;page-break-after:always;position:relative;border-bottom:1px solid #1a1a2e;}
  .slide:last-child{border-bottom:none;}

  /* WATERMARK */
  .slide::before{content:'MURGUÍA EMPRENDE';position:absolute;bottom:28px;right:40px;font-size:10px;letter-spacing:.2em;color:#2a2a3a;font-weight:500;}
  .slide-num{position:absolute;bottom:28px;left:40px;font-size:11px;color:#2a2a3a;letter-spacing:.08em;}

  /* COVER */
  .cover{background:linear-gradient(135deg,#0a0a0f 0%,#0f1123 40%,#0a0a0f 100%);text-align:center;align-items:center;gap:0;}
  .cover-seal{width:72px;height:72px;border-radius:50%;border:1.5px solid #c9a84c;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:24px;color:#c9a84c;margin:0 auto 28px;}
  .cover-eyebrow{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#c9a84c;margin-bottom:16px;}
  .cover-title{font-family:'Playfair Display',serif;font-size:52px;line-height:1.15;color:#f0ece4;margin-bottom:12px;}
  .cover-tagline{font-size:17px;color:#8a8680;font-weight:300;max-width:600px;margin:0 auto 36px;line-height:1.6;}
  .cover-badge{display:inline-block;padding:8px 24px;border-radius:24px;font-size:12px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;border:1px solid;margin-bottom:40px;}
  .cover-meta{display:flex;gap:48px;justify-content:center;flex-wrap:wrap;}
  .cover-metric{text-align:center;}
  .cover-metric-n{font-family:'Playfair Display',serif;font-size:22px;color:#c9a84c;margin-bottom:4px;}
  .cover-metric-l{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#5a5650;}
  .cover-footer{position:absolute;bottom:28px;left:50%;transform:translateX(-50%);font-size:11px;color:#3a3a4a;letter-spacing:.08em;}

  /* SLIDES NORMALES */
  .slide-eyebrow{font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#c9a84c;margin-bottom:14px;}
  .slide-title{font-family:'Playfair Display',serif;font-size:36px;color:#f0ece4;margin-bottom:32px;line-height:1.2;}
  .slide-body{font-size:15px;color:#c0bcb4;line-height:1.75;}
  p+p{margin-top:14px;}

  /* GRID DE MÉTRICAS */
  .metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;margin:28px 0;}
  .metric{background:#0f1020;border:1px solid #1e1e2e;border-radius:12px;padding:20px 18px;}
  .metric-n{font-family:'Playfair Display',serif;font-size:24px;color:#c9a84c;margin-bottom:4px;}
  .metric-l{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#5a5650;}

  /* TABLA */
  table{width:100%;border-collapse:collapse;margin-top:20px;}
  th{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#5a5650;padding:10px 14px;border-bottom:1px solid #1e1e2e;text-align:left;}
  td{font-size:14px;color:#c0bcb4;padding:12px 14px;border-bottom:1px solid #12121e;}
  tr:last-child td{border-bottom:none;}
  td:first-child{color:#f0ece4;}

  /* COLUMNAS */
  .cols{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-top:20px;}
  .cols-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;margin-top:20px;}
  .col-box{background:#0f1020;border:1px solid #1e1e2e;border-radius:12px;padding:20px;}
  .col-box-title{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#c9a84c;margin-bottom:12px;font-weight:500;}
  .col-box ul{padding-left:16px;color:#c0bcb4;font-size:14px;line-height:1.8;}

  /* FODA */
  .foda{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:20px;}
  .foda-box{border-radius:10px;padding:18px;}
  .foda-box.f{background:#0d1a0f;border:1px solid #1a3a1e;}
  .foda-box.o{background:#1a140a;border:1px solid #3a2810;}
  .foda-box.d{background:#1a0d0d;border:1px solid #3a1515;}
  .foda-box.a{background:#0f0f1a;border:1px solid #1e1e3a;}
  .foda-label{font-size:10px;letter-spacing:.12em;text-transform:uppercase;font-weight:500;margin-bottom:10px;}
  .foda-box.f .foda-label{color:#4caf50;}
  .foda-box.o .foda-label{color:#ff9800;}
  .foda-box.d .foda-label{color:#f44336;}
  .foda-box.a .foda-label{color:#9c27b0;}
  .foda-box ul{padding-left:14px;font-size:13px;color:#c0bcb4;line-height:1.75;}

  /* SCORES */
  .scores{display:flex;gap:12px;flex-wrap:wrap;margin-top:20px;}
  .score-item{flex:1;min-width:100px;background:#0f1020;border:1px solid #1e1e2e;border-radius:10px;padding:16px;text-align:center;}
  .score-n{font-size:28px;font-family:'Playfair Display',serif;font-weight:600;line-height:1;}
  .score-l{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#5a5650;margin-top:6px;}
  .s-hi{color:#4caf50;} .s-mid{color:#ff9800;} .s-lo{color:#f44336;}

  /* VEREDICTO */
  .veredicto{background:linear-gradient(135deg,#0f1020,#0a0a15);border:1px solid #c9a84c;border-radius:16px;padding:32px;text-align:center;margin-top:24px;}
  .veredicto-quote{font-family:'Playfair Display',serif;font-style:italic;font-size:20px;line-height:1.6;color:#f0ece4;margin-bottom:20px;}
  .veredicto-tag{font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:#c9a84c;}

  /* ESCENARIOS */
  .escenarios{display:flex;flex-direction:column;gap:10px;margin-top:20px;}
  .esc-row{display:flex;align-items:flex-start;gap:16px;padding:14px 16px;background:#0f1020;border-radius:10px;border:1px solid #1e1e2e;}
  .esc-dot{width:12px;height:12px;border-radius:50%;flex-shrink:0;margin-top:3px;}
  .esc-label{font-size:11px;font-weight:500;color:#8a8680;min-width:90px;}
  .esc-text{font-size:14px;color:#c0bcb4;line-height:1.6;}

  @media print{
    .slide{min-height:100vh;page-break-after:always;}
    .slide:last-child{page-break-after:avoid;}
  }
</style>
</head>
<body>

<!-- PORTADA -->
<div class="slide cover">
  <div class="cover-seal">MV</div>
  <div class="cover-eyebrow">Murguía Emprende · Investment Pitch</div>
  <h1 class="cover-title">${nombre}</h1>
  <p class="cover-tagline">${tagline}</p>
  <div class="cover-badge" style="color:${recColor};border-color:${recColor};background:${recColor}15">${rec || 'En evaluación'}</div>
  <div class="cover-meta">
    <div class="cover-metric"><div class="cover-metric-n">${m.inversion_solicitada || f.inversion || '—'}</div><div class="cover-metric-l">Inversión solicitada</div></div>
    <div class="cover-metric"><div class="cover-metric-n">${m.tir || '—'}</div><div class="cover-metric-l">TIR estimada</div></div>
    <div class="cover-metric"><div class="cover-metric-n">${m.multiple_capital || '—'}</div><div class="cover-metric-l">Múltiplo esperado</div></div>
    <div class="cover-metric"><div class="cover-metric-n">${m.participacion_ofrecida || '—'}</div><div class="cover-metric-l">Participación ofrecida</div></div>
  </div>
  <div class="cover-footer">${emprendedor} · ${fecha} · Confidencial</div>
  <div class="slide-num">01</div>
</div>

<!-- RESUMEN EJECUTIVO -->
<div class="slide">
  <div class="slide-eyebrow">01 — Resumen ejecutivo</div>
  <h2 class="slide-title">La oportunidad</h2>
  <div class="slide-body">
    <p>${m.resumen_ejecutivo || f.problema || '—'}</p>
    <div style="margin-top:28px;padding:20px 24px;background:#0f1020;border-left:3px solid #c9a84c;border-radius:0 10px 10px 0">
      <div style="font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#c9a84c;margin-bottom:8px">Tesis de inversión</div>
      <p style="color:#f0ece4;font-size:15px">${m.tesis_inversion || '—'}</p>
    </div>
  </div>
  <div class="slide-num">02</div>
</div>

<!-- PROBLEMA Y SOLUCIÓN -->
<div class="slide">
  <div class="slide-eyebrow">02 — Problema & Solución</div>
  <h2 class="slide-title">¿Qué resuelve?</h2>
  <div class="cols">
    <div class="col-box">
      <div class="col-box-title">El problema</div>
      <p style="font-size:14px;color:#c0bcb4;line-height:1.75">${m.problema_detallado || f.problema || '—'}</p>
    </div>
    <div class="col-box">
      <div class="col-box-title">La solución</div>
      <p style="font-size:14px;color:#c0bcb4;line-height:1.75">${m.solucion_detallada || f.solucion || '—'}</p>
    </div>
  </div>
  <div style="margin-top:16px;padding:14px 18px;background:#0f1020;border:1px solid #1e1e2e;border-radius:10px">
    <span style="font-size:12px;color:#8a8680">Validación de demanda: </span>
    <span style="font-size:14px;color:#f0ece4">${m.validacion_demanda || '—'}</span>
  </div>
  <div class="slide-num">03</div>
</div>

<!-- MERCADO -->
<div class="slide">
  <div class="slide-eyebrow">03 — Mercado</div>
  <h2 class="slide-title">¿Qué tan grande es la oportunidad?</h2>
  <div class="cols-3">
    <div class="col-box" style="border-color:#c9a84c40">
      <div class="col-box-title">TAM — Mercado total</div>
      <div style="font-family:'Playfair Display',serif;font-size:22px;color:#c9a84c;margin:8px 0">${m.tam || '—'}</div>
    </div>
    <div class="col-box">
      <div class="col-box-title">SAM — Mercado servible</div>
      <div style="font-family:'Playfair Display',serif;font-size:22px;color:#f0ece4;margin:8px 0">${m.sam || '—'}</div>
    </div>
    <div class="col-box" style="border-color:#4caf5040">
      <div class="col-box-title">SOM — Objetivo 3 años</div>
      <div style="font-family:'Playfair Display',serif;font-size:22px;color:#4caf50;margin:8px 0">${m.som_y3 || '—'}</div>
    </div>
  </div>
  <p style="margin-top:20px;font-size:14px;color:#8a8680;line-height:1.7">${m.contexto_mercado || '—'}</p>
  <div class="slide-num">04</div>
</div>

<!-- MODELO DE NEGOCIO + UNIT ECONOMICS -->
<div class="slide">
  <div class="slide-eyebrow">04 — Modelo de negocio</div>
  <h2 class="slide-title">¿Cómo genera dinero?</h2>
  <div class="metrics">
    <div class="metric"><div class="metric-n">${m.ticket_promedio || '—'}</div><div class="metric-l">Ticket promedio</div></div>
    <div class="metric"><div class="metric-n">${m.margen_bruto || '—'}</div><div class="metric-l">Margen bruto</div></div>
    <div class="metric"><div class="metric-n">${m.cac || '—'}</div><div class="metric-l">CAC</div></div>
    <div class="metric"><div class="metric-n">${m.ltv || '—'}</div><div class="metric-l">LTV</div></div>
    <div class="metric"><div class="metric-n">${m.ltv_cac_ratio || '—'}</div><div class="metric-l">LTV / CAC</div></div>
    <div class="metric"><div class="metric-n">${m.payback_period || '—'}</div><div class="metric-l">Payback (meses)</div></div>
  </div>
  <div style="padding:14px 18px;background:#0f1020;border-radius:10px;border:1px solid #1e1e2e">
    <div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#5a5650;margin-bottom:8px">Fuentes de ingreso</div>
    <ul style="padding-left:16px;color:#c0bcb4;font-size:14px;line-height:1.8">${bullets(m.fuentes_ingreso)}</ul>
  </div>
  <div class="slide-num">05</div>
</div>

<!-- PROYECCIONES FINANCIERAS -->
<div class="slide">
  <div class="slide-eyebrow">05 — Proyecciones financieras</div>
  <h2 class="slide-title">Los números</h2>
  <table>
    <thead><tr><th>Métrica</th><th>Año 1</th><th>Año 2</th><th>Año 3</th></tr></thead>
    <tbody>
      <tr><td>Ingresos</td><td>${m.ingresos_y1||'—'}</td><td>${m.ingresos_y2||'—'}</td><td>${m.ingresos_y3||'—'}</td></tr>
      <tr><td>EBITDA</td><td>${m.ebitda_y1||'—'}</td><td>${m.ebitda_y2||'—'}</td><td>${m.ebitda_y3||'—'}</td></tr>
      <tr><td>Clientes / Unidades</td><td>${m.clientes_y1||'—'}</td><td>${m.clientes_y2||'—'}</td><td>${m.clientes_y3||'—'}</td></tr>
    </tbody>
  </table>
  <div style="display:flex;gap:16px;margin-top:16px;flex-wrap:wrap">
    <div style="padding:12px 18px;background:#0f1020;border-radius:10px;border:1px solid #1e1e2e;flex:1">
      <div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#5a5650;margin-bottom:4px">Breakeven</div>
      <div style="font-size:15px;color:#f0ece4">${m.breakeven_mes||'—'}</div>
    </div>
    <div style="padding:12px 18px;background:#0f1020;border-radius:10px;border:1px solid #1e1e2e;flex:1">
      <div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#5a5650;margin-bottom:4px">Supuestos clave</div>
      <div style="font-size:13px;color:#c0bcb4">${(m.supuestos_financieros||'').split(';')[0]||'—'}</div>
    </div>
  </div>
  <div class="slide-num">06</div>
</div>

<!-- INVERSIÓN Y RETORNOS -->
<div class="slide">
  <div class="slide-eyebrow">06 — Estructura de inversión</div>
  <h2 class="slide-title">Lo que se solicita y lo que regresa</h2>
  <div class="cols">
    <div>
      <table>
        <tbody>
          <tr><td>Inversión solicitada</td><td style="color:#c9a84c;font-weight:500">${m.inversion_solicitada||f.inversion||'—'}</td></tr>
          <tr><td>Instrumento</td><td>${m.tipo_instrumento||'—'}</td></tr>
          <tr><td>Participación ofrecida</td><td>${m.participacion_ofrecida||'—'}</td></tr>
          <tr><td>Valuación pre-money</td><td>${m.valoracion_pre_money||'—'}</td></tr>
          <tr><td>Runway</td><td>${m.runway||'—'}</td></tr>
          <tr><td>Siguiente ronda</td><td>${m.proxima_ronda||'—'}</td></tr>
        </tbody>
      </table>
    </div>
    <div style="display:flex;flex-direction:column;gap:12px">
      <div class="metric"><div class="metric-n s-hi">${m.tir||'—'}</div><div class="metric-l">TIR estimada (5 años)</div></div>
      <div class="metric"><div class="metric-n s-hi">${m.roi_3a||'—'}</div><div class="metric-l">ROI a 3 años</div></div>
      <div class="metric"><div class="metric-n s-hi">${m.multiple_capital||'—'}</div><div class="metric-l">Múltiplo esperado</div></div>
    </div>
  </div>
  <p style="margin-top:14px;font-size:13px;color:#5a5650">Uso de fondos: ${m.uso_de_fondos||f.uso||'—'}</p>
  <div class="slide-num">07</div>
</div>

<!-- ESCENARIOS -->
<div class="slide">
  <div class="slide-eyebrow">07 — Escenarios de retorno</div>
  <h2 class="slide-title">¿Qué puede pasar?</h2>
  <div class="escenarios">
    <div class="esc-row"><div class="esc-dot" style="background:#4caf50"></div><div><div class="esc-label">🟢 Optimista</div><div class="esc-text">${m.escenario_optimista||'—'}</div></div></div>
    <div class="esc-row"><div class="esc-dot" style="background:#c9a84c"></div><div><div class="esc-label">🟡 Base</div><div class="esc-text">${m.escenario_salida||'—'}</div></div></div>
    <div class="esc-row"><div class="esc-dot" style="background:#f44336"></div><div><div class="esc-label">🔴 Conservador</div><div class="esc-text">${m.escenario_conservador||'—'}</div></div></div>
  </div>
  <div class="slide-num">08</div>
</div>

<!-- VENTAJA COMPETITIVA -->
<div class="slide">
  <div class="slide-eyebrow">08 — Ventaja competitiva</div>
  <h2 class="slide-title">¿Por qué es difícil de copiar?</h2>
  <div class="cols">
    <div class="col-box">
      <div class="col-box-title">Ventaja competitiva</div>
      <p style="font-size:14px;color:#c0bcb4;line-height:1.75">${m.ventaja_competitiva||f.ventaja||'—'}</p>
    </div>
    <div class="col-box">
      <div class="col-box-title">Foso defensivo (Moat)</div>
      <p style="font-size:14px;color:#c0bcb4;line-height:1.75">${m.moat||'—'}</p>
    </div>
  </div>
  <div style="margin-top:14px;padding:16px 18px;background:#0f1020;border:1px solid #1e2a1e;border-radius:10px">
    <div class="col-box-title" style="color:#4caf50">Rol de la IA</div>
    <p style="font-size:14px;color:#c0bcb4;line-height:1.75;margin-top:8px">${m.rol_ia||f.ia||'—'}</p>
  </div>
  <div class="slide-num">09</div>
</div>

<!-- EQUIPO Y ROADMAP -->
<div class="slide">
  <div class="slide-eyebrow">09 — Equipo & Roadmap</div>
  <h2 class="slide-title">Quiénes lo hacen y a dónde van</h2>
  <div class="cols">
    <div>
      <div class="col-box" style="margin-bottom:12px">
        <div class="col-box-title">El equipo</div>
        <p style="font-size:14px;color:#c0bcb4;line-height:1.75">${m.equipo_descripcion||f.equipo||'—'}</p>
        ${m.perfil_faltante?`<p style="margin-top:10px;font-size:13px;color:#ff9800">⚠ Buscan: ${m.perfil_faltante}</p>`:''}
      </div>
    </div>
    <div>
      <table>
        <thead><tr><th>Horizonte</th><th>Hitos</th></tr></thead>
        <tbody>
          <tr><td>6 meses</td><td style="font-size:13px">${(m.hitos_6meses||'').split(';')[0]||'—'}</td></tr>
          <tr><td>12 meses</td><td style="font-size:13px">${(m.hitos_12meses||'').split(';')[0]||'—'}</td></tr>
          <tr><td>24 meses</td><td style="font-size:13px">${(m.hitos_24meses||'').split(';')[0]||'—'}</td></tr>
        </tbody>
      </table>
    </div>
  </div>
  <div class="slide-num">10</div>
</div>

<!-- FODA -->
<div class="slide">
  <div class="slide-eyebrow">10 — Análisis FODA</div>
  <h2 class="slide-title">Visión honesta del proyecto</h2>
  <div class="foda">
    <div class="foda-box f"><div class="foda-label">✓ Fortalezas</div><ul>${bullets(m.fortalezas)}</ul></div>
    <div class="foda-box d"><div class="foda-label">⚠ Debilidades</div><ul>${bullets(m.debilidades)}</ul></div>
    <div class="foda-box o"><div class="foda-label">↗ Oportunidades</div><ul>${bullets(m.oportunidades)}</ul></div>
    <div class="foda-box a"><div class="foda-label">⚡ Amenazas</div><ul>${bullets(m.amenazas)}</ul></div>
  </div>
  <div class="slide-num">11</div>
</div>

<!-- SCORECARD -->
<div class="slide">
  <div class="slide-eyebrow">11 — Evaluación del consejo</div>
  <h2 class="slide-title">Scorecard</h2>
  <div class="scores">
    ${[['Mercado',m.mercado_score],['Modelo',m.modelo_score],['Equipo',m.equipo_score],['IA',m.ia_score],['Riesgo',m.riesgo_score],['Tracción',m.traccion_score],['Financiero',m.financiero_score]].map(([l,s])=>`
      <div class="score-item">
        <div class="score-n ${!s?'':s>=7?'s-hi':s>=5?'s-mid':'s-lo'}">${s||'—'}</div>
        <div class="score-l">${l}</div>
      </div>`).join('')}
  </div>
  <div style="margin-top:20px;display:flex;gap:12px;flex-wrap:wrap">
    <div style="flex:1;padding:14px 18px;background:#0f1020;border-radius:10px;border:1px solid #1e1e2e">
      <div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#5a5650;margin-bottom:8px">Condiciones de inversión</div>
      <p style="font-size:14px;color:#c0bcb4;line-height:1.7">${m.condiciones_inversion||'—'}</p>
    </div>
  </div>
  <div class="slide-num">12</div>
</div>

<!-- DON JUAN DICE -->
<div class="slide" style="background:linear-gradient(135deg,#0a0a0f,#0f1020);justify-content:center;align-items:center;text-align:center">
  <div style="max-width:680px;margin:0 auto">
    <div style="font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#c9a84c;margin-bottom:28px">Don Juan Murguía Pozzi dice</div>
    <div class="veredicto">
      <p class="veredicto-quote">"${m.comentario_don_juan||'El que no arriesga, no gana. Pero el que no piensa, sí pierde.'}"</p>
      <div class="veredicto-tag">— Juan Murguía Pozzi · Murguía Emprende</div>
    </div>
    <div style="margin-top:28px;padding:18px 24px;background:#0f1020;border:1px solid #1e1e2e;border-radius:12px;text-align:left">
      <div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#5a5650;margin-bottom:8px">Siguiente paso obligatorio</div>
      <p style="font-size:15px;color:#f0ece4;line-height:1.65">${m.siguiente_paso||'—'}</p>
    </div>
  </div>
  <div class="slide-num">13</div>
</div>

</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${nombre.replace(/[^a-z0-9]/gi,'_')}_pitch.html"`);
  res.send(html);
}
