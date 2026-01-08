import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [
      statsContratos,
      statsGenero,
      pendientesTTHH,
      distribucionCiudad,
      proyectosTalento,
      ultimosMovimientos
    ] = await Promise.all([
      // 1. Tipos de Contratación
      db.funcionarios.groupBy({
        by: ['tipo_contrato'],
        _count: { _all: true },
        where: { estado: 'ACTIVO' }
      }),
      // 2. Diversidad de Género
      db.funcionarios.groupBy({
        by: ['genero'],
        _count: { _all: true },
        where: { estado: 'ACTIVO' }
      }),
      // 3. Gestión de Ausentismo (Permisos + Vacaciones Pendientes)
      Promise.all([
        db.permisos.count({ where: { estado: 'PENDIENTE' } }),
        db.vacaciones.count({ where: { estado: 'PENDIENTE' } })
      ]),
      // 4. Alcance Geográfico
      db.ciudades.findMany({
        select: {
          nombre_ciudad: true,
          _count: { select: { funcionarios: true } }
        },
        take: 4
      }),
      // 5. Talento por Proyecto
      db.proyectos.findMany({
        select: {
          nombre_proyecto: true,
          _count: { select: { funcionarios: true } }
        },
        take: 5
      }),
      // 6. Historial de Cambios (TTHH Audit)
      db.historial_funcionarios.findMany({
        take: 5,
        orderBy: { fecha_cambio: 'desc' },
        include: { funcionarios: { select: { nombres: true, apellidos: true } } }
      })
    ]);

    return NextResponse.json({
      contratos: statsContratos,
      genero: statsGenero,
      alertas: {
        permisos: pendientesTTHH[0],
        vacaciones: pendientesTTHH[1]
      },
      geografia: distribucionCiudad,
      proyectos: proyectosTalento,
      historial: ultimosMovimientos
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}