export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { context } = req.body;

  async function ask(prompt, maxTokens = 2000) {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: maxTokens,
        system: 'Eres analista de inversiones. Responde SOLO JSON valido, sin backticks, sin texto extra.',
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const d = await r.json();
    const txt = (d.content || []).map(b => b.text || '').join('').trim();
    const s = txt.indexOf('{'), e = txt.lastIndexOf('}');
    if (s === -1 || e === -1) throw new Error('No JSON found');
    return JSON.parse(txt.substring(s, e + 1));
  }

  try {
    // Dos llamadas en paralelo con JSONs cortos
    const [p1, p2] = await Promise.all([
      ask(`${context}\n\nJSON parte 1 — valores concisos (max 2 oraciones por campo):\n{"emprendedor":"","proyecto":"","industria":"","fecha":"${new Date().toLocaleDateString('es-MX')}","tagline":"1 linea","resumen_ejecutivo":"3 oraciones","tesis_inversion":"2 oraciones","problema_detallado":"2 oraciones","solucion_detallada":"2 oraciones","validacion_demanda":"1 oracion","tam":"numero y metodologia","sam":"numero","som_y3":"numero y %","contexto_mercado":"1 oracion","ventaja_competitiva":"1 oracion","moat":"1 oracion","rol_ia":"1 oracion","competidores":"1 oracion","equipo_descripcion":"2 oraciones","perfil_faltante":"1 oracion","riesgo_equipo":"1 oracion","recomendacion":"PITCH AL CONSEJO","tesis_corta":"1 oracion","comentario_don_juan":"frase memorable","siguiente_paso":"accion concreta","ia_score":7,"mercado_score":7,"equipo_score":7,"modelo_score":7,"riesgo_score":7,"traccion_score":7,"financiero_score":7}`),
      ask(`${context}\n\nJSON parte 2 — datos financieros y operativos concisos:\n{"fuentes_ingreso":"f1;f2;f3","ticket_promedio":"","margen_bruto":"","cac":"","ltv":"","ltv_cac_ratio":"","payback_period":"","ingresos_y1":"","ingresos_y2":"","ingresos_y3":"","ebitda_y1":"","ebitda_y2":"","ebitda_y3":"","clientes_y1":"","clientes_y2":"","clientes_y3":"","breakeven_mes":"","supuestos_financieros":"s1;s2;s3","inversion_solicitada":"","tipo_instrumento":"","participacion_ofrecida":"","valoracion_pre_money":"","uso_de_fondos":"40% X;30% Y;30% Z","runway":"","proxima_ronda":"","roi_3a":"","roi_5a":"","tir":"","multiple_capital":"","escenario_salida":"1 oracion","escenario_conservador":"1 oracion","escenario_optimista":"1 oracion","hitos_6meses":"h1;h2;h3","hitos_12meses":"h1;h2;h3","hitos_24meses":"h1;h2;h3","kpis_principales":"k1;k2;k3;k4;k5","riesgo_principal":"1 oracion","riesgo_2":"1 oracion","riesgo_3":"1 oracion","riesgo_mercado":"1 oracion","riesgo_ejecucion":"1 oracion","fortalezas":"f1;f2;f3","debilidades":"d1;d2;d3","oportunidades":"o1;o2","amenazas":"a1;a2","condiciones_inversion":"1-2 oraciones","preguntas_consejo":"p1;p2;p3;p4","tareas":["t1","t2","t3"]}`)
    ]);

    return res.json({ memo: { ...p1, ...p2 } });
  } catch (e) {
    console.error('Memo error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}

export const config = { maxDuration: 60 };
