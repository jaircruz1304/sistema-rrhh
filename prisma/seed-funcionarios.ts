import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

const dataRaw = [
  { teams: "Alvarez Daniela", full: "ALVAREZ CASTRO ESTEFANÍA DANIELA", bio: "10", cargo: "DIRECTORA ADMINISTRATIVA Y TH" },
  { teams: "Amaya Byron", full: "AMAYA CAPELO BYRON ALFREDO", bio: "103", cargo: "TÉCNICO AREAS PROTEGIDAS Y VIDA SILVESTRE" },
  { teams: "Araujo Paulina", full: "ARAUJO MERINO PAULINA GABRIELA", bio: "80", cargo: "AUDITORA INTERNA" },
  { teams: "Barros David", full: "BARROS VITERI DAVID ALEXIS", bio: "81", cargo: "ANALISTA SENIOR DE INNOVACION TECNOLOGICA" },
  { teams: "Benitez Marco", full: "BENITEZ CASTILLO MARCO VINICIO", bio: "75", cargo: "ANALISTA DE TALENTO HUMANO" },
  { teams: "Bravo Jose", full: "BRAVO MOGRO JOSE MIGUEL", bio: "44", cargo: "COORDINADOR ADMINISTRATIVO FINANCIERO REM" },
  { teams: "Chamorro David", full: "CHAMORRO VARGAS DAVID FERNANDO", bio: "83", cargo: "ESPECIALISTA ADMINISTRATIVO" },
  { teams: "Cruz Jair", full: "CRUZ GALLEGOS JAIR ALEXANDER", bio: "84", cargo: "ESPECIALISTA ADMINISTRATIVO" },
  { teams: "Galo Garzón", full: "Galo Mauricio Garzón Proaño", bio: "85", cargo: "ANALISTA ADMINISTRATIVO FINANCIERO" },
  { teams: "Guillen Carmen", full: "GUILLEN PILCO CARMEN ALEXANDRA", bio: "1", cargo: "AUXILIAR DE SERVICIOS GENERALES" },
  { teams: "Jaramillo Kevin", full: "JARAMILLO CARRIÓN KEVIN ALEXANDER", bio: "72", cargo: "ASISTENTE CONTABLE" },
  { teams: "Limongi Paúl", full: "LIMONGI CASTELO PAÚL ALEJANDRO", bio: "15", cargo: "ASISTENTE CONTABLE" },
  { teams: "Mero Angela", full: "MERO CEDEÑO ANGELA BEATRIZ", bio: "42", cargo: "AUXILIAR DE SERVICIOS GENERALES" },
  { teams: "Montero Elsa", full: "MONTERO MIER ELSA RAQUEL", bio: "68", cargo: "ASESORA JURIDICA" },
  { teams: "Morales Denisse", full: "MORALES ALBA EVELYN DENISSE", bio: "74", cargo: "ASISTENTE ADMINISTRATIVA" },
  { teams: "Murillo Ana", full: "MURILLO GUERRON ANA LUCIA", bio: "27", cargo: "GERENTE DE PROGRAMAS Y PROYECTOS" },
  { teams: "Nieto Kerly", full: "NIETO MACIAS KERLY SELENA", bio: "82", cargo: "ASISTENTE LEGAL" },
  { teams: "Nunez Alexandra", full: "NUÑEZ LARA CYNTHIA ALEXANDRA", bio: "13", cargo: "ANALISTA EN CONTRATACIONES" },
  { teams: "Paredes Nelson", full: "PAREDES SÁNCHEZ NELSON PATRICIO", bio: "48", cargo: "GERENTE ADMINISTRATIVO FINANCIERO" },
  { teams: "Paspuel Nelly", full: "PASPUEL CELÍN NELLY FERNANDA", bio: "102", cargo: "TÉCNICA EN SEGUIMIENTO ADMINISTRATIVO Y FINANCIERO FAP" },
  { teams: "Quezada Diana", full: "QUEZADA TACURI DIANA MARIBEL", bio: "46", cargo: "ESPECIALISTA DE ADQUISICIONES REM" },
  { teams: "Ramos Shirley", full: "RAMOS CORTEZ SHIRLEY PAOLA", bio: "61", cargo: "ASISTENTE CONTABLE FIAS REM" },
  { teams: "Riofrío Jeidy", full: "RIOFRIO MINAYA JEIDY MARILY", bio: "77", cargo: "ASISTENTE DE LA DIRECCION EJECUTIVA" },
  { teams: "Rodriguez Diego", full: "RODRIGUEZ AYALA DIEGO SEBASTIAN", bio: "108", cargo: "ANALISTA LEGAL FAP" },
  { teams: "Silva Santiago", full: "SILVA LACHARD SANTIAGO DANIEL", bio: "9", cargo: "COORDINADOR PROGRAMA AREAS PROTEGIDAS" },
  { teams: "Tapia Catalina", full: "TAPIA GUILLEN CATALINA DEL CONSUELO", bio: "107", cargo: "TÉCNICA ADMINISTRATIVA" },
  { teams: "Tobar Monserrath", full: "TOBAR CAZARES AYDA MONSERRATH", bio: "6", cargo: "DIRECTORA CONTABILIDAD Y TESORERÍA" },
  { teams: "Urresta Karina", full: "URRESTA SALAZAR KARINA GABRIELA", bio: "101", cargo: "TÉCNICA EN SEGUIMIENTO ADMINISTRATIVO Y FINANCIERO FAP" },
  { teams: "Vaca Ines", full: "VACA GARNICA INÉS FERNANDA", bio: "5", cargo: "CONTADORA INSTITUCIONAL" },
  { teams: "Vallejo Martin", full: "VALLEJO EGAS MARTIN ANDRE", bio: "106", cargo: "ANALISTA ADMINISTRATIVO FINANCIERO" },
  { teams: "Villarreal Matilde", full: "VILLARREAL ERAZO MATILDE DE LOS ANGELES", bio: "105", cargo: "COORDINADORA DE PROYECTO" },
  { teams: "Yanez Pablo", full: "YANEZ SALTOS PABLO XAVIER", bio: "22", cargo: "GERENTE PLANIFICACIÓN E INNOVACIÓN" },
  { teams: "Zapata Mauricio", full: "ZAPATA CALDERON MAURICIO FERNANDO", bio: "18", cargo: "ESPECIALISTA EN CONTRATACIONES" }
];

