import { jsPDF } from 'jspdf';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(d: string | null | undefined): string {
  if (!d) return '—';
  const [y, m, day] = d.split('T')[0].split('-');
  return `${day}/${m}/${y}`;
}

function calcEdad(fechaNac: string): number {
  const hoy = new Date();
  const nac = new Date(fechaNac);
  let e = hoy.getFullYear() - nac.getFullYear();
  if (
    hoy.getMonth() < nac.getMonth() ||
    (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())
  )
    e--;
  return e;
}

function si(val: boolean | null | undefined): string {
  return val ? 'Sí' : val === false ? 'No' : '—';
}

// ─── Layout helpers ───────────────────────────────────────────────────────────

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 18;
const COL_W = PAGE_W - MARGIN * 2;

class PdfWriter {
  doc: jsPDF;
  y: number;
  page: number;

  constructor() {
    this.doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    this.y = MARGIN;
    this.page = 1;
  }

  checkPage(needed = 12) {
    if (this.y + needed > PAGE_H - MARGIN) {
      this.doc.addPage();
      this.page++;
      this.y = MARGIN;
      this.pageHeader();
    }
  }

  pageHeader() {
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(7);
    this.doc.setTextColor(150, 150, 150);
    this.doc.text('FISIOLAB — HISTORIA CLÍNICA', MARGIN, this.y);
    this.doc.text(`Pág. ${this.page}`, PAGE_W - MARGIN, this.y, { align: 'right' });
    this.y += 6;
    this.doc.setDrawColor(220, 220, 220);
    this.doc.line(MARGIN, this.y, PAGE_W - MARGIN, this.y);
    this.y += 5;
    this.doc.setTextColor(30, 30, 30);
  }

  sectionTitle(title: string) {
    this.checkPage(14);
    this.y += 4;
    this.doc.setFillColor(71, 101, 220);
    this.doc.roundedRect(MARGIN, this.y, COL_W, 7, 2, 2, 'F');
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(8);
    this.doc.setTextColor(255, 255, 255);
    this.doc.text(title.toUpperCase(), MARGIN + 4, this.y + 4.8);
    this.doc.setTextColor(30, 30, 30);
    this.y += 11;
  }

  subTitle(title: string) {
    this.checkPage(10);
    this.y += 2;
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(8);
    this.doc.setTextColor(71, 101, 220);
    this.doc.text(title, MARGIN, this.y);
    this.y += 1;
    this.doc.setDrawColor(71, 101, 220);
    this.doc.line(MARGIN, this.y + 1, MARGIN + this.doc.getTextWidth(title), this.y + 1);
    this.doc.setDrawColor(220, 220, 220);
    this.doc.setTextColor(30, 30, 30);
    this.y += 4;
  }

  row(label: string, value: string | null | undefined, col2?: { label: string; value: string | null | undefined }) {
    const v = value ?? '—';
    this.checkPage(7);

    const halfW = (COL_W - 8) / 2;

    if (col2) {
      const v2 = col2.value ?? '—';
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(7);
      this.doc.setTextColor(100, 100, 100);
      this.doc.text(label, MARGIN, this.y);
      this.doc.text(col2.label, MARGIN + halfW + 8, this.y);
      this.y += 4;
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(8);
      this.doc.setTextColor(30, 30, 30);
      this.doc.text(v, MARGIN, this.y);
      this.doc.text(v2, MARGIN + halfW + 8, this.y);
      this.y += 5;
    } else {
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(7);
      this.doc.setTextColor(100, 100, 100);
      this.doc.text(label, MARGIN, this.y);
      this.y += 4;
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(8);
      this.doc.setTextColor(30, 30, 30);
      const lines = this.doc.splitTextToSize(v, COL_W);
      this.doc.text(lines, MARGIN, this.y);
      this.y += lines.length * 4.5;
    }
  }

  bool(label: string, value: boolean | null | undefined, detalle?: string | null) {
    const v = value ? `Sí${detalle ? ` — ${detalle}` : ''}` : value === false ? 'No' : '—';
    this.row(label, v);
  }

  divider() {
    this.checkPage(4);
    this.doc.setDrawColor(230, 230, 230);
    this.doc.line(MARGIN, this.y, PAGE_W - MARGIN, this.y);
    this.y += 4;
  }

