// inspeccionar-db.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analizarEstructura() {
  console.log("🔍 Iniciando análisis de la tabla 'funcionarios'...\n");

  try {
    // 1. Intentamos obtener un registro existente para ver su forma
    const ejemplo = await prisma.funcionarios.findFirst();
    
    if (ejemplo) {
      console.log("✅ Registro encontrado. Esta es la estructura actual en la DB:");
      console.dir(ejemplo);
    } else {
      console.log("❌ No hay registros en la tabla para comparar.");
    }

    console.log("\n--------------------------------------------------");
    console.log("🛠️ PRUEBA DE CAMPO OBLIGATORIO");
    console.log("Enviando registro vacío para forzar error de validación...");
    
    // 2. Intentamos crear un registro vacío para que Prisma nos diga qué falta
    // @ts-ignore
    await prisma.funcionarios.create({ data: {} });

  } catch (error: any) {
    console.log("\n🚩 RESULTADO DEL ANÁLISIS:");
    
    if (error.message.includes("Argument")) {
      console.log("Los siguientes campos son OBLIGATORIOS según Prisma:");
      // Extraemos los nombres de los campos del error
      const camposFaltantes = error.message.match(/`(\w+)`/g);
      console.log(camposFaltantes ? camposFaltantes.join(", ") : error.message);
    } else {
      console.log("Error inesperado:");
      console.log(error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

analizarEstructura();