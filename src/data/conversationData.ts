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
  /** Audio file identifier — maps to /sounds/{soundId}.mp3 */
  soundId: string;
}

export interface Conversation {
  id: string;
  title: string;
  titleAlbanian: string;
  level: LearningLevel;
  type: 'diskutim' | 'prezantim';
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
  type: 'diskutim',
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
      soundId: 'b1-cafe-sommerferien_msg-01',
    },
    {
      id: 'msg-02',
      speakerId: 'markus',
      german: 'Hallo Anna! Ja, es ist lange her. Mein Sommer war wirklich toll! Ich war zwei Wochen in Kroatien.',
      albanian: 'Përshëndetje Anna! Po, ka kohë që nuk jemi parë. Vera ime ishte vërtet fantastike! Isha dy javë në Kroaci.',
      delayMs: 1800,
      soundId: 'b1-cafe-sommerferien_msg-02',
    },
    {
      id: 'msg-03',
      speakerId: 'anna',
      german: 'Oh, wie schön! Kroatien ist wunderschön. Warst du am Meer?',
      albanian: 'Oh, sa bukur! Kroacia është e mrekullueshme. Ishe në det?',
      delayMs: 1500,
      soundId: 'b1-cafe-sommerferien_msg-03',
    },
    {
      id: 'msg-04',
      speakerId: 'markus',
      german: 'Ja, wir hatten ein kleines Apartment direkt am Strand in Split. Das Wasser war so klar!',
      albanian: 'Po, kishim një apartament të vogël direkt pranë plazhit në Split. Uji ishte aq i pastër!',
      delayMs: 2000,
      soundId: 'b1-cafe-sommerferien_msg-04',
    },
    {
      id: 'msg-05',
      speakerId: 'anna',
      german: 'Das klingt traumhaft. Und was hast du dort gemacht? Nur Strand oder auch Ausflüge?',
      albanian: 'Tingëllon si ëndërr. Dhe çfarë bëre atje? Vetëm plazh apo edhe ekskursione?',
      delayMs: 1800,
      soundId: 'b1-cafe-sommerferien_msg-05',
    },
    {
      id: 'msg-06',
      speakerId: 'markus',
      german: 'Wir haben viel unternommen! Wir haben die Altstadt besichtigt und sind auch mit dem Boot zu einer kleinen Insel gefahren.',
      albanian: 'Bëmë shumë gjëra! Vizituam qytetin e vjetër dhe shkuam edhe me varkë në një ishull të vogël.',
      delayMs: 2200,
      soundId: 'b1-cafe-sommerferien_msg-06',
    },
    {
      id: 'msg-07',
      speakerId: 'anna',
      german: 'Das hört sich super an! Und wie war das Essen dort?',
      albanian: 'Kjo tingëllon super! Dhe si ishte ushqimi atje?',
      delayMs: 1400,
      soundId: 'b1-cafe-sommerferien_msg-07',
    },
    {
      id: 'msg-08',
      speakerId: 'markus',
      german: 'Fantastisch! Wir haben jeden Abend frischen Fisch gegessen. Und du? Was hast du im Sommer gemacht?',
      albanian: 'Fantastik! Çdo mbrëmje hëngëm peshk të freskët. Po ti? Çfarë bëre gjatë verës?',
      delayMs: 2000,
      soundId: 'b1-cafe-sommerferien_msg-08',
    },
    {
      id: 'msg-09',
      speakerId: 'anna',
      german: 'Ich bin nach Berlin gefahren, um meine Schwester zu besuchen. Sie wohnt dort seit zwei Jahren.',
      albanian: 'Shkova në Berlin për të vizituar motrën time. Ajo jeton atje prej dy vjetësh.',
      delayMs: 2000,
      soundId: 'b1-cafe-sommerferien_msg-09',
    },
    {
      id: 'msg-10',
      speakerId: 'markus',
      german: 'Cool! Berlin ist eine tolle Stadt. Wie hat es dir gefallen?',
      albanian: 'Bukur! Berlini është një qytet fantastik. Si të pëlqeu?',
      delayMs: 1500,
      soundId: 'b1-cafe-sommerferien_msg-10',
    },
    {
      id: 'msg-11',
      speakerId: 'anna',
      german: 'Ich liebe Berlin! Wir waren im Museum, haben im Park gepicknickt und sind abends in ein tolles Restaurant gegangen.',
      albanian: 'E dua Berlinin! Shkuam në muze, bëmë piknik në park dhe mbrëmjeve shkuam në një restorant fantastik.',
      delayMs: 2400,
      soundId: 'b1-cafe-sommerferien_msg-11',
    },
    {
      id: 'msg-12',
      speakerId: 'markus',
      german: 'Klingt nach einem perfekten Urlaub. Hast du auch etwas Neues ausprobiert?',
      albanian: 'Duket si një pushim perfekt. A provove edhe diçka të re?',
      delayMs: 1800,
      soundId: 'b1-cafe-sommerferien_msg-12',
    },
    {
      id: 'msg-13',
      speakerId: 'anna',
      german: 'Ja! Ich habe einen Kochkurs besucht. Wir haben gelernt, wie man typisches Berliner Essen kocht.',
      albanian: 'Po! Ndoqa një kurs gatimi. Mësuam si gatuhet ushqimi tipik i Berlinit.',
      delayMs: 2000,
      soundId: 'b1-cafe-sommerferien_msg-13',
    },
    {
      id: 'msg-14',
      speakerId: 'markus',
      german: 'Das ist ja cool! Was hast du gekocht?',
      albanian: 'Sa bukur! Çfarë gatove?',
      delayMs: 1200,
      soundId: 'b1-cafe-sommerferien_msg-14',
    },
    {
      id: 'msg-15',
      speakerId: 'anna',
      german: 'Currywurst und Kartoffelpuffer! Es hat wirklich Spaß gemacht.',
      albanian: 'Currywurst dhe petulla me patate! Ishte vërtet argëtuese.',
      delayMs: 1600,
      soundId: 'b1-cafe-sommerferien_msg-15',
    },
    {
      id: 'msg-16',
      speakerId: 'markus',
      german: 'Ha ha, lecker! Sag mal, hast du schon Pläne für nächste Woche? Ich dachte, wir könnten zusammen ins Kino gehen.',
      albanian: 'Ha ha, e shijshme! Thuam, a ke plane për javën e ardhshme? Mendova se mund të shkojmë bashkë në kinema.',
      delayMs: 2200,
      soundId: 'b1-cafe-sommerferien_msg-16',
    },
    {
      id: 'msg-17',
      speakerId: 'anna',
      german: 'Ja, gerne! Am Samstag habe ich Zeit. Welchen Film möchtest du sehen?',
      albanian: 'Po, me kënaqësi! Të shtunën kam kohë. Cilin film do të shohësh?',
      delayMs: 1800,
      soundId: 'b1-cafe-sommerferien_msg-17',
    },
    {
      id: 'msg-18',
      speakerId: 'markus',
      german: 'Es läuft ein neuer deutscher Film. Er soll sehr gut sein. Sollen wir uns um sieben Uhr vor dem Kino treffen?',
      albanian: 'Ka një film të ri gjerman. Thuhet se është shumë i mirë. A duhet të takohemi në orën shtatë para kinemase?',
      delayMs: 2400,
      soundId: 'b1-cafe-sommerferien_msg-18',
    },
    {
      id: 'msg-19',
      speakerId: 'anna',
      german: 'Perfekt! Um sieben passt mir gut. Ich freue mich schon darauf!',
      albanian: 'Perfekt! Ora shtatë më përshtatet mirë. Mezi pres!',
      delayMs: 1600,
      soundId: 'b1-cafe-sommerferien_msg-19',
    },
    {
      id: 'msg-20',
      speakerId: 'markus',
      german: 'Super, dann bis Samstag! Aber jetzt bestelle ich erstmal noch einen Kaffee. Möchtest du auch noch einen?',
      albanian: 'Super, atëherë deri të shtunën! Por tani po porosis edhe një kafe. Do edhe ti një?',
      delayMs: 2000,
      soundId: 'b1-cafe-sommerferien_msg-20',
    },
    {
      id: 'msg-21',
      speakerId: 'anna',
      german: 'Ja, einen Cappuccino bitte! Danke dir.',
      albanian: 'Po, një cappuccino ju lutem! Faleminderit.',
      delayMs: 1200,
      soundId: 'b1-cafe-sommerferien_msg-21',
    },
  ],
};

