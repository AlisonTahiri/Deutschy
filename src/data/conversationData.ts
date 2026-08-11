import type { LearningLevel } from '../types';

// ═══════════════════════════════════════════════════════
// CONVERSATION TYPES
// ═══════════════════════════════════════════════════════

export type SpeakerId = string;

export interface Speaker {
  id: SpeakerId;
  name: string;
  gender: 'male' | 'female';
}

export interface ConversationMessage {
  id: string;
  speakerId: SpeakerId;
  german: string;
  albanian: string;
  /** Delay in ms before this message appears (simulates natural pause) */
  delayMs: number;
}

export interface Conversation {
  id: string;
  title: string;
  titleAlbanian: string;
  level: LearningLevel;
  scenario: string;
  scenarioAlbanian: string;
  speakers: Speaker[];
  messages: ConversationMessage[];
}

// ═══════════════════════════════════════════════════════
// B1 SCENARIO: "Im Café nach den Sommerferien"
// Two friends meet at a café after summer holidays.
// ═══════════════════════════════════════════════════════

const B1_CAFE_CONVERSATION: Conversation = {
  id: 'b1-cafe-sommerferien',
  title: 'Im Café nach den Sommerferien',
  titleAlbanian: 'Në kafe pas pushimeve verore',
  level: 'B1',
  scenario: 'Zwei Freunde treffen sich nach den Sommerferien in einem Café und erzählen über ihre Erlebnisse.',
  scenarioAlbanian: 'Dy miq takohen pas pushimeve verore në një kafene dhe tregojnë për përvojat e tyre.',
  speakers: [
    { id: 'anna', name: 'Anna', gender: 'female' },
    { id: 'markus', name: 'Markus', gender: 'male' },
  ],
  messages: [
    {
      id: 'msg-01',
      speakerId: 'anna',
      german: 'Hey Markus! Schön, dich wiederzusehen! Wie war dein Sommer?',
      albanian: 'Hej Markus! Sa mirë të të shoh prapë! Si ishte vera jote?',
      delayMs: 1200,
    },
    {
      id: 'msg-02',
      speakerId: 'markus',
      german: 'Hallo Anna! Ja, es ist lange her. Mein Sommer war wirklich toll! Ich war zwei Wochen in Kroatien.',
      albanian: 'Përshëndetje Anna! Po, ka kohë që nuk jemi parë. Vera ime ishte vërtet fantastike! Isha dy javë në Kroaci.',
      delayMs: 1800,
    },
    {
      id: 'msg-03',
      speakerId: 'anna',
      german: 'Oh, wie schön! Kroatien ist wunderschön. Warst du am Meer?',
      albanian: 'Oh, sa bukur! Kroacia është e mrekullueshme. Ishe në det?',
      delayMs: 1500,
    },
    {
      id: 'msg-04',
      speakerId: 'markus',
      german: 'Ja, wir hatten ein kleines Apartment direkt am Strand in Split. Das Wasser war so klar!',
      albanian: 'Po, kishim një apartament të vogël direkt pranë plazhit në Split. Uji ishte aq i pastër!',
      delayMs: 2000,
    },
    {
      id: 'msg-05',
      speakerId: 'anna',
      german: 'Das klingt traumhaft. Und was hast du dort gemacht? Nur Strand oder auch Ausflüge?',
      albanian: 'Tingëllon si ëndërr. Dhe çfarë bëre atje? Vetëm plazh apo edhe ekskursione?',
      delayMs: 1800,
    },
    {
      id: 'msg-06',
      speakerId: 'markus',
      german: 'Wir haben viel unternommen! Wir haben die Altstadt besichtigt und sind auch mit dem Boot zu einer kleinen Insel gefahren.',
      albanian: 'Bëmë shumë gjëra! Vizituam qytetin e vjetër dhe shkuam edhe me varkë në një ishull të vogël.',
      delayMs: 2200,
    },
    {
      id: 'msg-07',
      speakerId: 'anna',
      german: 'Das hört sich super an! Und wie war das Essen dort?',
      albanian: 'Kjo tingëllon super! Dhe si ishte ushqimi atje?',
      delayMs: 1400,
    },
    {
      id: 'msg-08',
      speakerId: 'markus',
      german: 'Fantastisch! Wir haben jeden Abend frischen Fisch gegessen. Und du? Was hast du im Sommer gemacht?',
      albanian: 'Fantastik! Çdo mbrëmje hëngëm peshk të freskët. Po ti? Çfarë bëre gjatë verës?',
      delayMs: 2000,
    },
    {
      id: 'msg-09',
      speakerId: 'anna',
      german: 'Ich bin nach Berlin gefahren, um meine Schwester zu besuchen. Sie wohnt dort seit zwei Jahren.',
      albanian: 'Shkova në Berlin për të vizituar motrën time. Ajo jeton atje prej dy vjetësh.',
      delayMs: 2000,
    },
    {
      id: 'msg-10',
      speakerId: 'markus',
      german: 'Cool! Berlin ist eine tolle Stadt. Wie hat es dir gefallen?',
      albanian: 'Bukur! Berlini është një qytet fantastik. Si të pëlqeu?',
      delayMs: 1500,
    },
    {
      id: 'msg-11',
      speakerId: 'anna',
      german: 'Ich liebe Berlin! Wir waren im Museum, haben im Park gepicknickt und sind abends in ein tolles Restaurant gegangen.',
      albanian: 'E dua Berlinin! Shkuam në muze, bëmë piknik në park dhe mbrëmjeve shkuam në një restorant fantastik.',
      delayMs: 2400,
    },
    {
      id: 'msg-12',
      speakerId: 'markus',
      german: 'Klingt nach einem perfekten Urlaub. Hast du auch etwas Neues ausprobiert?',
      albanian: 'Duket si një pushim perfekt. A provove edhe diçka të re?',
      delayMs: 1800,
    },
    {
      id: 'msg-13',
      speakerId: 'anna',
      german: 'Ja! Ich habe einen Kochkurs besucht. Wir haben gelernt, wie man typisches Berliner Essen kocht.',
      albanian: 'Po! Ndoqa një kurs gatimi. Mësuam si gatuhet ushqimi tipik i Berlinit.',
      delayMs: 2000,
    },
    {
      id: 'msg-14',
      speakerId: 'markus',
      german: 'Das ist ja cool! Was hast du gekocht?',
      albanian: 'Sa bukur! Çfarë gatove?',
      delayMs: 1200,
    },
    {
      id: 'msg-15',
      speakerId: 'anna',
      german: 'Currywurst und Kartoffelpuffer! Es hat wirklich Spaß gemacht.',
      albanian: 'Currywurst dhe petulla me patate! Ishte vërtet argëtuese.',
      delayMs: 1600,
    },
    {
      id: 'msg-16',
      speakerId: 'markus',
      german: 'Ha ha, lecker! Sag mal, hast du schon Pläne für nächste Woche? Ich dachte, wir könnten zusammen ins Kino gehen.',
      albanian: 'Ha ha, e shijshme! Thuam, a ke plane për javën e ardhshme? Mendova se mund të shkojmë bashkë në kinema.',
      delayMs: 2200,
    },
    {
      id: 'msg-17',
      speakerId: 'anna',
      german: 'Ja, gerne! Am Samstag habe ich Zeit. Welchen Film möchtest du sehen?',
      albanian: 'Po, me kënaqësi! Të shtunën kam kohë. Cilin film do të shohësh?',
      delayMs: 1800,
    },
    {
      id: 'msg-18',
      speakerId: 'markus',
      german: 'Es läuft ein neuer deutscher Film. Er soll sehr gut sein. Sollen wir uns um sieben Uhr vor dem Kino treffen?',
      albanian: 'Ka një film të ri gjerman. Thuhet se është shumë i mirë. A duhet të takohemi në orën shtatë para kinemase?',
      delayMs: 2400,
    },
    {
      id: 'msg-19',
      speakerId: 'anna',
      german: 'Perfekt! Um sieben passt mir gut. Ich freue mich schon darauf!',
      albanian: 'Perfekt! Ora shtatë më përshtatet mirë. Mezi pres!',
      delayMs: 1600,
    },
    {
      id: 'msg-20',
      speakerId: 'markus',
      german: 'Super, dann bis Samstag! Aber jetzt bestelle ich erstmal noch einen Kaffee. Möchtest du auch noch einen?',
      albanian: 'Super, atëherë deri të shtunën! Por tani po porosis edhe një kafe. Do edhe ti një?',
      delayMs: 2000,
    },
    {
      id: 'msg-21',
      speakerId: 'anna',
      german: 'Ja, einen Cappuccino bitte! Danke dir.',
      albanian: 'Po, një cappuccino ju lutem! Faleminderit.',
      delayMs: 1200,
    },
  ],
};

// ═══════════════════════════════════════════════════════
// EXPORTED CONVERSATIONS LIST
// ═══════════════════════════════════════════════════════

export const conversations: Conversation[] = [
  B1_CAFE_CONVERSATION,
];

export function getConversationById(id: string): Conversation | undefined {
  return conversations.find(c => c.id === id);
}
