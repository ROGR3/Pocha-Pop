// 약국 side line: body parts shown on a figure (L1–L2) and symptoms told in
// Czech that the player answers with the right remedy (L3–L4).
export const BODY_PARTS = ['meori', 'bae_belly', 'dari', 'son', 'bal', 'gwi', 'nun_eye', 'mom'];

export interface Symptom { cs: string; icon: string; answers: string[] }

export const SYMPTOMS: Symptom[] = [
  { cs: 'Řízl jsem se do prstu.', icon: 'sangcheo', answers: ['banchanggo'] },
  { cs: 'Odřené koleno!', icon: 'sangcheo', answers: ['banchanggo'] },
  { cs: 'Spálila jsem se o hrnec.', icon: 'son', answers: ['banchanggo', 'yak'] },
  { cs: 'Bolí mě hlava.', icon: 'meori', answers: ['yak'] },
  { cs: 'Mám rýmu a kašel.', icon: 'gamgi', answers: ['yak'] },
  { cs: 'Mám horečku.', icon: 'gamgi', answers: ['yak', 'byeongwon'] },
  { cs: 'Bolí mě břicho.', icon: 'bae_belly', answers: ['yak'] },
  { cs: 'Asi mám zlomenou nohu!', icon: 'dari', answers: ['byeongwon'] },
  { cs: 'Něco mi spadlo do oka.', icon: 'nun_eye', answers: ['byeongwon'] },
];
