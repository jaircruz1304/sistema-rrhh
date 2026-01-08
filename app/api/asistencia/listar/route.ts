import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic'; 

export async function GET(request: Request) {
  try {
    // 1. Extraer parámetros de la URL
    const { searchParams } = new URL(request.url);
    const mes = searchParams.get('mes');
    const anio = searchParams.get('anio');

    // 2. Validar que los filtros existan
    if (!mes || !anio) {
      return NextResponse.json(
        { error: "Se requieren los parámetros 'mes' y 'anio' para filtrar la data." }, 
        { status: 400 }
      );
    }

    // 3. Definir el rango de fechas (Inicio y Fin de mes)
    // El mes en JS va de 0 a 11, por eso restamos 1.
    const fechaInicio = new Date(parseInt(anio), parseInt(mes) - 1, 1, 0, 0, 0);
    const fechaFin = new Date(parseInt(anio), parseInt(mes), 0, 23, 59, 59);

    // 4. Consulta optimizada a la base de datos
    const marcaciones = await db.marcaciones.findMany({
      where: {
        fecha_hora: {
          gte: fechaInicio,
          lte: fechaFin
        }
      },
      include: {
        // Mantenemos la relación corregida 'funcionarios'
        funcionarios: {
          select: {
            codigo_biometrico: true,
            nombres: true,
            apellidos: true,
            numero_identificacion: true
          }
        }
      },
      orderBy: [
        { fecha_hora: 'asc' }, // Orden cronológico para la macro de Excel
        { funcionarios: { codigo_biometrico: 'asc' } }
      ]
    });

    // 5. Retornar la data filtrada
    return NextResponse.json(marcaciones);

  } catch (error: any) {
    console.error("❌ Error en API Listar Filtrado:", error);
    return NextResponse.json(
      { error: "Error interno al procesar las marcaciones: " + error.message }, 
      { status: 500 }
    );
  }
}