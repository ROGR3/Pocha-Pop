// 부산 ticket booth: destination → accepted transport (§4.5). Only deck words.
export interface Destination { id: string; cs: string; icon: string; answers: string[] }

export const DESTINATIONS: Destination[] = [
  { id: 'jejudo', cs: 'na Jeju', icon: 'jejudo', answers: ['bae_boat'] },
  { id: 'seoul', cs: 'do Soulu', icon: 'seoul', answers: ['gicha'] },
  { id: 'gonghang', cs: 'na letiště', icon: 'gonghang', answers: ['beoseu', 'jihacheol'] },
  { id: 'gangnam', cs: 'do Kangnamu', icon: 'gangnam', answers: ['jihacheol'] },
  { id: 'incheon', cs: 'do Inčchonu', icon: 'incheon', answers: ['gicha'] },
  { id: 'yeok', cs: 'na nádraží', icon: 'yeok', answers: ['beoseu', 'taeksi'] },
  { id: 'bada', cs: 'k moři', icon: 'bada', answers: ['taeksi', 'beoseu'] },
  { id: 'teomineol', cs: 'na terminál', icon: 'teomineol', answers: ['beoseu', 'taeksi'] },
];

/** Transport you buy a ticket (표) for; a taxi you just pay. */
export const TICKETED = ['gicha', 'beoseu', 'jihacheol', 'bae_boat'];