// ═══════════════════════════════════════════════════════
// EXPORTED CONVERSATIONS LIST
// ═══════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════
// B1 SCENARIO: "Ein Picknick planen"
// Two friends plan a picnic for the weekend.
// ═══════════════════════════════════════════════════════

const B1_PICKNICK_CONVERSATION: Conversation = {
  id: 'b1-picknick-planung',
  title: 'Ein Picknick planen',
  titleAlbanian: 'Planifikimi i një pikniku',
  level: 'B1',
  type: 'diskutim',
  scenario: 'Zwei Freunde planen ein Picknick für das kommende Wochenende im Park.',
  scenarioAlbanian: 'Dy miq planifikojnë një piknik për fundjavën e ardhshme në park.',
  speakers: [
    { id: 'anna', name: 'Anna', gender: 'female' },
    { id: 'markus', name: 'Markus', gender: 'male' },
  ],
  messages: [
    {
      id: 'msg-01',
      speakerId: 'anna',
      german: 'Hallo Markus! Hast du am Wochenende schon etwas vor?',
      albanian: 'Përshëndetje Markus! A ke ndonjë plan për fundjavën?',
      delayMs: 1500,
      soundId: 'b1-picknick-planung_msg-01',
    },
    {
      id: 'msg-02',
      speakerId: 'markus',
      german: 'Hey Anna! Nein, noch nicht wirklich. Warum fragst du?',
      albanian: 'Hej Anna! Jo, jo vërtet ende. Pse pyet?',
      delayMs: 1400,
      soundId: 'b1-picknick-planung_msg-02',
    },
    {
      id: 'msg-03',
      speakerId: 'anna',
      german: 'Das Wetter soll am Samstag richtig schön werden. Hast du Lust auf ein Picknick im Park?',
      albanian: 'Moti të shtunën pritet të jetë shumë i bukur. Ke dëshirë për një piknik në park?',
      delayMs: 2200,
      soundId: 'b1-picknick-planung_msg-03',
    },
    {
      id: 'msg-04',
      speakerId: 'markus',
      german: 'Das ist eine tolle Idee! Ich war schon lange nicht mehr im Park.',
      albanian: 'Kjo është një ide fantastike! Ka kohë që nuk kam qenë në park.',
      delayMs: 1800,
      soundId: 'b1-picknick-planung_msg-04',
    },
    {
      id: 'msg-05',
      speakerId: 'anna',
      german: 'Super! Sollen wir uns so um 13 Uhr treffen?',
      albanian: 'Super! A të takohemi rreth orës 13:00?',
      delayMs: 1200,
      soundId: 'b1-picknick-planung_msg-05',
    },
    {
      id: 'msg-06',
      speakerId: 'markus',
      german: 'Ja, 13 Uhr passt perfekt. Was sollen wir zum Essen mitbringen?',
      albanian: 'Po, ora 13 përshtatet perfekt. Çfarë duhet të sjellim për të ngrënë?',
      delayMs: 1800,
      soundId: 'b1-picknick-planung_msg-06',
    },
    {
      id: 'msg-07',
      speakerId: 'anna',
      german: 'Ich kann einen Nudelsalat und etwas frisches Obst machen.',
      albanian: 'Unë mund të bëj një sallatë me makarona dhe pak fruta të freskëta.',
      delayMs: 1600,
      soundId: 'b1-picknick-planung_msg-07',
    },
    {
      id: 'msg-08',
      speakerId: 'markus',
      german: 'Klingt lecker! Dann bringe ich belegte Brötchen und etwas zu trinken mit.',
      albanian: 'Tingëllon e shijshme! Atëherë unë do të sjell sanduiçe dhe diçka për të pirë.',
      delayMs: 2000,
      soundId: 'b1-picknick-planung_msg-08',
    },
    {
      id: 'msg-09',
      speakerId: 'anna',
      german: 'Perfekt! Möchtest du lieber Wasser oder Apfelschorle?',
      albanian: 'Perfekt! Preferon ujë apo lëng molle me gaz?',
      delayMs: 1400,
      soundId: 'b1-picknick-planung_msg-09',
    },
    {
      id: 'msg-10',
      speakerId: 'markus',
      german: 'Ein bisschen Apfelschorle wäre super. Und vielleicht noch etwas Süßes?',
      albanian: 'Pak lëng molle me gaz do ishte super. Dhe ndoshta diçka të ëmbël?',
      delayMs: 1800,
      soundId: 'b1-picknick-planung_msg-10',
    },
    {
      id: 'msg-11',
      speakerId: 'anna',
      german: 'Gute Idee, ich kaufe noch Kekse oder einen kleinen Kuchen.',
      albanian: 'Ide e mirë, unë do blej edhe biskota ose një tortë të vogël.',
      delayMs: 1600,
      soundId: 'b1-picknick-planung_msg-11',
    },
    {
      id: 'msg-12',
      speakerId: 'markus',
      german: 'Soll ich auch eine große Decke mitbringen? Ich habe eine sehr bequeme.',
      albanian: 'A duhet të sjell edhe një batanije të madhe? Kam një shumë të rehatshme.',
      delayMs: 2000,
      soundId: 'b1-picknick-planung_msg-12',
    },
    {
      id: 'msg-13',
      speakerId: 'anna',
      german: 'Ja, bitte! Meine Picknickdecke ist leider ein bisschen zu klein.',
      albanian: 'Po, të lutem! Batanija ime e piknikut është për fat të keq pak e vogël.',
      delayMs: 1800,
      soundId: 'b1-picknick-planung_msg-13',
    },
    {
      id: 'msg-14',
      speakerId: 'markus',
      german: 'Kein Problem. Treffen wir uns direkt am großen Brunnen im Park?',
      albanian: 'S\'ka problem. A takohemi direkt tek shatërvani i madh në park?',
      delayMs: 1800,
      soundId: 'b1-picknick-planung_msg-14',
    },
    {
      id: 'msg-15',
      speakerId: 'anna',
      german: 'Das ist ein guter Treffpunkt. Da finden wir uns schnell.',
      albanian: 'Ai është një vend takimi i mirë. Aty e gjejmë njëri-tjetrin shpejt.',
      delayMs: 1400,
      soundId: 'b1-picknick-planung_msg-15',
    },
    {
      id: 'msg-16',
      speakerId: 'markus',
      german: 'Hoffentlich gibt es dort auch einen Platz im Schatten. Die Sonne soll sehr stark sein.',
      albanian: 'Shpresojmë që aty të ketë edhe një vend në hije. Dielli thuhet se do të jetë shumë i fortë.',
      delayMs: 2200,
      soundId: 'b1-picknick-planung_msg-16',
    },
    {
      id: 'msg-17',
      speakerId: 'anna',
      german: 'Wir finden bestimmt einen Platz unter einem großen Baum.',
      albanian: 'Ne me siguri do të gjejmë një vend nën një pemë të madhe.',
      delayMs: 1500,
      soundId: 'b1-picknick-planung_msg-17',
    },
    {
      id: 'msg-18',
      speakerId: 'markus',
      german: 'Ganz bestimmt. Ich freue mich schon sehr auf Samstag!',
      albanian: 'Me siguri. Mezi pres të shtunën!',
      delayMs: 1500,
      soundId: 'b1-picknick-planung_msg-18',
    },
    {
      id: 'msg-19',
      speakerId: 'anna',
      german: 'Ich mich auch! Dann sehen wir uns am Samstag um 13 Uhr.',
      albanian: 'Edhe unë! Atëherë shihemi të shtunën në orën 13.',
      delayMs: 1600,
      soundId: 'b1-picknick-planung_msg-19',
    },
    {
      id: 'msg-20',
      speakerId: 'markus',
      german: 'Bis dann, Anna! Mach\'s gut!',
      albanian: 'Deri atëherë, Anna! Gjithë të mirat!',
      delayMs: 1200,
      soundId: 'b1-picknick-planung_msg-20',
    },
  ],
};

