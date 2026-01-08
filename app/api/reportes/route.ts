import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// --- CONFIGURACIÓN DE FERIADOS ECUADOR (2025 - 2026) ---
function esFeriadoEcuador(fecha: Date): boolean {
  const anio = fecha.getFullYear();
  const fechaStr = fecha.toISOString().split('T')[0];

  const feriados: { [key: number]: string[] } = {
    2025: [
      "2025-01-01", "2025-03-03", "2025-03-04", "2025-04-18",
      "2025-05-01", "2025-05-23", "2025-08-11", "2025-10-10",
      "2025-11-02", "2025-11-03", "2025-12-25"
    ],
    2026: [
      "2026-01-01", "2026-02-16", "2026-02-17", "2026-04-03",
      "2026-05-01", "2026-05-25", "2026-08-10", "2026-10-09",
      "2026-11-02", "2026-11-03", "2026-12-25"
    ]
  };

  return feriados[anio]?.includes(fechaStr) || false;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mes = parseInt(searchParams.get('mes') || '1');
    const anio = parseInt(searchParams.get('anio') || '2026');
    const funcionarioId = searchParams.get('funcionarioId');

    const fechaInicio = new Date(anio, mes - 1, 1);
    const fechaFin = new Date(anio, mes, 0, 23, 59, 59);

    const colaboradores = await db.funcionarios.findMany({
      where: funcionarioId && funcionarioId !== 'todos' ? { funcionario_id: Number(funcionarioId) } : {},
      include: {
        cargos: true,
        marcaciones: {
          where: { fecha_hora: { gte: fechaInicio, lte: fechaFin } },
          orderBy: { fecha_hora: 'asc' }
        }
      }
    });

    const reporteGlobal = colaboradores.flatMap(f => {
      const diasMes = new Date(anio, mes, 0).getDate();
      const filas = [];

      for (let d = 1; d <= diasMes; d++) {
        const fechaActual = new Date(anio, mes - 1, d);
        const fechaStr = fechaActual.toISOString().split('T')[0];
        const esFinde = [0, 6].includes(fechaActual.getDay());
        const esFeriado = esFeriadoEcuador(fechaActual);
        
        const mDia = f.marcaciones.filter(m => 
          m.fecha_hora.toISOString().split('T')[0] === fechaStr
        );

        let entrada: Date | null = null;
        let iniDescanso: Date | null = null;
        let finDescanso: Date | null = null;
        let salida: Date | null = null;

        mDia.forEach(m => {
          const horaDecimal = m.fecha_hora.getHours() + m.fecha_hora.getMinutes() / 60;
          if (horaDecimal < 11) { if (!entrada) entrada = m.fecha_hora; }
          else if (horaDecimal >= 11 && horaDecimal < 13.75) { if (!iniDescanso) iniDescanso = m.fecha_hora; }
          else if (horaDecimal >= 13.75 && horaDecimal < 16) { if (!finDescanso) finDescanso = m.fecha_hora; }
          else if (horaDecimal >= 16) { salida = m.fecha_hora; }
        });

        const fmt = (d: Date | null) => d ? d.toLocaleTimeString('es-EC', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'S/M';
        
        const hEnt = fmt(entrada);
        const hSal = fmt(salida);

        // --- LÓGICA DE NEGOCIO ROBUSTA ---
        const HORA_LEGAL_ENTRADA = "08:30:00";
        const HORA_LIMITE_TOLERANCIA = "08:45:00";
        
        let inicioReal = hEnt;
        let novedad = "NORMAL";

        if (esFinde || esFeriado) {
          novedad = "LIBRE";
        } else {
          if (hEnt === 'S/M') {
            novedad = "SIN REGISTRO";
          } else if (hEnt <= HORA_LEGAL_ENTRADA) {
            // Antes de las 08:30, se marca como 08:30
            inicioReal = HORA_LEGAL_ENTRADA;
            novedad = "NORMAL";
          } else if (hEnt <= HORA_LIMITE_TOLERANCIA) {
            // Entre 08:31 y 08:45, es NORMAL (Tolerancia)
            inicioReal = hEnt;
            novedad = "NORMAL (TOLERANCIA)";
          } else {
            // Después de las 08:45 es ATRASO real
            inicioReal = hEnt;
            novedad = "ATRASO";
          }
        }

        // Cálculos de Tiempos
        const totalDescanso = (iniDescanso && finDescanso) 
          ? (finDescanso.getTime() - iniDescanso.getTime()) / 3600000 
          : (esFinde || esFeriado || hEnt === 'S/M') ? 0 : 1;

        const jornadaBruta = (entrada && salida) ? (salida.getTime() - entrada.getTime()) / 3600000 : 0;
        const horasTrabajadas = Math.max(0, jornadaBruta - totalDescanso);

        // Horas Extras y Menos
        const extras = (horasTrabajadas > 8 && !esFinde && !esFeriado) ? horasTrabajadas - 8 : 0;
        const menos = (horasTrabajadas < 8 && horasTrabajadas > 0 && !esFinde && !esFeriado) ? 8 - horasTrabajadas : 0;

        filas.push({
          fecha: fechaStr,
          empleado: `${f.apellidos} ${f.nombres}`,
          cargo: f.cargos?.nombre_cargo || 'N/A',
          biometrico: hEnt,
          inicio_real: inicioReal,
          fin_jornada: hSal,
          ini_descanso: fmt(iniDescanso),
          fin_descanso: fmt(finDescanso),
          total_descanso: totalDescanso.toFixed(2) + " h",
          horas_trabajadas: formatDecimalToTime(horasTrabajadas),
          horas_extras: formatDecimalToTime(extras),
          horas_menos: formatDecimalToTime(menos),
          novedad: novedad
        });
      }
      return filas;
    });

    return NextResponse.json(reporteGlobal);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function formatDecimalToTime(decimal: number) {
  const h = Math.floor(decimal);
  const m = Math.round((decimal - h) * 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`;
}