import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Listar todos los cargos
export async function GET() {
  try {
    const todosLosCargos = await prisma.cargos.findMany({
      orderBy: { nombre_cargo: 'asc' },
    });
    return NextResponse.json(todosLosCargos || []);
  } catch (error) {
    console.error("Error al obtener cargos:", error);
    return NextResponse.json([], { status: 500 });
  }
}

// POST: Crear nuevo cargo
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validación básica
    if (!body.codigo_cargo || !body.nombre_cargo) {
      return NextResponse.json({ error: "Código y Nombre son obligatorios" }, { status: 400 });
    }

    const nuevo = await prisma.cargos.create({
      data: {
        codigo_cargo: body.codigo_cargo.trim().toUpperCase(),
        nombre_cargo: body.nombre_cargo.trim().toUpperCase(),
        nivel: body.nivel ? parseInt(body.nivel) : 1,
        salario_base: body.salario_base || 0,
        descripcion: body.descripcion || '',
      },
    });
    return NextResponse.json(nuevo);
  } catch (error: any) {
    // Manejo de error de duplicados (Prisma P2002)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "El código del cargo ya existe en el sistema" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Actualizar cargo existente (Cambiado de PUT a PATCH para coincidir con el Front)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { cargo_id, ...data } = body;

    if (!cargo_id) {
      return NextResponse.json({ error: "ID del cargo es necesario para actualizar" }, { status: 400 });
    }

    const actualizado = await prisma.cargos.update({
      where: { cargo_id: Number(cargo_id) },
      data: {
        codigo_cargo: data.codigo_cargo?.toUpperCase(),
        nombre_cargo: data.nombre_cargo?.toUpperCase(),
        nivel: data.nivel ? parseInt(data.nivel) : undefined,
        salario_base: data.salario_base,
        descripcion: data.descripcion,
        // Eliminamos updated_at: new Date() si Prisma ya lo maneja con @updatedAt
      },
    });
    return NextResponse.json(actualizado);
  } catch (error: any) {
    console.error("Error en PATCH:", error);
    return NextResponse.json({ error: "No se pudo actualizar el cargo" }, { status: 500 });
  }
}

// DELETE: Eliminar cargo
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    const cargoId = Number(id);

    // 1. Verificar integridad referencial (Si hay empleados con este cargo)
    const vinculados = await prisma.funcionarios.count({
      where: { cargo_id: cargoId }
    });

    if (vinculados > 0) {
      return NextResponse.json({ 
        error: `Restricción de integridad: ${vinculados} funcionarios están asignados a este cargo. Cámbielos antes de eliminar.` 
      }, { status: 400 });
    }

    await prisma.cargos.delete({ where: { cargo_id: cargoId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Error interno al eliminar" }, { status: 500 });
  }
}