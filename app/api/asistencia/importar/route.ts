import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * Convierte el serial de Excel (ej: 45678.35) a un objeto Date real.
 * Ajusta la zona horaria según sea necesario.
 */
function excelSerialAFecha(serial: number) {
  // Excel base es 30/12/1899
  const fechaUnix = Math.round((serial - 25569) * 86400 * 1000);
  const fecha = new Date(fechaUnix);
  // Si el servidor está en UTC y necesitas hora Ecuador (UTC-5), 
  // no sumes horas aquí si la data ya viene en hora local.
  return fecha;
}

/**
 * Limpia y parsea la fecha dependiendo del origen.
 */
function limpiarFecha(valor: any) {
  if (!valor) return null;
  try {
    // Si es un número (serial de Excel)
    if (!isNaN(valor) && typeof valor !== 'string') {
      return excelSerialAFecha(parseFloat(valor));
    }
    
    // Si es un string (ej: "01/15/2026 08:30 AM")
    const texto = String(valor).trim();
    const d = new Date(texto);
    return isNaN(d.getTime()) ? null : d;
  } catch (e) { 
    return null; 
  }
}

export async function POST(req: Request) {
  try {
    const { tipo, datos } = await req.json();
    let procesados = 0;

    for (const fila of datos) {
      let funcionario = null;

      // --- CASO 1: IMPORTACIÓN DESDE TEAMS ---
      if (tipo === 'TEAMS') {
        const nombreTeams = fila['Nombre del empleado'];
        if (!nombreTeams) continue;

        funcionario = await db.funcionarios.findFirst({ 
          where: { codigo_teams: String(nombreTeams).trim() } 
        });

        if (funcionario) {
          // Extraemos las 4 columnas posibles de marcación por fila
          const columnasTeams = [
            { col: 'Hora de entrada', tipo: 'ENTRADA' },
            { col: 'Hora de inicio del descanso', tipo: 'SALIDA' }, // Inicio descanso es una salida
            { col: 'Hora de finalización del descanso', tipo: 'ENTRADA' }, // Fin descanso es entrada
            { col: 'Hora de salida', tipo: 'SALIDA' }
          ];

          for (const item of columnasTeams) {
            const fechaVal = limpiarFecha(fila[item.col]);
            
            if (fechaVal) {
              await db.marcaciones.upsert({
                where: {
                  idx_prevencion_duplicados: {
                    funcionario_id: funcionario.funcionario_id,
                    fecha_hora: fechaVal,
                    tipo_marcacion: item.tipo
                  }
                },
                update: { sincronizado: true },
                create: {
                  funcionario_id: funcionario.funcionario_id,
                  fecha_hora: fechaVal,
                  tipo_marcacion: item.tipo,
                  dispositivo: 'TEAMS',
                  sincronizado: true
                }
              });
              procesados++;
            }
          }
        }
      } 
      
      // --- CASO 2: IMPORTACIÓN DESDE BIOMÉTRICO ---
      else if (tipo === 'BIOMETRICO') {
        const idBio = String(fila['ID de Usuario'] || '').trim();
        const tiempoRaw = fila['Tiempo'];

        if (!idBio || !tiempoRaw) continue;

        funcionario = await db.funcionarios.findFirst({ 
          where: { codigo_biometrico: idBio } 
        });

        const fechaFinal = limpiarFecha(tiempoRaw);

        if (funcionario && fechaFinal) {
          // Lógica de detección de tipo para Biométrico
          const estadoRaw = String(fila['Estado'] || fila['Evento'] || '').toLowerCase();
          const tipoM = (estadoRaw.includes('sal') || estadoRaw.includes('out')) ? 'SALIDA' : 'ENTRADA';

          await db.marcaciones.upsert({
            where: {
              idx_prevencion_duplicados: {
                funcionario_id: funcionario.funcionario_id,
                fecha_hora: fechaFinal,
                tipo_marcacion: tipoM
              }
            },
            update: { sincronizado: true },
            create: {
              funcionario_id: funcionario.funcionario_id,
              fecha_hora: fechaFinal,
              tipo_marcacion: tipoM,
              dispositivo: 'BIOMETRICO',
              sincronizado: true
            }
          });
          procesados++;
        }
      }
    }

    return NextResponse.json({ success: true, registros: procesados });
  } catch (error: any) {
    console.error("ERROR IMPORTACIÓN:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}