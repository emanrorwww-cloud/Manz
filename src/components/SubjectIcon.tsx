import React from 'react';
import {
  Calculator,
  Atom,
  BookOpen,
  Languages,
  Globe2,
  GraduationCap,
  Sparkles,
  Layers,
} from 'lucide-react';

interface SubjectIconProps {
  name: string;
  className?: string;
}

export const SubjectIcon: React.FC<SubjectIconProps> = ({ name, className = 'w-5 h-5' }) => {
  switch (name.toLowerCase()) {
    case 'calculator':
    case 'matematika':
      return <Calculator className={className} />;
    case 'atom':
    case 'ipa':
      return <Atom className={className} />;
    case 'bookopen':
    case 'bahasa_indonesia':
      return <BookOpen className={className} />;
    case 'languages':
    case 'bahasa_inggris':
      return <Languages className={className} />;
    case 'globe2':
    case 'pengetahuan_umum':
      return <Globe2 className={className} />;
    case 'sparkles':
      return <Sparkles className={className} />;
    case 'graduationcap':
      return <GraduationCap className={className} />;
    default:
      return <Layers className={className} />;
  }
};
