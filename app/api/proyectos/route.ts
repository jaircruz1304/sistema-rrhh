import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const proyectos = await prisma.proyectos.findMany({
      orderBy: { nombre_proyecto: 'asc' },
    });
    return NextResponse.json(proyectos);
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const nuevo = await prisma.proyectos.create({
      data: {
        codigo_proyecto: body.codigo_proyecto.toUpperCase().trim(),
        nombre_proyecto: body.nombre_proyecto.toUpperCase().trim(),
        descripcion: body.descripcion || '',
        estado: body.estado || 'ACTIVO',
        fecha_inicio: body.fecha_inicio ? new Date(body.fecha_inicio) : new Date(),
      },
    });
    return NextResponse.json(nuevo);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { proyecto_id, ...data } = body;

    const actualizado = await prisma.proyectos.update({
      where: { proyecto_id: Number(proyecto_id) },
      data: {
        codigo_proyecto: data.codigo_proyecto?.toUpperCase().trim(),
        nombre_proyecto: data.nombre_proyecto?.toUpperCase().trim(),
        descripcion: data.descripcion,
        estado: data.estado,
        fecha_inicio: data.fecha_inicio ? new Date(data.fecha_inicio) : undefined,
      },
    });
    return NextResponse.json(actualizado);
  } catch (error: any) {
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validación de integridad: No borrar si hay funcionarios en el proyecto
    const ocupado = await prisma.funcionarios.count({
      where: { proyecto_id: Number(id) }
    });

    if (ocupado > 0) {
      return NextResponse.json({ error: "Proyecto con personal asignado" }, { status: 400 });
    }

    await prisma.proyectos.delete({ where: { proyecto_id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}