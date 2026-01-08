import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// 1. GET: Retorna listado y catálogos para los selects del formulario
export async function GET() {
  try {
    const [funcionarios, cargos, proyectos, ciudades] = await Promise.all([
      db.funcionarios.findMany({
        orderBy: { funcionario_id: 'desc' },
        include: { cargos: true, proyectos: true, ciudades: true } // Relaciones para ver nombres en la tabla
      }),
      db.cargos.findMany(),
      db.proyectos.findMany(),
      db.ciudades.findMany()
    ]);

    return NextResponse.json({ 
      funcionarios, 
      catalogos: { cargos, proyectos, ciudades } 
    });
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener datos" }, { status: 500 });
  }
}

// 2. POST: Registro con validación de duplicados
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const nuevo = await db.funcionarios.create({
      data: {
        codigo_unico: `EMP-${Date.now()}`, 
        nombres: body.nombres.toUpperCase(),
        apellidos: body.apellidos.toUpperCase(),
        numero_identificacion: body.numero_identificacion,
        codigo_biometrico: String(body.codigo_biometrico),
        correo: body.correo || null,
        celular: body.celular || null,
        codigo_teams: body.codigo_teams || null,
        // Valores obligatorios
        tipo_identificacion: 'CEDULA',
        genero: body.genero || 'M',
        estado: 'ACTIVO',
        fecha_ingreso: new Date(),
        cargo_id: body.cargo_id ? Number(body.cargo_id) : 6,    
        proyecto_id: body.proyecto_id ? Number(body.proyecto_id) : 1, 
        ciudad_id: body.ciudad_id ? Number(body.ciudad_id) : 1,   
        tipo_contrato: 'INDEFINIDO',
        jornada: 'TIEMPO_COMPLETO',
        created_by: 'admin'
      }
    });

    return NextResponse.json(nuevo);
  } catch (error: any) {
    // CAPTURA DE ERRORES DE UNICIDAD (DUPLICADOS)
    if (error.code === 'P2002') {
      const targets = error.meta?.target || [];
      let mensaje = "Ya existe un registro con datos duplicados.";
      
      if (targets.includes('correo')) mensaje = "El CORREO electrónico ya está registrado.";
      if (targets.includes('numero_identificacion')) mensaje = "El NÚMERO DE CÉDULA ya está registrado.";
      if (targets.includes('codigo_biometrico')) mensaje = "El ID BIOMÉTRICO ya está asignado.";
      if (targets.includes('codigo_teams')) mensaje = "El NOMBRE DE TEAMS ya existe.";

      return NextResponse.json({ error: mensaje }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// 3. PATCH: Actualizar funcionario existente
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { funcionario_id, ...datos } = body;

    const actualizado = await db.funcionarios.update({
      where: { funcionario_id: Number(funcionario_id) },
      data: {
        nombres: datos.nombres?.toUpperCase(),
        apellidos: datos.apellidos?.toUpperCase(),
        numero_identificacion: datos.numero_identificacion,
        codigo_biometrico: String(datos.codigo_biometrico),
        correo: datos.correo,
        celular: datos.celular,
        codigo_teams: datos.codigo_teams,
        cargo_id: Number(datos.cargo_id),
        proyecto_id: Number(datos.proyecto_id),
        ciudad_id: Number(datos.ciudad_id),
      }
    });

    return NextResponse.json(actualizado);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "No se puede actualizar: Los datos ingresados (Cédula/Correo/ID) ya pertenecen a otra persona." }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// 4. DELETE: Borrar funcionario
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) throw new Error("ID requerido");

    await db.funcionarios.delete({
      where: { funcionario_id: Number(id) }
    });

    return NextResponse.json({ message: "Eliminado con éxito" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}