// ═══════════════════════════════════════════════════════
// B1 SCENARIO: "Leben in der Stadt oder auf dem Land?" (Präsentation)
// ═══════════════════════════════════════════════════════

const B1_PREZANTIM_STADT_LAND: Conversation = {
  id: 'b1-prezantim-stadt-land',
  title: 'Leben in der Stadt oder auf dem Land?',
  titleAlbanian: 'Jeta në qytet apo në fshat?',
  level: 'B1',
  type: 'prezantim',
  scenario: 'Ein Kandidat hält eine Präsentation über das Thema "Leben in der Stadt oder auf dem Land?" und beantwortet danach Fragen.',
  scenarioAlbanian: 'Një kandidat mban një prezantim mbi temën "Jeta në qytet apo në fshat?" dhe më pas i përgjigjet pyetjeve.',
  speakers: [
    { id: 'markus', name: 'Markus', gender: 'male' },
    { id: 'anna', name: 'Anna', gender: 'female' },
  ],
  messages: [
    {
      id: 'msg-01',
      speakerId: 'markus',
      german: 'Guten Tag zusammen! Mein Thema heute ist „Leben in der Stadt oder auf dem Land?“. Dieses Thema ist sehr aktuell und wichtig, weil viele Menschen oft darüber nachdenken, wo sie und ihre Familien eigentlich besser leben können.',
      albanian: 'Mirëdita të gjithëve! Tema ime sot është "Jeta në qytet apo në fshat?". Kjo temë është shumë aktuale dhe e rëndësishme, sepse shumë njerëz shpesh mendojnë se ku mund të jetojnë vërtet më mirë ata dhe familjet e tyre.',
      delayMs: 3000,
      soundId: 'b1-prezantim-stadt-land_msg-01',
    },
    {
      id: 'msg-02',
      speakerId: 'markus',
      german: 'Zuerst möchte ich über meine persönlichen Erfahrungen sprechen. Danach sage ich etwas zur Situation in meinem Heimatland. Dann nenne ich die Vor- und Nachteile von beiden Lebensweisen. Und zum Schluss sage ich Ihnen natürlich meine eigene Meinung dazu.',
      albanian: 'Së pari dua të flas për përvojat e mia personale. Më pas do të them diçka për situatën në vendlindjen time. Pastaj do të përmend avantazhet dhe disavantazhet e të dyja mënyrave të jetesës. Dhe në fund do t\'ju them natyrisht mendimin tim rreth kësaj.',
      delayMs: 5000,
      soundId: 'b1-prezantim-stadt-land_msg-02',
    },
    {
      id: 'msg-03',
      speakerId: 'markus',
      german: 'Ich persönlich bin in einem kleinen, ruhigen Dorf aufgewachsen. Es war dort wunderschön und wir hatten sehr viel Natur um uns herum. Aber als ich angefangen habe an der Universität zu studieren, bin ich in eine Großstadt gezogen.',
      albanian: 'Unë personalisht jam rritur në një fshat të vogël e të qetë. Atje ishte shumë bukur dhe kishim shumë natyrë përreth nesh. Por kur fillova të studioj në universitet, u shpërngula në një qytet të madh.',
      delayMs: 6000,
      soundId: 'b1-prezantim-stadt-land_msg-03',
    },
    {
      id: 'msg-04',
      speakerId: 'markus',
      german: 'In Albanien, meinem Heimatland, ziehen heute immer mehr junge Menschen in die großen Städte wie Tirana oder Durrës, weil es dort mehr Arbeit, bessere Universitäten und ein aktives Nachtleben gibt. Auf dem Land bleiben leider oft nur noch ältere Leute.',
      albanian: 'Në Shqipëri, vendlindjen time, sot gjithnjë e më shumë të rinj po shpërngulen në qytetet e mëdha si Tirana ose Durrësi, sepse atje ka më shumë punë, universitete më të mira dhe një jetë aktive nate. Për fat të keq, në fshat shpesh mbeten vetëm të moshuarit.',
      delayMs: 7000,
      soundId: 'b1-prezantim-stadt-land_msg-04',
    },
    {
      id: 'msg-05',
      speakerId: 'markus',
      german: 'Ein großer Vorteil vom Stadtleben ist natürlich die gute Infrastruktur. Man hat Busse, Krankenhäuser, Kinos und viele Einkaufsmöglichkeiten direkt in der Nähe. Ein großer Nachteil ist jedoch der ständige Stress, der laute Verkehr und oft auch die schlechte Luft.',
      albanian: 'Një avantazh i madh i jetës në qytet është natyrisht infrastruktura e mirë. Ke autobusë, spitale, kinema dhe shumë mundësi blerjeje direkt pranë. Por një disavantazh i madh është stresi i vazhdueshëm, trafiku i zhurmshëm dhe shpesh edhe ajri i keq.',
      delayMs: 8000,
      soundId: 'b1-prezantim-stadt-land_msg-05',
    },
    {
      id: 'msg-06',
      speakerId: 'markus',
      german: 'Auf dem Land dagegen ist die Luft viel sauberer und das Leben ist generell entspannter. Das ist ein wunderbarer Vorteil, besonders für Familien mit Kindern. Aber ein Nachteil ist, dass man fast immer ein Auto braucht, um zur Arbeit zu kommen oder einzukaufen.',
      albanian: 'Në fshat nga ana tjetër ajri është shumë më i pastër dhe jeta është përgjithësisht më e qetë. Ky është një avantazh i mrekullueshëm, veçanërisht për familjet me fëmijë. Por një disavantazh është se pothuajse gjithmonë të duhet një makinë për të shkuar në punë ose për të bërë pazar.',
      delayMs: 7000,
      soundId: 'b1-prezantim-stadt-land_msg-06',
    },
    {
      id: 'msg-07',
      speakerId: 'markus',
      german: 'Meiner Meinung nach ist die Stadt besser für junge Leute, die studieren oder Karriere machen wollen. Für Familien finde ich das Landleben aber viel schöner und gesünder. Ich selbst möchte später, wenn ich Kinder habe, vielleicht auch wieder aufs Land ziehen. Das war meine Präsentation. Vielen Dank fürs Zuhören!',
      albanian: 'Për mendimin tim, qyteti është më i mirë për të rinjtë që studiojnë ose duan të bëjnë karrierë. Por për familjet, jetën në fshat e shoh shumë më të bukur dhe më të shëndetshme. Unë vetë, më vonë kur të kem fëmijë, mbase dua të shpërngulem prapë në fshat. Ky ishte prezantimi im. Faleminderit që më dëgjuat!',
      delayMs: 8000,
      soundId: 'b1-prezantim-stadt-land_msg-07',
    },
    {
      id: 'msg-08',
      speakerId: 'anna',
      german: 'Vielen Dank für deine interessante Präsentation, Markus. Ich habe noch eine kurze Frage: Du hast gesagt, dass man auf dem Land fast immer ein Auto braucht. Denkst du, dass die öffentlichen Verkehrsmittel dort verbessert werden sollten?',
      albanian: 'Faleminderit shumë për prezantimin tënd interesant, Markus. Kam edhe një pyetje të shkurtër: Ti the se në fshat pothuajse gjithmonë nevojitet një makinë. A mendon se transporti publik atje duhet të përmirësohet?',
      delayMs: 6000,
      soundId: 'b1-prezantim-stadt-land_msg-08',
    },
    {
      id: 'msg-09',
      speakerId: 'markus',
      german: 'Ja, absolut! Das ist ein großes Problem. Zum Beispiel fährt in meinem Heimatdorf der Bus oft nur zweimal am Tag. Wenn man keinen Führerschein hat, ist man dort sehr isoliert. Wenn es mehr Busse oder Züge gäbe, würden vielleicht auch mehr Leute auf dem Land bleiben.',
      albanian: 'Po, absolutisht! Ky është një problem i madh. Për shembull, në fshatin tim të lindjes autobusi shpesh kalon vetëm dy herë në ditë. Nëse nuk ke patentë, atje je shumë i izoluar. Nëse do të kishte më shumë autobusë ose trena, ndoshta më shumë njerëz do të qëndronin në fshat.',
      delayMs: 6000,
      soundId: 'b1-prezantim-stadt-land_msg-09',
    },
    {
      id: 'msg-10',
      speakerId: 'anna',
      german: 'Das ist wirklich ein sehr guter Punkt. Vielen Dank für deine Antwort, Markus!',
      albanian: 'Kjo është vërtet një pikë shumë e mirë. Faleminderit shumë për përgjigjen tënde, Markus!',
      delayMs: 4000,
      soundId: 'b1-prezantim-stadt-land_msg-10',
    },
  ],
};

export const conversations: Conversation[] = [
  B1_CAFE_CONVERSATION,
  B1_PICKNICK_CONVERSATION,
  B1_PREZANTIM_STADT_LAND,
];

export function getConversationById(id: string): Conversation | undefined {
  return conversations.find(c => c.id === id);
}
