
export enum ToolID {
  FM_SYNTH = 'fm-synth',
  GUITAR_GALLERY = 'guitar-gallery',
  EFFECT_SOUND = 'effect-sound'
}

export interface Guitar {
  id: string;
  name: string;
  brand: string;
  year: string;
  description: string;
  imageUrl: string;
  color: string;
}

export interface AudioEffect {
  id: string;
  name: string;
  description: string;
  active: boolean;
}