async function main() {
  console.log("🚀 Iniciando carga masiva basada en estructura SQL...");

  // Asegurar catálogos base para evitar errores de Foreign Key
  const ciudadDefault = await db.ciudades.upsert({
    where: { nombre: 'QUITO' }, update: {}, create: { nombre: 'QUITO' }
  });

  const proyectoDefault = await db.proyectos.upsert({
    where: { nombre: 'INSTITUCIONAL' }, update: {}, create: { nombre: 'INSTITUCIONAL' }
  });

  for (const item of dataRaw) {
    try {
      // 1. Manejo de Cargo (Relación)
      const cargoDb = await db.cargos.upsert({
        where: { nombre: item.cargo.toUpperCase().trim() },
        update: {},
        create: { nombre: item.cargo.toUpperCase().trim() }
      });

      // 2. Procesamiento de Nombres (Apellidos y Nombres separados)
      const partes = item.full.trim().split(" ");
      const apellidos = partes.length >= 2 ? `${partes[0]} ${partes[1]}` : partes[0];
      const nombres = partes.length > 2 ? partes.slice(2).join(" ") : (partes[1] || "S/N");

      // 3. Registro con UPSERT (Evita duplicados por codigo_biometrico)
      await db.funcionarios.upsert({
        where: { codigo_biometrico: String(item.bio) },
        update: {
          codigo_teams: item.teams,
          cargo_id: cargoDb.cargo_id,
          updated_by: 'system_update'
        },
        create: {
          codigo_unico: `FIAS-EMP-${item.bio.padStart(4, '0')}`,
          tipo_identificacion: 'CEDULA',
          numero_identificacion: `PEND-${item.bio}`, // Debe ser único
          apellidos: apellidos.toUpperCase(),
          nombres: nombres.toUpperCase(),
          genero: 'M',
          estado_civil: 'SOLTERO',
          fecha_ingreso: new Date('2024-01-01'),
          cargo_id: cargoDb.cargo_id,
          proyecto_id: proyectoDefault.proyecto_id,
          estado: 'ACTIVO',
          correo: `user${item.bio}@fias.org.ec`, // Debe ser único
          ciudad_id: ciudadDefault.ciudad_id,
          tipo_contrato: 'INDEFINIDO',
          jornada: 'TIEMPO_COMPLETO',
          codigo_biometrico: String(item.bio),
          codigo_teams: item.teams,
          usuario_ad: `user_${item.bio}`, // Debe ser único
          created_by: 'system',
          updated_by: 'system'
        }
      });

      console.log(`✅ Procesado: ${item.full}`);
    } catch (e: any) {
      console.error(`❌ Error con ${item.full}:`, e.message);
    }
  }
}

main().then(() => db.$disconnect());