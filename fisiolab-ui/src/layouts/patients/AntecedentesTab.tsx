import { useAntecedentesResumen } from 'hooks/useAntecedentes';
import AntecedentesPanel from 'layouts/patients/AntecedentesPanel';
import React from 'react';
import { Patient } from 'types/models';

interface Props {
  patient: Patient;
}

export default function AntecedentesTab({ patient }: Props) {
  const { data: resumen } = useAntecedentesResumen(patient.id);
  return <AntecedentesPanel patient={patient} resumen={resumen} />;
}
