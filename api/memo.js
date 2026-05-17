export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { formData, conversation } = req.body;

  // Truncar conversación a máximo 3000 caracteres para no exceder tokens
  const convTruncated = (conversation || '').substring(0, 3000);

  async function askJSON(userMsg, maxTokens = 2500) {
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
        system: 'Eres analista senior de Murguia Emprende, un family office mexicano. RESPONDE UNICAMENTE con un objeto JSON valido. Absolutamente nada de texto antes o despues del JSON. No uses backticks. El JSON debe estar completo y bien cerrado.',
        messages: [{ role: 'user', content: userMsg }]
      })
    });
    const d = await r.json();
    if (!d?.content) throw new Error('Sin respuesta de API');
    const txt = d.content.map(b => b.text || '').join('').trim();
    const s = txt.indexOf('{');
    const e = txt.lastIndexOf('}');
    if (s === -1 || e === -1) throw new Error('Respuesta sin JSON: ' + txt.substring(0, 100));
    return JSON.parse(txt.substring(s, e + 1));
  }

  const base = `
PROYECTO: ${formData.proyecto || '—'} | EMPRENDEDOR: ${formData.emprendedor || '—'} | INDUSTRIA: ${formData.industria || '—'}
PROBLEMA: ${formData.problema || '—'}
SOLUCIÓN: ${formData.solucion || '—'}
MERCADO: ${formData.mercado || '—'} | DEMANDA: ${formData.demanda || '—'}
MODELO: ${formData.modelo || '—'} | PRECIO: ${formData.precio || '—'} | CAC: ${formData.cac || '—'}
VENTAJA: ${formData.ventaja || '—'} | COMPETENCIA: ${formData.competencia || '—'}
IA: ${formData.ia || '—'}
EQUIPO: ${formData.equipo || '—'} | FALTA: ${formData.falta || '—'}
INVERSIÓN: ${formData.inversion || '—'} | USO: ${formData.uso || '—'} | RETORNO: ${formData.retorno || '—'}
RIESGO: ${formData.riesgo || '—'} | KPIS: ${formData.kpis || '—'}
CONVERSACIÓN CLAVE CON DON JUAN:
${convTruncated}`.trim();

  try {
    const [p1, p2] = await Promise.all([

      askJSON(`Datos del proyecto:\n${base}\n\nGenera exactamente este JSON con valores reales y concretos basados en los datos. Sé breve en cada campo (1-2 oraciones máximo):\n{"emprendedor":"${formData.emprendedor}","proyecto":"${formData.proyecto}","industria":"${formData.industria}","fecha":"${new Date().toLocaleDateString('es-MX')}","tagline":"una línea","resumen_ejecutivo":"3 oraciones","tesis_inversion":"2 oraciones","problema_detallado":"2 oraciones","solucion_detallada":"2 oraciones","validacion_demanda":"1 oración","tam":"número + metodología","sam":"número","som_y3":"número + porcentaje","contexto_mercado":"1 oración","ventaja_competitiva":"1 oración","moat":"1 oración","rol_ia":"1 oración","competidores":"1 oración","equipo_descripcion":"2 oraciones","perfil_faltante":"1 oración","riesgo_equipo":"1 oración","riesgo_principal":"1 oración","riesgo_2":"1 oración","riesgo_3":"1 oración","riesgo_mercado":"1 oración","riesgo_ejecucion":"1 oración","fortalezas":"f1;f2;f3","debilidades":"d1;d2;d3","oportunidades":"o1;o2","amenazas":"a1;a2","hitos_6meses":"h1;h2;h3","hitos_12meses":"h1;h2;h3","hitos_24meses":"h1;h2;h3","kpis_principales":"k1;k2;k3;k4;k5","ia_score":7,"mercado_score":7,"equipo_score":7,"modelo_score":7,"riesgo_score":7,"traccion_score":7,"financiero_score":7,"recomendacion":"PITCH AL CONSEJO","condiciones_inversion":"1 oración","preguntas_consejo":"p1;p2;p3;p4","siguiente_paso":"acción concreta","comentario_don_juan":"frase al estilo Don Juan","tareas":["tarea 1","tarea 2","tarea 3"]}`),

      askJSON(`Datos del proyecto:\n${base}\n\nGenera exactamente este JSON con números reales estimados. Sé conciso:\n{"fuentes_ingreso":"f1;f2;f3","ticket_promedio":"monto","margen_bruto":"%","cac":"monto","ltv":"monto","ltv_cac_ratio":"ratio","payback_period":"meses","ingresos_y1":"monto MXN","ingresos_y2":"monto MXN","ingresos_y3":"monto MXN","ebitda_y1":"monto MXN","ebitda_y2":"monto MXN","ebitda_y3":"monto MXN","clientes_y1":"número","clientes_y2":"número","clientes_y3":"número","breakeven_mes":"mes N","supuestos_financieros":"s1;s2;s3","inversion_solicitada":"${formData.inversion}","tipo_instrumento":"tipo","participacion_ofrecida":"%","valoracion_pre_money":"monto","uso_de_fondos":"40% X; 30% Y; 30% Z","runway":"N meses","proxima_ronda":"descripción","roi_3a":"%","roi_5a":"%","tir":"%","multiple_capital":"Nx","escenario_salida":"1 oración","escenario_conservador":"1 oración","escenario_optimista":"1 oración"}`)

    ]);

    return res.json({ memo: { ...p1, ...p2 } });

  } catch (e) {
    console.error('Memo error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
