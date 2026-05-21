export const config = { maxDuration: 30 };
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Consejeros con sus perfiles — para enriquecer el display
const CONSEJEROS = {
  'juanpablo@murguia.com':  { nombre: 'Juan Pablo Murguía', apodo: 'Juan Pablo', rol: 'Socio Murguía Consultores', avatar: 'JP' },
  'boris@murguia.com':      { nombre: 'José Ignacio Murguía', apodo: 'Boris', rol: 'Socio Murguía Consultores', avatar: 'BO' },
  'lobas@murguia.com':      { nombre: 'Francisco Lobatón', apodo: 'Lobas', rol: 'Marketing & Estructura Fiscal', avatar: 'LO' },
  'alex@murguia.com':       { nombre: 'Alejandro Bustamante', apodo: 'Alex', rol: 'Banca & Antilavado', avatar: 'AL' },
  'alfarceo@gmail.com':     { nombre: 'Alfonso Arceo', apodo: 'Alfonso', rol: 'COO Fibra Uno · Admin', avatar: 'AA' },
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, projectId, email, voto, monto, comentario, ronda, hitosEditados } = req.body;

  try {
    // ── OBTENER ESTADO COMPLETO DE VOTACIÓN ──
    if (action === 'get') {
      const { data, error } = await supabase
        .from('projects').select('id,nombre,memo,votacion,rondas').eq('id', projectId).single();
      if (error) throw error;
      return res.json({ 
        project: data,
        consejeros: CONSEJEROS
      });
    }

    // ── VOTAR ──
    if (action === 'votar') {
      const { data: proj } = await supabase.from('projects').select('votacion,rondas').eq('id', projectId).single();
      const votacion = proj.votacion || { ronda1: {}, abierta: false };
      const rondaKey = `ronda${ronda || 1}`;
      if (!votacion[rondaKey]) votacion[rondaKey] = {};
      
      votacion[rondaKey][email] = {
        voto,           // 'si' | 'no' | 'condicional'
        monto: monto || 0,
        comentario: comentario || '',
        timestamp: Date.now(),
        consejero: CONSEJEROS[email]?.apodo || email
      };

      await supabase.from('projects').update({ 
        votacion,
        updated_at: new Date().toISOString()
      }).eq('id', projectId);

      return res.json({ ok: true, votacion });
    }

    // ── ABRIR / CERRAR VOTACIÓN ──
    if (action === 'toggle_votacion') {
      const { data: proj } = await supabase.from('projects').select('votacion').eq('id', projectId).single();
      const votacion = proj.votacion || { ronda1: {}, abierta: false };
      votacion.abierta = !votacion.abierta;
      votacion.rondaActiva = ronda || 1;
      if (votacion.abierta) votacion.abiertaEn = Date.now();

      await supabase.from('projects').update({ votacion }).eq('id', projectId);
      return res.json({ ok: true, abierta: votacion.abierta });
    }

    // ── CERRAR RONDA Y REGISTRAR CAP TABLE ──
    if (action === 'cerrar_ronda') {
      const { data: proj } = await supabase.from('projects').select('*').eq('id', projectId).single();
      const votacion = proj.votacion || {};
      const rondaKey = `ronda${ronda}`;
      const votos = votacion[rondaKey] || {};

      // Calcular total comprometido
      const totalComprometido = Object.values(votos)
        .filter(v => v.voto === 'si' || v.voto === 'condicional')
        .reduce((sum, v) => sum + (v.monto || 0), 0);

      // Calcular prima según ronda (0% ronda1, +30% ronda2, +60% ronda3, etc.)
      const primaBase = 0.30;
      const prima = ronda === 1 ? 0 : primaBase * (ronda - 1);

      // Obtener valuación de ronda anterior para calcular la nueva
      const rondas = proj.rondas || [];
      const rondaAnterior = rondas.find(r => r.numero === ronda - 1);
      const valuacionBase = rondaAnterior ? rondaAnterior.valuacionPost : (proj.memo?.valoracion_pre_money ? 
        parseFloat(proj.memo.valoracion_pre_money.replace(/[^0-9.]/g,'')) : 1000000);
      const valuacionNueva = rondaAnterior ? valuacionBase * (1 + prima) : valuacionBase;

      // Registrar la ronda cerrada
      const nuevaRonda = {
        numero: ronda,
        cerradaEn: Date.now(),
        totalComprometido,
        prima: prima * 100,
        valuacionPre: valuacionNueva,
        valuacionPost: valuacionNueva + totalComprometido,
        inversores: Object.entries(votos)
          .filter(([_, v]) => v.voto === 'si' || v.voto === 'condicional')
          .map(([email, v]) => ({
            email,
            nombre: CONSEJEROS[email]?.apodo || email,
            monto: v.monto,
            porcentaje: totalComprometido > 0 ? ((v.monto / (valuacionNueva + totalComprometido)) * 100).toFixed(2) : 0,
            voto: v.voto,
            comentario: v.comentario
          })),
        hitos: hitosEditados || proj.memo?.hitos_12meses || ''
      };

      rondas.push(nuevaRonda);
      votacion.abierta = false;

      // Actualizar status del proyecto
      await supabase.from('projects').update({ 
        rondas,
        votacion,
        status: 'financiado',
        updated_at: new Date().toISOString()
      }).eq('id', projectId);

      return res.json({ ok: true, ronda: nuevaRonda });
    }

    // ── OBTENER CAP TABLE ──
    if (action === 'cap_table') {
      const { data: proj } = await supabase.from('projects').select('nombre,rondas,votacion').eq('id', projectId).single();
      const rondas = proj.rondas || [];

      // Construir cap table consolidada
      const inversores = {};
      rondas.forEach(r => {
        (r.inversores || []).forEach(inv => {
          if (!inversores[inv.email]) {
            inversores[inv.email] = { 
              nombre: inv.nombre, 
              email: inv.email,
              rondas: [],
              totalInvertido: 0,
              porcentajeTotal: 0
            };
          }
          inversores[inv.email].rondas.push({
            numero: r.numero,
            monto: inv.monto,
            porcentaje: inv.porcentaje,
            valuacion: r.valuacionPre,
            prima: r.prima
          });
          inversores[inv.email].totalInvertido += inv.monto;
        });
      });

      return res.json({ 
        capTable: Object.values(inversores),
        rondas,
        proyecto: proj.nombre
      });
    }

    return res.status(400).json({ error: 'Acción no reconocida' });
  } catch (e) {
    console.error('Consejo error:', e);
    return res.status(500).json({ error: e.message });
  }
}
