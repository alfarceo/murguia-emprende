export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { formData, conversation } = req.body;
  const convTruncated = (conversation || '').substring(0, 2000);

  async function askJSON(userMsg) {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        system: 'Eres analista senior de Murguia Emprende. RESPONDE UNICAMENTE con JSON valido y completo. Sin backticks. Sin texto antes o despues.',
        messages: [{ role: 'user', content: userMsg }]
      })
    });
    const d = await r.json();
    if (!d?.content) throw new Error('Sin respuesta de API');
    let txt = d.content.map(b => b.text || '').join('').trim();

    // Extraer desde el primer { hasta el último }
    const s = txt.indexOf('{');
    if (s === -1) throw new Error('Sin JSON en respuesta');
    txt = txt.substring(s);

    // Si está truncado (no termina en }), intentar repararlo
    if (!txt.endsWith('}')) {
      // Cortar en el último campo completo (termina en " o número antes de ,)
      const lastQuote = txt.lastIndexOf('",');
      const lastNum = txt.lastIndexOf(',');
      const cutAt = Math.max(lastQuote, lastNum);
      if (cutAt > 0) txt = txt.substring(0, cutAt);
      // Cerrar el JSON
      const opens = (txt.match(/{/g)||[]).length;
      const closes = (txt.match(/}/g)||[]).length;
      txt += '}'.repeat(Math.max(1, opens - closes));
    }

    return JSON.parse(txt);
  }

  const base = `PROYECTO: ${formData.proyecto} | EMPRENDEDOR: ${formData.emprendedor} | INDUSTRIA: ${formData.industria}
PROBLEMA: ${formData.problema}
SOLUCIÓN: ${formData.solucion}
MERCADO: ${formData.mercado} | DEMANDA: ${formData.demanda}
MODELO: ${formData.modelo} | PRECIO: ${formData.precio} | CAC: ${formData.cac}
VENTAJA: ${formData.ventaja} | COMPETENCIA: ${formData.competencia}
IA: ${formData.ia} | EQUIPO: ${formData.equipo} | FALTA: ${formData.falta}
INVERSIÓN: ${formData.inversion} | USO: ${formData.uso} | RETORNO: ${formData.retorno}
RIESGO: ${formData.riesgo} | KPIS: ${formData.kpis}
CONVERSACIÓN DON JUAN: ${convTruncated}`;

  try {
    const [p1, p2] = await Promise.all([

      askJSON(`${base}\n\nJSON parte 1 — valores concisos (max 1-2 oraciones por campo de texto):\n{"emprendedor":"${formData.emprendedor}","proyecto":"${formData.proyecto}","industria":"${formData.industria}","fecha":"${new Date().toLocaleDateString('es-MX')}","tagline":"","resumen_ejecutivo":"","tesis_inversion":"","problema_detallado":"","solucion_detallada":"","validacion_demanda":"","tam":"","sam":"","som_y3":"","contexto_mercado":"","ventaja_competitiva":"","moat":"","rol_ia":"","competidores":"","equipo_descripcion":"","perfil_faltante":"","riesgo_equipo":"","riesgo_principal":"","riesgo_2":"","riesgo_3":"","riesgo_mercado":"","riesgo_ejecucion":"","fortalezas":"f1;f2;f3","debilidades":"d1;d2;d3","oportunidades":"o1;o2","amenazas":"a1;a2","hitos_6meses":"h1;h2;h3","hitos_12meses":"h1;h2;h3","hitos_24meses":"h1;h2;h3","kpis_principales":"k1;k2;k3;k4;k5","ia_score":7,"mercado_score":7,"equipo_score":7,"modelo_score":7,"riesgo_score":7,"traccion_score":7,"financiero_score":7,"recomendacion":"PITCH AL CONSEJO","condiciones_inversion":"","preguntas_consejo":"p1;p2;p3;p4","siguiente_paso":"","comentario_don_juan":"","tareas":["t1","t2","t3"]}`),

      askJSON(`${base}\n\nJSON parte 2 — solo datos financieros concisos:\n{"fuentes_ingreso":"f1;f2","ticket_promedio":"","margen_bruto":"","cac":"","ltv":"","ltv_cac_ratio":"","payback_period":"","ingresos_y1":"","ingresos_y2":"","ingresos_y3":"","ebitda_y1":"","ebitda_y2":"","ebitda_y3":"","clientes_y1":"","clientes_y2":"","clientes_y3":"","breakeven_mes":"","supuestos_financieros":"s1;s2;s3","inversion_solicitada":"${formData.inversion}","tipo_instrumento":"","participacion_ofrecida":"","valoracion_pre_money":"","uso_de_fondos":"","runway":"","proxima_ronda":"","roi_3a":"","roi_5a":"","tir":"","multiple_capital":"","escenario_salida":"","escenario_conservador":"","escenario_optimista":""}`)

    ]);

    return res.json({ memo: { ...p1, ...p2 } });

  } catch (e) {
    console.error('Memo error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