  text(content: string, color?: [number, number, number]) {
    this.checkPage(7);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(8);
    this.doc.setTextColor(...(color ?? [30, 30, 30]));
    const lines = this.doc.splitTextToSize(content, COL_W);
    this.doc.text(lines, MARGIN, this.y);
    this.y += lines.length * 4.5;
    this.doc.setTextColor(30, 30, 30);
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function generateHistoriaPdf(data: any, patientName: string): void {
  const w = new PdfWriter();
  const { paciente, tarjetero, antecedentes, episodios, _totals } = data;

  // ── Portada / header principal ───────────────────────────────────────────────

  // Logo / clinic name block
  w.doc.setFillColor(71, 101, 220);
  w.doc.roundedRect(MARGIN, w.y, COL_W, 22, 3, 3, 'F');
  w.doc.setFont('helvetica', 'bold');
  w.doc.setFontSize(14);
  w.doc.setTextColor(255, 255, 255);
  w.doc.text('FISIOLAB', MARGIN + 6, w.y + 9);
  w.doc.setFontSize(8);
  w.doc.setFont('helvetica', 'normal');
  w.doc.text('HISTORIA CLÍNICA COMPLETA', MARGIN + 6, w.y + 16);

  // HC code
  if (tarjetero) {
    w.doc.setFont('helvetica', 'bold');
    w.doc.setFontSize(10);
    w.doc.text(tarjetero.codigoHc, PAGE_W - MARGIN - 4, w.y + 9, { align: 'right' });
    w.doc.setFontSize(7);
    w.doc.setFont('helvetica', 'normal');
    w.doc.text('CÓDIGO HC', PAGE_W - MARGIN - 4, w.y + 15, { align: 'right' });
  }

  w.doc.setTextColor(30, 30, 30);
  w.y += 27;

  // Fecha generación
  w.doc.setFont('helvetica', 'italic');
  w.doc.setFontSize(7);
  w.doc.setTextColor(130, 130, 130);
  const now = new Date().toLocaleString('es-EC', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
  w.doc.text(`Generado: ${now}`, PAGE_W - MARGIN, w.y, { align: 'right' });
  w.doc.setTextColor(30, 30, 30);
  w.y += 6;

  // ── Datos del paciente ───────────────────────────────────────────────────────

  w.sectionTitle('1. Datos del Paciente');

  const edad = calcEdad(paciente.fechaNacimiento);
  w.row('NOMBRE COMPLETO', `${paciente.nombres} ${paciente.apellidos}`);
  w.row(
    'CÉDULA DE IDENTIDAD',
    paciente.cedula,
    { label: 'FECHA DE NACIMIENTO', value: `${fmt(paciente.fechaNacimiento)} (${edad} años)` },
  );
  w.row(
    'GÉNERO',
    paciente.genero?.charAt(0).toUpperCase() + paciente.genero?.slice(1),
    { label: 'ESTADO CIVIL', value: paciente.estadoCivil?.replace('_', ' ') ?? '—' },
  );
  w.row('TELÉFONO', paciente.telefono, { label: 'EMERGENCIA', value: paciente.telefonoEmergencia });
  w.row('EMAIL', paciente.email);
  if (paciente.ciudad || paciente.provincia)
    w.row(
      'CIUDAD / PROVINCIA',
      [paciente.ciudad, paciente.provincia].filter(Boolean).join(', '),
    );
  if (paciente.direccion) w.row('DIRECCIÓN', paciente.direccion);
  if (paciente.ocupacion) w.row('OCUPACIÓN', paciente.ocupacion);

  // ── Tarjetero índice ─────────────────────────────────────────────────────────

  if (tarjetero) {
    w.sectionTitle('2. Tarjetero Índice');
    w.row('CÓDIGO HC', tarjetero.codigoHc, { label: 'ESTADO', value: tarjetero.estado?.toUpperCase() });
    w.row('FECHA APERTURA', fmt(tarjetero.fechaApertura));
    if (tarjetero.observaciones) w.row('OBSERVACIONES', tarjetero.observaciones);
  }

  // ── Resumen estadístico ───────────────────────────────────────────────────────

  if (_totals) {
    w.sectionTitle('3. Resumen Estadístico');
    const stats = [
      ['EPISODIOS', String(_totals.episodios)],
      ['NOTAS SOAP', String(_totals.soapNotes)],
      ['EVALUACIONES', String(_totals.evaluaciones)],
      ['PLANES', String(_totals.planes)],
      ['SESIONES', String(_totals.sesiones)],
    ];
    const colW = COL_W / stats.length;
    const boxH = 14;
    const boxY = w.y;
    stats.forEach(([label, val], i) => {
      const bx = MARGIN + i * colW;
      w.doc.setFillColor(246, 249, 255);
      w.doc.roundedRect(bx, boxY, colW - 2, boxH, 2, 2, 'F');
      w.doc.setFont('helvetica', 'bold');
      w.doc.setFontSize(14);
      w.doc.setTextColor(71, 101, 220);
      w.doc.text(val, bx + colW / 2 - 1, boxY + 7, { align: 'center' });
      w.doc.setFontSize(6);
      w.doc.setFont('helvetica', 'normal');
      w.doc.setTextColor(130, 130, 130);
      w.doc.text(label, bx + colW / 2 - 1, boxY + 12, { align: 'center' });
    });
    w.doc.setTextColor(30, 30, 30);
    w.y = boxY + boxH + 4;
  }

  // ── Antecedentes heredofamiliares ─────────────────────────────────────────────

  const heredo = antecedentes?.heredofamiliares;
  w.sectionTitle('4. Antecedentes Heredofamiliares');
  if (!heredo) {
    w.text('Sin registro', [150, 150, 150]);
  } else {
    const heredoItems: [string, boolean | null, string | null][] = [
      ['Diabetes', heredo.diabetes, heredo.diabetesFamiliar],
      ['Hipertensión', heredo.hipertension, heredo.hipertensionFamiliar],
      ['Cardiopatías', heredo.cardiopatias, heredo.cardiopatiasFamiliar],
      ['Cáncer', heredo.cancer, heredo.cancerFamiliar ? `${heredo.cancerTipo ?? ''} — ${heredo.cancerFamiliar}` : heredo.cancerTipo],
      ['Enf. respiratorias', heredo.enfermedadesRespiratorias, heredo.enfermedadesRespiratoriasTipo],
      ['Enf. renales', heredo.enfermedadesRenales, heredo.enfermedadesRenalesFamiliar],
      ['Enf. neurológicas', heredo.enfermedadesNeurologicas, heredo.enfermedadesNeurologicasTipo],
      ['Enf. mentales', heredo.enfermedadesMentales, heredo.enfermedadesMentalesTipo],
    ];
    heredoItems.filter(([, v]) => v).forEach(([label, val, det]) => {
      w.bool(label, val, det);
    });
    if (heredo.otros?.length) {
      w.subTitle('Otros antecedentes familiares');
      heredo.otros.forEach((o: any) => {
        w.row(o.enfermedad, o.notas ?? null, o.familiar ? { label: 'Familiar', value: o.familiar } : undefined);
      });
    }
  }

  // ── Antecedentes patológicos ──────────────────────────────────────────────────

  const pat = antecedentes?.patologicos;
  w.sectionTitle('5. Antecedentes Patológicos Personales');
  if (!pat) {
    w.text('Sin registro', [150, 150, 150]);
  } else {
    const patItems: [string, boolean | null | undefined, string | null | undefined][] = [
      ['Diabetes mellitus', pat.diabetesMellitus, pat.diabetesTipo ? `Tipo ${pat.diabetesTipo}${pat.diabetesAnioDiagnostico ? ` (${pat.diabetesAnioDiagnostico})` : ''}` : null],
      ['Hipertensión arterial', pat.hipertensionArterial, pat.hipertensionAnioDiagnostico ? `Desde ${pat.hipertensionAnioDiagnostico}` : null],
      ['Cardiopatías', pat.cardiopatias, pat.cardiopatiasTipo],
      ['Enf. respiratorias', pat.enfermedadesRespiratorias, pat.enfermedadesRespiratoriasTipo],
      ['Enf. renales', pat.enfermedadesRenales, pat.enfermedadesRenalesTipo],
      ['Cáncer', pat.cancer, pat.cancerTipo ? `${pat.cancerTipo}${pat.cancerRemision ? ' (en remisión)' : ''}` : null],
      ['Tuberculosis', pat.tuberculosis, null],
      ['Hepatitis', pat.hepatitis, pat.hepatitisTipo],
      ['VIH/SIDA', pat.vihSida, null],
      ['COVID-19', pat.covid19, pat.covid19Severidad ?? null],
      ['Epilepsia', pat.epilepsia, pat.epilepsiaControlada ? 'Controlada' : null],
      ['ACV', pat.accidenteCerebrovascular, null],
      ['Depresión', pat.depresion, null],
      ['Ansiedad', pat.ansiedad, null],
    ];
    patItems.filter(([, v]) => v).forEach(([label, val, det]) => {
      w.bool(label, val, det);
    });
    if (pat.cirugias?.length) w.row('Cirugías', JSON.stringify(pat.cirugias));
    if (pat.traumatismos?.length) w.row('Traumatismos', JSON.stringify(pat.traumatismos));
    if (pat.alergiasMedicamentos?.length) w.row('Alergias a medicamentos', JSON.stringify(pat.alergiasMedicamentos));
  }

  // ── Antecedentes no patológicos ───────────────────────────────────────────────

  const noPat = antecedentes?.noPatologicos;
  w.sectionTitle('6. Antecedentes No Patológicos (Hábitos)');
  if (!noPat) {
    w.text('Sin registro', [150, 150, 150]);
  } else {
    if (noPat.tabaquismo) w.row('Tabaquismo', `Sí — ${noPat.tabaquismoTipo ?? ''} · ${noPat.tabaquismoCigarrillosDia ?? '?'} cig/día`);
    if (noPat.alcoholismo) w.row('Alcoholismo', `Sí — ${noPat.alcoholismoFrecuencia ?? ''} · ${noPat.alcoholismoCantidad ?? ''}`);
    if (noPat.drogas) w.row('Drogas', `Sí — ${noPat.drogasTipo ?? ''}`);
    if (noPat.cafe) w.row('Café', `Sí — ${noPat.cafeTazasDia ?? '?'} tazas/día`);
    if (noPat.actividadFisica)
      w.row('Actividad física', `${noPat.actividadFisicaTipo ?? '—'} · ${noPat.actividadFisicaFrecuencia ?? '—'} · ${noPat.actividadFisicaDuracionMinutos ?? '?'} min`);
    if (noPat.alimentacionTipo) w.row('Alimentación', `${noPat.alimentacionTipo} · ${noPat.alimentacionComidasDia} comidas/día`);
    if (noPat.horasSuenoPromedio) w.row('Sueño', `${noPat.horasSuenoPromedio} h/noche · ${noPat.calidadSueno ?? ''}`);
    if (noPat.otrosHabitos) w.row('Otros hábitos', noPat.otrosHabitos);
    w.row('Vacunación completa', si(noPat.esquemaVacunacionCompleto));
  }

  // ── Antecedentes gineco-obstétricos ──────────────────────────────────────────

  const gineco = antecedentes?.ginecoObstetricos;
  if (gineco) {
    w.sectionTitle('7. Antecedentes Ginecoobstétricos');
    if (gineco.menarcaEdad) w.row('Menarca', `${gineco.menarcaEdad} años`);
    w.row('FUM', fmt(gineco.fechaUltimaMenstruacion));
    w.row(
      'Ciclo menstrual',
      `${si(gineco.cicloMenstrualRegular)} — ${gineco.cicloMenstrualDuracionDias} días`,
    );
    if (gineco.dismenorrea)
      w.row('Dismenorrea', `Sí — ${gineco.dismenorreaIntensidad ?? '—'}`);
    if (gineco.menopausia)
      w.row('Menopausia', `Sí${gineco.menopausiaEdad ? ` — ${gineco.menopausiaEdad} años` : ''}`);
    w.row(
      'Gestas / Partos / Cesáreas / Abortos',
      `G${gineco.gestas} P${gineco.partos} C${gineco.cesareas} A${gineco.abortos} — ${gineco.hijosVivos} vivos`,
    );
    if (gineco.embarazoActual)
      w.row('Embarazo actual', `Sí — ${gineco.embarazoActualSemanas ?? '?'} semanas`);
    if (gineco.metodoAnticonceptivoActual)
      w.row('Anticonceptivo', gineco.metodoAnticonceptivoActual);
    if (gineco.citologiaUltimaFecha)
      w.row('Citología', `${fmt(gineco.citologiaUltimaFecha)} — ${gineco.citologiaResultado ?? '—'}`);
    if (gineco.mamografiaUltimaFecha)
      w.row('Mamografía', fmt(gineco.mamografiaUltimaFecha));
    if (gineco.otros) w.row('Otros', gineco.otros);
  }

  // ── Episodios clínicos ────────────────────────────────────────────────────────

  const sectionNum = gineco ? 8 : 7;
  w.sectionTitle(`${sectionNum}. Episodios Clínicos`);

  if (!episodios?.length) {
    w.text('Sin episodios registrados', [150, 150, 150]);
  } else {
    episodios.forEach((ep: any, idx: number) => {
      w.checkPage(20);

      const estadoColor: [number, number, number] =
        ep.estado === 'abierto' ? [99, 179, 237] :
        ep.estado === 'en_tratamiento' ? [246, 173, 85] :
        ep.estado === 'cerrado' ? [104, 211, 145] : [160, 174, 192];

      // Episode header bar
      w.doc.setFillColor(...estadoColor);
      w.doc.roundedRect(MARGIN, w.y, COL_W, 8, 2, 2, 'F');
      w.doc.setFont('helvetica', 'bold');
      w.doc.setFontSize(8);
      w.doc.setTextColor(255, 255, 255);
      const estadoLabel = ep.estado?.replace('_', ' ').toUpperCase();
      w.doc.text(`${idx + 1}. ${ep.codigoHc}  ·  ${estadoLabel}`, MARGIN + 4, w.y + 5.5);
      w.doc.text(`${fmt(ep.fechaApertura)}${ep.fechaCierre ? ` → ${fmt(ep.fechaCierre)}` : ''}`, PAGE_W - MARGIN - 4, w.y + 5.5, { align: 'right' });
      w.doc.setTextColor(30, 30, 30);
      w.y += 11;

      w.row('MOTIVO DE CONSULTA', ep.motivoConsulta);
      if (ep.diagnosticoPrincipal) {
        w.row(
          'DIAGNÓSTICO PRINCIPAL',
          ep.diagnosticoPrincipal,
          ep.codigoCie10 ? { label: 'CIE-10', value: ep.codigoCie10 } : undefined,
        );
      }
      if (ep.diagnosticoSecundario) w.row('DIAGNÓSTICO SECUNDARIO', ep.diagnosticoSecundario);
      if (ep.notaApertura) w.row('NOTA APERTURA', ep.notaApertura);
      if (ep.notaCierre) w.row('NOTA CIERRE', ep.notaCierre);

      // Counters
      if (ep._counts) {
        const c = ep._counts;
        const parts = [
          `SOAP: ${c.soapNotes}`,
          `Evaluaciones: ${c.evaluaciones}`,
          `Planes: ${c.planes}`,
          `Sesiones: ${c.sesiones}`,
          `Interconsultas: ${c.interconsultas}`,
        ].join('  ·  ');
        w.doc.setFont('helvetica', 'normal');
        w.doc.setFontSize(7);
        w.doc.setTextColor(120, 120, 120);
        w.doc.text(parts, MARGIN, w.y);
        w.doc.setTextColor(30, 30, 30);
        w.y += 5;
      }

      if (idx < episodios.length - 1) {
        w.y += 2;
        w.divider();
      }
    });
  }

  // ── Footer última página ──────────────────────────────────────────────────────

  w.y = PAGE_H - MARGIN - 8;
  w.doc.setDrawColor(200, 200, 200);
  w.doc.line(MARGIN, w.y, PAGE_W - MARGIN, w.y);
  w.y += 4;
  w.doc.setFont('helvetica', 'italic');
  w.doc.setFontSize(7);
  w.doc.setTextColor(150, 150, 150);
  w.doc.text(
    'Documento generado electrónicamente por FisioLab. Válido únicamente con firma del profesional responsable.',
    PAGE_W / 2,
    w.y,
    { align: 'center' },
  );

  // ── Save ──────────────────────────────────────────────────────────────────────

  const safeName = patientName.replace(/\s+/g, '_').toLowerCase();
  const date = new Date().toISOString().split('T')[0];
  w.doc.save(`historia_clinica_${safeName}_${date}.pdf`);
}
