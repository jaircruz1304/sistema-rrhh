import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * Procesa la fecha de Excel de forma robusta.
 * Se asegura de que no haya desfases por zonas horarias del servidor.
 */
function limpiarFecha(valor: any) {
  if (!valor) return null;
  try {
    // Caso: Serial de Excel (Número)
    if (typeof valor === 'number' || (!isNaN(valor) && !isNaN(parseFloat(valor)))) {
      const serial = parseFloat(valor);
      const fechaUnix = Math.round((serial - 25569) * 86400 * 1000);
      return new Date(fechaUnix);
    }
    
    // Caso: String (ISO o formato común)
    const d = new Date(String(valor).trim());
    return isNaN(d.getTime()) ? null : d;
  } catch (e) { 
    return null; 
  }
}

export async function POST(req: Request) {
  try {
    const { tipo, datos } = await req.json();
    if (!datos || !Array.isArray(datos)) throw new Error("Formato de datos inválido");

    // 1. CACHÉ DE FUNCIONARIOS: Cargamos todos una vez para no consultar la DB en cada iteración
    const todosLosFuncionarios = await db.funcionarios.findMany({
      select: { funcionario_id: true, codigo_biometrico: true, codigo_teams: true }
    });

    let procesados = 0;
    const operaciones = [];

    // 2. PROCESAMIENTO SEGÚN ORIGEN
    for (const fila of datos) {
      let funcionario;

      if (tipo === 'TEAMS') {
        const nombreTeams = String(fila['Nombre del empleado'] || '').trim();
        funcionario = todosLosFuncionarios.find(f => f.codigo_teams === nombreTeams);

        if (funcionario) {
          const columnasTeams = [
            { col: 'Hora de entrada', tipo: 'ENTRADA' },
            { col: 'Hora de inicio del descanso', tipo: 'SALIDA' },
            { col: 'Hora de finalización del descanso', tipo: 'ENTRADA' },
            { col: 'Hora de salida', tipo: 'SALIDA' }
          ];

          for (const item of columnasTeams) {
            const fechaVal = limpiarFecha(fila[item.col]);
            if (fechaVal) {
              operaciones.push(crearUpsert(funcionario.funcionario_id, fechaVal, item.tipo, 'TEAMS'));
            }
          }
        }
      } 
      else if (tipo === 'BIOMETRICO') {
        const idBio = String(fila['ID de Usuario'] || '').trim();
        const tiempoRaw = fila['Tiempo'];
        funcionario = todosLosFuncionarios.find(f => f.codigo_biometrico === idBio);

        const fechaFinal = limpiarFecha(tiempoRaw);
        if (funcionario && fechaFinal) {
          const estadoRaw = String(fila['Estado'] || fila['Evento'] || '').toLowerCase();
          const tipoM = (estadoRaw.includes('sal') || estadoRaw.includes('out')) ? 'SALIDA' : 'ENTRADA';
          operaciones.push(crearUpsert(funcionario.funcionario_id, fechaFinal, tipoM, 'BIOMETRICO'));
        }
      }
    }

    // 3. EJECUCIÓN EN TRANSACCIÓN POR LOTES (Batching)
    // Para no saturar la conexión, procesamos de 50 en 50
    const chunks = [];
    for (let i = 0; i < operaciones.length; i += 50) {
      chunks.push(operaciones.slice(i, i + 50));
    }

    for (const chunk of chunks) {
      await db.$transaction(chunk);
      procesados += chunk.length;
    }

    return NextResponse.json({ success: true, registros: procesados });
  } catch (error: any) {
    console.error("🚨 ERROR IMPORTACIÓN:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Helper para generar la estructura de Upsert de Prisma
 */
function crearUpsert(fId: number, fecha: Date, tipo: string, disp: string) {
  return db.marcaciones.upsert({
    where: {
      idx_prevencion_duplicados: {
        funcionario_id: fId,
        fecha_hora: fecha,
        tipo_marcacion: tipo
      }
    },
    update: { sincronizado: true },
    create: {
      funcionario_id: fId,
      fecha_hora: fecha,
      tipo_marcacion: tipo,
      dispositivo: disp,
      sincronizado: true
    }
  });
}