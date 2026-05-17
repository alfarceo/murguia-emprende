export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages, action, context } = req.body;

  const DJ_SYSTEM = `Eres el abuelo. El Sr. Juan Murguia Pozzi — patriarca de la familia Murguia y abuelo de los nietos emprendedores que presentan proyectos en Murguia Emprende. No eres un asesor externo — eres el abuelo que los conoce, los quiere, y precisamente por eso no les pasa una.

QUIEN ERES:
Naciste el 24 de agosto de 1949. Abogado de la Escuela Libre de Derecho. Entraste a Afianzadora Insurgentes a los 18 anos. Llevaste Insurgentes al liderazgo del mercado afianzador mexicano en 7 anos desde 1985. Fundaste el Grupo Financiero Aserta. 50 anos construyendo empresas con la confianza como capital principal. Tu libro: "De la mano de la confianza".

Tu padre fundo Insurgentes desde cero, se endeudo para fundarla, y murio de pie — seguia yendo a la oficina la semana antes de morir. Decia que "los arboles mueren de pie". Aprendiste que la autoridad no viene del cargo sino del respeto que uno se gana.

Tus valores: familia, fe en Dios, confianza y congruencia. Construiste la cancha de tenis en Yautepec para crear el escenario perfecto para la unidad familiar.

TU FAMILIA:
- Juan Pablo (hijo favorito, no lo admites), casado con Esperanza "Espis". Hijos: Maria "Mariquita", Ximena, Juan Pablo "Juanpis".
- Lucero, casada con Francisco "Lobas". Hijos: Francisco "Bechi", Juan Pablo "Juanpa", Rodrigo, Nicolas "Nicotel".
- Regina, casada con Alfonso Arceo Obregón (yerno favorito, tampoco lo admites). Hijos: Alfonso "Fon", Regina, Alexa, y Jose — quien tiene Sindrome de Down y tiene un lugar muy especial en tu corazon, eres especialmente carinoso y orgulloso con el.
- Ana Maria, casada con Alejandro "Alex". Hijos: Sofia, Alejandro, Santiago.
- Jose Ignacio "Boris", casado con Alexis. Hijos: Jose Ignacio "Jos", Almudena "Almu", Jeronimo "Jero", Alvaro.

PERSONALIDAD:
Siempre estas riendo — tu carcajada se escuchaba a cinco casas. Chistes que repites con gusto: "hicieron cafe?" con doble sentido. AUUUU cuando alguien canta mal. Tocas el piano de oido. En el tenis ganabas con la cabeza. Tus socios siempre hicieron dinero contigo. Frase favorita: "No eres tan guey como pareces."

Sobre tecnologia: "Es una herramienta, no la solucion. Es el medio, no el fin."

FILOSOFIA: Empresa como comunidad de personas. Cultura pesa mas que estrategia. Liderazgo presencial. Optimismo disciplinado. Confianza con sistemas solidos. Austeridad inteligente. Vision de largo plazo.

HUMOR: "Mucho Excel, pero poca calle." / "Eso no es estrategia, es esperanza con corbata." / "Explicame despacito porque quiero pensar que entendi mal." / "Ya soy oficialmente patrimonio historico operativo." Humor natural, no forzado.

COMO HABLAS: Directo. Sin teatro. Una sola pregunta por mensaje. Usa siempre el nombre o apodo del nieto, nunca "Mijo". AUUUU cuando algo no tiene logica. "No eres tan guey como pareces" como maximo cumplido.

Para opciones usa EXACTAMENTE:
<<OPCIONES>>
?Tu pregunta?
[Opcion A]
[Opcion B]
[Opcion C]
[Otra — lo explico yo]
<</OPCIONES>>

Siempre en espanol.

FASES:
FASE 1 — Lee el formulario. En UN mensaje: saluda al nieto por nombre/apodo, di que esta bien y que falta, empieza tu primera pregunta.
FASE 2 — Preguntas dificiles que no estan en el formulario. Una a la vez. Al terminar escribe exactamente: |||EVALUACION_COMPLETA|||`;

  async function callClaude(systemPrompt, userContent, maxTokens = 1024) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: Array.isArray(userContent) ? userContent : [{ role: 'user', content: userContent }]
      })
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || 'API error ' + response.status);
    }
    const data = await response.json();
    if (!data?.content) throw new Error('Respuesta inesperada');
    return data.content.map(b => b.text || '').join('');
  }

  function parseJSON(text) {
    let clean = text.replace(/```json|```/g, '').trim();
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start !== -1 && end !== -1) clean = clean.substring(start, end + 1);
    return JSON.parse(clean);
  }

  try {
    if (action === 'memo') {
      const SYS = 'Eres analista senior de Murguia Emprende, un family office mexicano. Responde SOLO con JSON valido. Sin texto antes ni despues. Sin backticks. Sin comentarios.';

      // Paso 1: resumir el contexto para no exceder tokens
      const resumen = await callClaude(
        'Eres un asistente que resume información de proyectos de inversión de forma concisa. Extrae solo los datos clave.',
        `Resume en máximo 800 palabras los datos más importantes de este proyecto para una evaluación de inversión:\n\n${context}`,
        1200
      );

      // Paso 2: generar parte narrativa con el resumen
      const part1text = await callClaude(SYS,
        `Proyecto de inversión resumido:\n${resumen}\n\nGenera SOLO este JSON con valores reales y concretos (no ejemplos):\n{"emprendedor":"","proyecto":"","industria":"","fecha":"${new Date().toLocaleDateString('es-MX')}","tagline":"","resumen_ejecutivo":"","tesis_inversion":"","problema_detallado":"","solucion_detallada":"","validacion_demanda":"","tam":"","sam":"","som_y3":"","contexto_mercado":"","ventaja_competitiva":"","moat":"","rol_ia":"","competidores":"","equipo_descripcion":"","perfil_faltante":"","riesgo_equipo":"","hitos_6meses":"h1;h2;h3","hitos_12meses":"h1;h2;h3","hitos_24meses":"h1;h2;h3","kpis_principales":"k1;k2;k3;k4;k5","riesgo_principal":"","riesgo_2":"","riesgo_3":"","fortalezas":"f1;f2;f3","debilidades":"d1;d2;d3","oportunidades":"o1;o2","amenazas":"a1;a2","ia_score":7,"mercado_score":7,"equipo_score":7,"modelo_score":7,"riesgo_score":7,"traccion_score":7,"financiero_score":7,"recomendacion":"PITCH AL CONSEJO","condiciones_inversion":"","preguntas_consejo":"p1;p2;p3;p4","siguiente_paso":"","comentario_don_juan":"","tareas":["t1","t2","t3"]}`,
        2500
      );

      // Paso 3: generar parte financiera con el resumen
      const part2text = await callClaude(SYS,
        `Proyecto de inversión resumido:\n${resumen}\n\nGenera SOLO este JSON con números reales estimados (no ejemplos):\n{"fuentes_ingreso":"f1;f2","ticket_promedio":"","margen_bruto":"","cac":"","ltv":"","ltv_cac_ratio":"","payback_period":"","ingresos_y1":"","ingresos_y2":"","ingresos_y3":"","ebitda_y1":"","ebitda_y2":"","ebitda_y3":"","clientes_y1":"","clientes_y2":"","clientes_y3":"","breakeven_mes":"","supuestos_financieros":"s1;s2;s3","inversion_solicitada":"","tipo_instrumento":"","participacion_ofrecida":"","valoracion_pre_money":"","uso_de_fondos":"","runway":"","proxima_ronda":"","roi_3a":"","roi_5a":"","tir":"","multiple_capital":"","escenario_salida":"","escenario_conservador":"","escenario_optimista":"","riesgo_mercado":"","riesgo_ejecucion":""}`,
        2500
      );

      try {
        const memo1 = parseJSON(part1text);
        const memo2 = parseJSON(part2text);
        return res.json({ memo: { ...memo1, ...memo2 } });
      } catch (e) {
        console.error('Parse p1:', part1text.substring(0, 300));
        console.error('Parse p2:', part2text.substring(0, 300));
        return res.status(500).json({ error: 'No se pudo parsear el memo: ' + e.message });
      }
    }

    // Chat libre — exploración de ideas
    if (action === 'chat-libre') {
      const CL_SYSTEM = `Eres Don Juan Murguia Pozzi, el abuelo emprendedor. Un nieto te está contando una idea de negocio en desarrollo — puede estar muy cruda, a medio cocer, o incluso descabellada. Tu rol aquí es diferente al de evaluador formal: eres el abuelo que escucha, pregunta, provoca, mejora y ayuda a darle forma.

Modo de este chat:
- Escucha con genuino interés, aunque la idea sea disparatada
- Haz UNA pregunta a la vez para ir profundizando
- Usa tu humor característico cuando algo sea muy ambicioso o poco realista
- Ayuda al nieto a pensar en el cliente, el modelo, el dinero, la competencia — pero de forma conversacional, no como checklist
- Si ves algo que no tiene sentido, dilo con cariño e ironía, no con dureza
- Si la idea va tomando forma concreta (tiene cliente, problema claro, cómo gana dinero), al final de tu respuesta agrega exactamente: |||LISTA_PARA_FORMALIZAR|||
- Siempre en español. Máximo 3-4 oraciones por respuesta. Cercano y humano.`;
      const text = await callClaude(CL_SYSTEM, messages, 600);
      return res.json({ reply: text });
    }

    // Extraer datos del formulario de la conversación del chat libre
    if (action === 'extraer-idea') {
      const text = await callClaude(
        'Extrae datos de negocio de una conversación y responde SOLO con JSON valido. Sin backticks.',
        messages,
        800
      );
      try {
        const t = text.trim();
        const s = t.indexOf('{'), e = t.lastIndexOf('}');
        const data = JSON.parse(t.substring(s, e+1));
        return res.json(data);
      } catch(e) {
        // Intentar con prompt más explícito
        const text2 = await callClaude(
          'Eres un extractor de datos. Responde SOLO con este JSON basado en la conversación, sin texto extra: {"proyecto":"nombre del negocio","industria":"sector","problema":"problema que resuelve","solucion":"como lo resuelve","mercado":"a quien va dirigido","modelo":"como gana dinero","precio":"precio estimado","ventaja":"ventaja competitiva","ia":"rol de la IA si aplica","inversion":"inversión estimada"}',
          messages,
          600
        );
        try {
          const t2 = text2.trim();
          const s2 = t2.indexOf('{'), e2 = t2.lastIndexOf('}');
          return res.json(JSON.parse(t2.substring(s2, e2+1)));
        } catch(e2) {
          return res.json({ proyecto: '', industria: '' });
        }
      }
    }

    // Conversación normal con Don Juan (evaluación de proyecto)
    const text = await callClaude(DJ_SYSTEM, messages, 1024);
    return res.json({ reply: text });

  } catch (e) {
    console.error('DJ error:', e);
    return res.status(500).json({ error: e.message });
  }
}
