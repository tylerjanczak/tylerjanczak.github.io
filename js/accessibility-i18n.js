/*
  © 2026 Tyler Janczak. All rights reserved.
*/
(function () {
  "use strict";
  const LANGUAGES = [
    { code: "en", native: "English (USA)", badge: "US" },
    { code: "en-GB", native: "English (United Kingdom)", badge: "GB" },
    { code: "es-MX", native: "Español (Mexico)", badge: "MX" },
    { code: "es", native: "Español (Spanish)", badge: "ES" },
    { code: "fo", native: "Føroyskt (Faroese)", badge: "FO" },
    { code: "fr-CA", native: "Français (Canadian French)", badge: "CAN" },
    { code: "fr", native: "Français (French)", badge: "FR" },
    { code: "sm", native: "Gagana fa'a Sāmoa (Samoan)", badge: "SM" },
    { code: "hmn", native: "Hmong (Hmong)", badge: "HMN" },
    { code: "ht", native: "Kreyòl Ayisyen (Haitian Creole)", badge: "HT" },
    { code: "haw", native: "ʻŌlelo Hawaiʻi (Hawaiian)", badge: "HA" },
    { code: "ilo", native: "Ilocano (Filipino)", badge: "ILO" },
    { code: "it", native: "Italiano (Italian)", badge: "IT" },
    { code: "lv", native: "Latviešu (Latvian)", badge: "LV" },
    { code: "lt", native: "Lietuvių (Lithuanian)", badge: "LT" },
    { code: "hu", native: "Magyar (Hungarian)", badge: "HU" },
    { code: "nl", native: "Nederlands (Dutch)", badge: "NL" },
    { code: "no", native: "Norsk (Norwegian)", badge: "NO" },
    { code: "pl", native: "Polski (Polish)", badge: "PL" },
    { code: "pt-BR", native: "Português (Brazil)", badge: "BR" },
    { code: "pt-PT", native: "Português (Portugal)", badge: "PT" },
    { code: "ro", native: "Română (Romanian)", badge: "RO" },
    { code: "sr-Latn", native: "Serbian (Latin)", badge: "SR" },
    { code: "sl", native: "Slovenščina (Slovenian)", badge: "SI" },
    { code: "sk", native: "Slovenský (Slovak)", badge: "SK" },
    { code: "sv", native: "Svenska (Swedish)", badge: "SV" },
    { code: "tl", native: "Tagalog (Filipino)", badge: "TL" },
    { code: "tr", native: "Türkçe (Turkish)", badge: "TR" },
    { code: "vi", native: "Việt Nam (Vietnamese)", badge: "VI" },
    { code: "el", native: "Ελληνικά (Greek)", badge: "EL" },
    { code: "bg", native: "Български (Bulgarian)", badge: "BG" },
    { code: "ru", native: "Русский (Russian)", badge: "RU" },
    { code: "sr-Cyrl", native: "Српски (Serbian)", badge: "SR" },
    { code: "uk", native: "Українська (Ukrainian)", badge: "UK" },
    { code: "ka", native: "ქართული (Georgian)", badge: "KA" },
    { code: "hy", native: "Հայոց լեզու (Armenian)", badge: "HY" },
    { code: "he", native: "עברית (Hebrew)", badge: "HE" },
    { code: "ps", native: "پښتو (Pashto)", badge: "PS" },
    { code: "prs", native: "دری (Dari)", badge: "PRS" },
    { code: "ar", native: "العربية (Arabic)", badge: "AR" },
    { code: "fa", native: "فارسی (Persian)", badge: "FA" },
    { code: "hi", native: "हिंदी (Hindi)", badge: "HI" },
    { code: "bn", native: "বাঙালি (Bengali)", badge: "BN" },
    { code: "pa", native: "ਪੰਜਾਬੀ (Punjabi)", badge: "PA" },
    { code: "ta", native: "தமிழ் (Tamil)", badge: "TA" },
    { code: "th", native: "ภาษาไทย (Thai)", badge: "TH" },
    { code: "ko", native: "한국어 (Korean)", badge: "KO" },
    { code: "ja", native: "日本語 (Japanese)", badge: "JA" },
    { code: "zh-TW", native: "漢語 (Chinese Traditional)", badge: "TW" }
  ];

  // Keys, for reference:
  // panelTitle, panelSub, profilePlaceholder, profileLowVision, profileColorBlind,
  // profileDyslexia, profileCognitive, profileSeizure, profileAdhd, tileBiggerText,
  // tileContrast, tileTextSpacing, tileLineHeight, tileHighlightLinks, tileTextAlign,
  // tileDyslexiaFriendly, resetBtn, languagePlaceholder, insightSuffix
  const STRINGS = {
    en: {
      panelTitle: "Accessibility",
      panelSub: "Adjust how this site displays for you. Settings apply across every page.",
      profilePlaceholder: "Accessibility Profiles",
      profileLowVision: "Low Vision", profileColorBlind: "Color Blind", profileDyslexia: "Dyslexia",
      profileCognitive: "Cognitive & Learning", profileSeizure: "Seizure & Epileptic", profileAdhd: "ADHD",
      tileBiggerText: "Bigger Text", tileContrast: "Contrast+", tileTextSpacing: "Text Spacing",
      tileLineHeight: "Line Height", tileHighlightLinks: "Highlight Links", tileTextAlign: "Text Align",
      tileDyslexiaFriendly: "Dyslexia Friendly", resetBtn: "Reset to Default",
      languagePlaceholder: "Choose a Language", insightSuffix: "accessibility fixes applied automatically on this page"
    },
    "en-GB": {
      panelTitle: "Accessibility", panelSub: "Adjust how this site displays for you. Settings apply across every page.",
      profilePlaceholder: "Accessibility Profiles", profileLowVision: "Low Vision", profileColorBlind: "Colour Blind",
      profileDyslexia: "Dyslexia", profileCognitive: "Cognitive & Learning", profileSeizure: "Seizure & Epileptic",
      profileAdhd: "ADHD", tileBiggerText: "Bigger Text", tileContrast: "Contrast+", tileTextSpacing: "Text Spacing",
      tileLineHeight: "Line Height", tileHighlightLinks: "Highlight Links", tileTextAlign: "Text Align",
      tileDyslexiaFriendly: "Dyslexia Friendly", resetBtn: "Reset to Default", languagePlaceholder: "Choose a Language",
      insightSuffix: "accessibility fixes applied automatically on this page"
    },
    "es-MX": {
      panelTitle: "Accesibilidad", panelSub: "Ajusta cómo se muestra este sitio para ti. Los ajustes se aplican en todas las páginas.",
      profilePlaceholder: "Perfiles de accesibilidad", profileLowVision: "Baja visión", profileColorBlind: "Daltonismo",
      profileDyslexia: "Dislexia", profileCognitive: "Cognitivo y aprendizaje", profileSeizure: "Epilepsia y convulsiones",
      profileAdhd: "TDAH", tileBiggerText: "Texto más grande", tileContrast: "Contraste+", tileTextSpacing: "Espaciado de texto",
      tileLineHeight: "Interlineado", tileHighlightLinks: "Resaltar enlaces", tileTextAlign: "Alinear texto",
      tileDyslexiaFriendly: "Apto para dislexia", resetBtn: "Restablecer valores", languagePlaceholder: "Elegir idioma",
      insightSuffix: "correcciones de accesibilidad aplicadas automáticamente en esta página"
    },
    es: {
      panelTitle: "Accesibilidad", panelSub: "Ajusta cómo se muestra este sitio para ti. Los ajustes se aplican en todas las páginas.",
      profilePlaceholder: "Perfiles de accesibilidad", profileLowVision: "Baja visión", profileColorBlind: "Daltonismo",
      profileDyslexia: "Dislexia", profileCognitive: "Cognitivo y aprendizaje", profileSeizure: "Epilepsia y convulsiones",
      profileAdhd: "TDAH", tileBiggerText: "Texto más grande", tileContrast: "Contraste+", tileTextSpacing: "Espaciado de texto",
      tileLineHeight: "Interlineado", tileHighlightLinks: "Resaltar enlaces", tileTextAlign: "Alinear texto",
      tileDyslexiaFriendly: "Apto para dislexia", resetBtn: "Restablecer valores", languagePlaceholder: "Elegir idioma",
      insightSuffix: "correcciones de accesibilidad aplicadas automáticamente en esta página"
    },
    fo: {
      panelTitle: "Atgongd", panelSub: "Broyt, hvussu hendan síðan sæst hjá tær. Innstillingar galda á øllum síðum.",
      profilePlaceholder: "Atgongdarprofilar", profileLowVision: "Lítil sjón", profileColorBlind: "Litblindni",
      profileDyslexia: "Dysleksi", profileCognitive: "Kognitiv og læra", profileSeizure: "Kastasjúka",
      profileAdhd: "ADHD", tileBiggerText: "Størri tekstur", tileContrast: "Kontrastur+", tileTextSpacing: "Tekstbil",
      tileLineHeight: "Linjuhædd", tileHighlightLinks: "Frammarka leinkjur", tileTextAlign: "Tekstjavning",
      tileDyslexiaFriendly: "Dysleksivinaligur", resetBtn: "Endurstilla", languagePlaceholder: "Vel mál",
      insightSuffix: "atgongdarrættingar sjálvvirkandi settar inn á hesa síðu"
    },
    "fr-CA": {
      panelTitle: "Accessibilité", panelSub: "Ajustez l'affichage de ce site pour vous. Les réglages s'appliquent à toutes les pages.",
      profilePlaceholder: "Profils d'accessibilité", profileLowVision: "Basse vision", profileColorBlind: "Daltonisme",
      profileDyslexia: "Dyslexie", profileCognitive: "Cognitif et apprentissage", profileSeizure: "Épilepsie et convulsions",
      profileAdhd: "TDAH", tileBiggerText: "Texte plus grand", tileContrast: "Contraste+", tileTextSpacing: "Espacement du texte",
      tileLineHeight: "Interligne", tileHighlightLinks: "Surligner les liens", tileTextAlign: "Alignement du texte",
      tileDyslexiaFriendly: "Convivial pour la dyslexie", resetBtn: "Réinitialiser", languagePlaceholder: "Choisir une langue",
      insightSuffix: "corrections d'accessibilité appliquées automatiquement sur cette page"
    },
    fr: {
      panelTitle: "Accessibilité", panelSub: "Ajustez l'affichage de ce site pour vous. Les réglages s'appliquent à toutes les pages.",
      profilePlaceholder: "Profils d'accessibilité", profileLowVision: "Basse vision", profileColorBlind: "Daltonisme",
      profileDyslexia: "Dyslexie", profileCognitive: "Cognitif et apprentissage", profileSeizure: "Épilepsie et convulsions",
      profileAdhd: "TDAH", tileBiggerText: "Texte plus grand", tileContrast: "Contraste+", tileTextSpacing: "Espacement du texte",
      tileLineHeight: "Interligne", tileHighlightLinks: "Surligner les liens", tileTextAlign: "Alignement du texte",
      tileDyslexiaFriendly: "Convivial pour la dyslexie", resetBtn: "Réinitialiser", languagePlaceholder: "Choisir une langue",
      insightSuffix: "corrections d'accessibilité appliquées automatiquement sur cette page"
    },
    sm: {
      panelTitle: "Avanoa Faigofie", panelSub: "Suia le auala e fa'aalia ai lenei saite mo oe. E fa'aoga tulafono i itulau uma.",
      profilePlaceholder: "Ata o le Avanoa Faigofie", profileLowVision: "Va'ai Vaivai", profileColorBlind: "Le Iloa Lanu",
      profileDyslexia: "Dyslexia", profileCognitive: "Iloiloga ma A'oa'oga", profileSeizure: "Ma'i Fa'ate'ia",
      profileAdhd: "ADHD", tileBiggerText: "Tusitusiga Tele", tileContrast: "Fa'afeagai+", tileTextSpacing: "Va o Tusitusiga",
      tileLineHeight: "Maualuga o Laina", tileHighlightLinks: "Fa'amalamalama Soutaga", tileTextAlign: "Fa'atonu Tusitusiga",
      tileDyslexiaFriendly: "Lelei mo Dyslexia", resetBtn: "Toe Fa'afo'i", languagePlaceholder: "Filifili se Gagana",
      insightSuffix: "fa'aleleiga avanoa faigofie na fa'aogaina otometi i lenei itulau"
    },
    hmn: {
      panelTitle: "Kev Nkag Siab", panelSub: "Hloov seb qhov chaw no tshwm sim li cas rau koj. Kev teeb tsa siv rau txhua nplooj ntawv.",
      profilePlaceholder: "Cov Kev Nkag Siab", profileLowVision: "Pom Tsis Meej", profileColorBlind: "Dig Muag Xim",
      profileDyslexia: "Dyslexia", profileCognitive: "Kev Xav thiab Kawm", profileSeizure: "Mob Qaug Dab Peg",
      profileAdhd: "ADHD", tileBiggerText: "Ntawv Loj Dua", tileContrast: "Sib Piv+", tileTextSpacing: "Ntawv Sib Nrug",
      tileLineHeight: "Kab Siab", tileHighlightLinks: "Teeb Ci Txuas", tileTextAlign: "Kev Npaj Ntawv",
      tileDyslexiaFriendly: "Zoo Rau Dyslexia", resetBtn: "Rov Qab Rau Qub", languagePlaceholder: "Xaiv Hom Lus",
      insightSuffix: "kev kho kev nkag siab tau siv tas li rau nplooj ntawv no"
    },
    ht: {
      panelTitle: "Aksesibilite", panelSub: "Chanje jan sit sa a parèt pou ou. Paramèt yo aplike sou tout paj.",
      profilePlaceholder: "Pwofil Aksesibilite", profileLowVision: "Vizyon Fèb", profileColorBlind: "Avèg Koulè",
      profileDyslexia: "Disleksi", profileCognitive: "Kognitif ak Aprantisaj", profileSeizure: "Kriz Epilepsi",
      profileAdhd: "TDAH", tileBiggerText: "Tèks Pi Gwo", tileContrast: "Kontras+", tileTextSpacing: "Espas Tèks",
      tileLineHeight: "Wotè Liy", tileHighlightLinks: "Souliye Lyen", tileTextAlign: "Aliyman Tèks",
      tileDyslexiaFriendly: "Bon pou Disleksi", resetBtn: "Retabli", languagePlaceholder: "Chwazi yon Lang",
      insightSuffix: "koreksyon aksesibilite aplike otomatikman sou paj sa a"
    },
    haw: {
      panelTitle: "Hiki ke Komo", panelSub: "Hoʻoponopono i ke ʻano o kēia pūnaewele nou. Pili nā hoʻonohonoho i nā ʻaoʻao a pau.",
      profilePlaceholder: "Nā ʻano Hiki ke Komo", profileLowVision: "Nānā Nāwaliwali", profileColorBlind: "Kuli Waihoʻoluʻu",
      profileDyslexia: "Dyslexia", profileCognitive: "Noʻonoʻo a Aʻo", profileSeizure: "Maʻi Hōkeʻo",
      profileAdhd: "ADHD", tileBiggerText: "Kikokikona Nui", tileContrast: "Kūʻē+", tileTextSpacing: "Māwae Kikokikona",
      tileLineHeight: "Kiʻekiʻe Laina", tileHighlightLinks: "Hoʻomālamalama Loulou", tileTextAlign: "Hoʻonohonoho Kikokikona",
      tileDyslexiaFriendly: "Kūpono no Dyslexia", resetBtn: "Hoʻihoʻi", languagePlaceholder: "Koho ʻŌlelo",
      insightSuffix: "nā hoʻoponopono hiki ke komo i hoʻopili ʻia ma kēia ʻaoʻao"
    },
    ilo: {
      panelTitle: "Kanaigidan", panelSub: "Baliwan no kasano nga makita daytoy a site para kenka. Ma-apply dagiti setting iti amin a panid.",
      profilePlaceholder: "Profile ti Kanaigidan", profileLowVision: "Nakapuy a Panagkita", profileColorBlind: "Bulsek iti Kolor",
      profileDyslexia: "Dyslexia", profileCognitive: "Kognitibo ken Panagadal", profileSeizure: "Seizure ken Epilepsy",
      profileAdhd: "ADHD", tileBiggerText: "Dakdakkel a Teksto", tileContrast: "Kontrast+", tileTextSpacing: "Espasio ti Teksto",
      tileLineHeight: "Kangato ti Linia", tileHighlightLinks: "I-highlight dagiti Link", tileTextAlign: "Panag-align ti Teksto",
      tileDyslexiaFriendly: "Mainugot iti Dyslexia", resetBtn: "I-reset", languagePlaceholder: "Mangpili iti Pagsasao",
      insightSuffix: "a panangrimedyo iti kanaigidan a naaplikar iti automatiko iti daytoy a panid"
    },
    it: {
      panelTitle: "Accessibilità", panelSub: "Regola come appare questo sito per te. Le impostazioni si applicano a tutte le pagine.",
      profilePlaceholder: "Profili di accessibilità", profileLowVision: "Bassa visione", profileColorBlind: "Daltonismo",
      profileDyslexia: "Dislessia", profileCognitive: "Cognitivo e apprendimento", profileSeizure: "Epilessia e convulsioni",
      profileAdhd: "ADHD", tileBiggerText: "Testo più grande", tileContrast: "Contrasto+", tileTextSpacing: "Spaziatura testo",
      tileLineHeight: "Interlinea", tileHighlightLinks: "Evidenzia link", tileTextAlign: "Allineamento testo",
      tileDyslexiaFriendly: "Adatto alla dislessia", resetBtn: "Ripristina", languagePlaceholder: "Scegli una lingua",
      insightSuffix: "correzioni di accessibilità applicate automaticamente su questa pagina"
    },
    lv: {
      panelTitle: "Pieejamība", panelSub: "Pielāgojiet, kā šī vietne izskatās jums. Iestatījumi attiecas uz visām lapām.",
      profilePlaceholder: "Pieejamības profili", profileLowVision: "Vāja redze", profileColorBlind: "Krāsu aklums",
      profileDyslexia: "Disleksija", profileCognitive: "Kognitīvie un mācīšanās traucējumi", profileSeizure: "Epilepsija un krampji",
      profileAdhd: "ADHD", tileBiggerText: "Lielāks teksts", tileContrast: "Kontrasts+", tileTextSpacing: "Teksta atstarpes",
      tileLineHeight: "Rindstarpa", tileHighlightLinks: "Izcelt saites", tileTextAlign: "Teksta līdzinājums",
      tileDyslexiaFriendly: "Piemērots disleksijai", resetBtn: "Atiestatīt", languagePlaceholder: "Izvēlēties valodu",
      insightSuffix: "pieejamības labojumi automātiski piemēroti šajā lapā"
    },
    lt: {
      panelTitle: "Prieinamumas", panelSub: "Pakoreguokite, kaip ši svetainė rodoma jums. Nustatymai galioja visuose puslapiuose.",
      profilePlaceholder: "Prieinamumo profiliai", profileLowVision: "Silpnas regėjimas", profileColorBlind: "Spalvų aklumas",
      profileDyslexia: "Disleksija", profileCognitive: "Pažinimo ir mokymosi", profileSeizure: "Epilepsija ir traukuliai",
      profileAdhd: "ADHD", tileBiggerText: "Didesnis tekstas", tileContrast: "Kontrastas+", tileTextSpacing: "Teksto tarpai",
      tileLineHeight: "Eilučių aukštis", tileHighlightLinks: "Paryškinti nuorodas", tileTextAlign: "Teksto lygiavimas",
      tileDyslexiaFriendly: "Tinka sergantiems disleksija", resetBtn: "Atstatyti", languagePlaceholder: "Pasirinkti kalbą",
      insightSuffix: "prieinamumo pataisymai automatiškai pritaikyti šiame puslapyje"
    },
    hu: {
      panelTitle: "Akadálymentesítés", panelSub: "Állítsd be, hogyan jelenjen meg neked ez az oldal. A beállítások minden oldalon érvényesek.",
      profilePlaceholder: "Akadálymentességi profilok", profileLowVision: "Gyengénlátás", profileColorBlind: "Színvakság",
      profileDyslexia: "Diszlexia", profileCognitive: "Kognitív és tanulási", profileSeizure: "Epilepszia és rohamok",
      profileAdhd: "ADHD", tileBiggerText: "Nagyobb szöveg", tileContrast: "Kontraszt+", tileTextSpacing: "Szövegköz",
      tileLineHeight: "Sormagasság", tileHighlightLinks: "Linkek kiemelése", tileTextAlign: "Szöveg igazítása",
      tileDyslexiaFriendly: "Diszlexiabarát", resetBtn: "Visszaállítás", languagePlaceholder: "Nyelv kiválasztása",
      insightSuffix: "akadálymentesítési javítás lett automatikusan alkalmazva ezen az oldalon"
    },
    nl: {
      panelTitle: "Toegankelijkheid", panelSub: "Pas aan hoe deze site voor jou wordt weergegeven. Instellingen gelden op elke pagina.",
      profilePlaceholder: "Toegankelijkheidsprofielen", profileLowVision: "Slechtziendheid", profileColorBlind: "Kleurenblindheid",
      profileDyslexia: "Dyslexie", profileCognitive: "Cognitief en leren", profileSeizure: "Epilepsie en toevallen",
      profileAdhd: "ADHD", tileBiggerText: "Grotere tekst", tileContrast: "Contrast+", tileTextSpacing: "Tekstafstand",
      tileLineHeight: "Regelhoogte", tileHighlightLinks: "Links markeren", tileTextAlign: "Tekstuitlijning",
      tileDyslexiaFriendly: "Dyslexievriendelijk", resetBtn: "Standaard herstellen", languagePlaceholder: "Kies een taal",
      insightSuffix: "toegankelijkheidscorrecties automatisch toegepast op deze pagina"
    },
    no: {
      panelTitle: "Tilgjengelighet", panelSub: "Juster hvordan dette nettstedet vises for deg. Innstillinger gjelder på alle sider.",
      profilePlaceholder: "Tilgjengelighetsprofiler", profileLowVision: "Svaksynthet", profileColorBlind: "Fargeblindhet",
      profileDyslexia: "Dysleksi", profileCognitive: "Kognitivt og læring", profileSeizure: "Epilepsi og anfall",
      profileAdhd: "ADHD", tileBiggerText: "Større tekst", tileContrast: "Kontrast+", tileTextSpacing: "Tekstavstand",
      tileLineHeight: "Linjehøyde", tileHighlightLinks: "Fremhev lenker", tileTextAlign: "Tekstjustering",
      tileDyslexiaFriendly: "Dysleksivennlig", resetBtn: "Tilbakestill", languagePlaceholder: "Velg språk",
      insightSuffix: "tilgjengelighetsrettinger automatisk brukt på denne siden"
    },
    pl: {
      panelTitle: "Dostępność", panelSub: "Dostosuj sposób wyświetlania tej strony dla siebie. Ustawienia obowiązują na wszystkich stronach.",
      profilePlaceholder: "Profile dostępności", profileLowVision: "Słabowzroczność", profileColorBlind: "Daltonizm",
      profileDyslexia: "Dysleksja", profileCognitive: "Poznawcze i uczenie się", profileSeizure: "Padaczka i napady",
      profileAdhd: "ADHD", tileBiggerText: "Większy tekst", tileContrast: "Kontrast+", tileTextSpacing: "Odstępy tekstu",
      tileLineHeight: "Wysokość linii", tileHighlightLinks: "Podświetl linki", tileTextAlign: "Wyrównanie tekstu",
      tileDyslexiaFriendly: "Przyjazny dla dysleksji", resetBtn: "Przywróć domyślne", languagePlaceholder: "Wybierz język",
      insightSuffix: "poprawek dostępności zastosowanych automatycznie na tej stronie"
    },
    "pt-BR": {
      panelTitle: "Acessibilidade", panelSub: "Ajuste como este site aparece para você. As configurações se aplicam a todas as páginas.",
      profilePlaceholder: "Perfis de acessibilidade", profileLowVision: "Baixa visão", profileColorBlind: "Daltonismo",
      profileDyslexia: "Dislexia", profileCognitive: "Cognitivo e aprendizado", profileSeizure: "Epilepsia e convulsões",
      profileAdhd: "TDAH", tileBiggerText: "Texto maior", tileContrast: "Contraste+", tileTextSpacing: "Espaçamento de texto",
      tileLineHeight: "Altura de linha", tileHighlightLinks: "Destacar links", tileTextAlign: "Alinhamento de texto",
      tileDyslexiaFriendly: "Amigável para dislexia", resetBtn: "Restaurar padrão", languagePlaceholder: "Escolher idioma",
      insightSuffix: "correções de acessibilidade aplicadas automaticamente nesta página"
    },
    "pt-PT": {
      panelTitle: "Acessibilidade", panelSub: "Ajuste a forma como este site é apresentado para si. As definições aplicam-se a todas as páginas.",
      profilePlaceholder: "Perfis de acessibilidade", profileLowVision: "Baixa visão", profileColorBlind: "Daltonismo",
      profileDyslexia: "Dislexia", profileCognitive: "Cognitivo e aprendizagem", profileSeizure: "Epilepsia e convulsões",
      profileAdhd: "PHDA", tileBiggerText: "Texto maior", tileContrast: "Contraste+", tileTextSpacing: "Espaçamento de texto",
      tileLineHeight: "Altura de linha", tileHighlightLinks: "Destacar ligações", tileTextAlign: "Alinhamento de texto",
      tileDyslexiaFriendly: "Adequado para dislexia", resetBtn: "Repor predefinições", languagePlaceholder: "Escolher idioma",
      insightSuffix: "correções de acessibilidade aplicadas automaticamente nesta página"
    },
    ro: {
      panelTitle: "Accesibilitate", panelSub: "Ajustează modul în care acest site apare pentru tine. Setările se aplică pe toate paginile.",
      profilePlaceholder: "Profiluri de accesibilitate", profileLowVision: "Vedere slabă", profileColorBlind: "Daltonism",
      profileDyslexia: "Dislexie", profileCognitive: "Cognitiv și învățare", profileSeizure: "Epilepsie și convulsii",
      profileAdhd: "ADHD", tileBiggerText: "Text mai mare", tileContrast: "Contrast+", tileTextSpacing: "Spațiere text",
      tileLineHeight: "Înălțime rând", tileHighlightLinks: "Evidențiază linkurile", tileTextAlign: "Aliniere text",
      tileDyslexiaFriendly: "Prietenos cu dislexia", resetBtn: "Resetare", languagePlaceholder: "Alege limba",
      insightSuffix: "corecții de accesibilitate aplicate automat pe această pagină"
    },
    "sr-Latn": {
      panelTitle: "Pristupačnost", panelSub: "Prilagodite kako ovaj sajt izgleda za vas. Podešavanja važe na svim stranicama.",
      profilePlaceholder: "Profili pristupačnosti", profileLowVision: "Slab vid", profileColorBlind: "Daltonizam",
      profileDyslexia: "Disleksija", profileCognitive: "Kognitivno i učenje", profileSeizure: "Epilepsija i napadi",
      profileAdhd: "ADHD", tileBiggerText: "Veći tekst", tileContrast: "Kontrast+", tileTextSpacing: "Razmak teksta",
      tileLineHeight: "Visina linije", tileHighlightLinks: "Istakni linkove", tileTextAlign: "Poravnanje teksta",
      tileDyslexiaFriendly: "Prilagođeno disleksiji", resetBtn: "Vrati na podrazumevano", languagePlaceholder: "Izaberi jezik",
      insightSuffix: "ispravki pristupačnosti automatski primenjeno na ovoj stranici"
    },
    sl: {
      panelTitle: "Dostopnost", panelSub: "Prilagodite, kako je to spletno mesto prikazano za vas. Nastavitve veljajo na vseh straneh.",
      profilePlaceholder: "Profili dostopnosti", profileLowVision: "Slabovidnost", profileColorBlind: "Barvna slepota",
      profileDyslexia: "Disleksija", profileCognitive: "Kognitivno in učenje", profileSeizure: "Epilepsija in napadi",
      profileAdhd: "ADHD", tileBiggerText: "Večje besedilo", tileContrast: "Kontrast+", tileTextSpacing: "Razmik besedila",
      tileLineHeight: "Višina vrstice", tileHighlightLinks: "Poudari povezave", tileTextAlign: "Poravnava besedila",
      tileDyslexiaFriendly: "Prijazno za disleksijo", resetBtn: "Ponastavi", languagePlaceholder: "Izberi jezik",
      insightSuffix: "popravkov dostopnosti samodejno uporabljenih na tej strani"
    },
    sk: {
      panelTitle: "Prístupnosť", panelSub: "Upravte, ako sa vám táto stránka zobrazuje. Nastavenia platia na všetkých stránkach.",
      profilePlaceholder: "Profily prístupnosti", profileLowVision: "Slabozrakosť", profileColorBlind: "Farbosleposť",
      profileDyslexia: "Dyslexia", profileCognitive: "Kognitívne a učenie", profileSeizure: "Epilepsia a záchvaty",
      profileAdhd: "ADHD", tileBiggerText: "Väčší text", tileContrast: "Kontrast+", tileTextSpacing: "Medzery textu",
      tileLineHeight: "Výška riadku", tileHighlightLinks: "Zvýrazniť odkazy", tileTextAlign: "Zarovnanie textu",
      tileDyslexiaFriendly: "Vhodné pre dyslexiu", resetBtn: "Obnoviť predvolené", languagePlaceholder: "Vybrať jazyk",
      insightSuffix: "opráv prístupnosti automaticky použitých na tejto stránke"
    },
    sv: {
      panelTitle: "Tillgänglighet", panelSub: "Justera hur denna webbplats visas för dig. Inställningarna gäller på alla sidor.",
      profilePlaceholder: "Tillgänglighetsprofiler", profileLowVision: "Synnedsättning", profileColorBlind: "Färgblindhet",
      profileDyslexia: "Dyslexi", profileCognitive: "Kognitivt och inlärning", profileSeizure: "Epilepsi och kramper",
      profileAdhd: "ADHD", tileBiggerText: "Större text", tileContrast: "Kontrast+", tileTextSpacing: "Textavstånd",
      tileLineHeight: "Radhöjd", tileHighlightLinks: "Markera länkar", tileTextAlign: "Textjustering",
      tileDyslexiaFriendly: "Dyslexivänligt", resetBtn: "Återställ", languagePlaceholder: "Välj språk",
      insightSuffix: "tillgänglighetsåtgärder automatiskt tillämpade på denna sida"
    },
    tl: {
      panelTitle: "Pagiging Naa-access", panelSub: "Baguhin kung paano lumalabas ang site na ito para sa iyo. Naaangkop ang mga setting sa bawat pahina.",
      profilePlaceholder: "Mga Profile sa Aksesibilidad", profileLowVision: "Mahinang Paningin", profileColorBlind: "Pagkabulag sa Kulay",
      profileDyslexia: "Dyslexia", profileCognitive: "Kognitibo at Pag-aaral", profileSeizure: "Epilepsy at Seizure",
      profileAdhd: "ADHD", tileBiggerText: "Mas Malaking Teksto", tileContrast: "Contrast+", tileTextSpacing: "Puwang ng Teksto",
      tileLineHeight: "Taas ng Linya", tileHighlightLinks: "I-highlight ang mga Link", tileTextAlign: "Pag-align ng Teksto",
      tileDyslexiaFriendly: "Angkop sa Dyslexia", resetBtn: "I-reset sa Default", languagePlaceholder: "Pumili ng Wika",
      insightSuffix: "pag-aayos sa aksesibilidad na awtomatikong na-apply sa pahinang ito"
    },
    tr: {
      panelTitle: "Erişilebilirlik", panelSub: "Bu sitenin sizin için nasıl görüneceğini ayarlayın. Ayarlar her sayfada geçerlidir.",
      profilePlaceholder: "Erişilebilirlik Profilleri", profileLowVision: "Az Görme", profileColorBlind: "Renk Körlüğü",
      profileDyslexia: "Disleksi", profileCognitive: "Bilişsel ve Öğrenme", profileSeizure: "Epilepsi ve Nöbet",
      profileAdhd: "DEHB", tileBiggerText: "Daha Büyük Metin", tileContrast: "Kontrast+", tileTextSpacing: "Metin Aralığı",
      tileLineHeight: "Satır Yüksekliği", tileHighlightLinks: "Bağlantıları Vurgula", tileTextAlign: "Metin Hizalama",
      tileDyslexiaFriendly: "Disleksi Dostu", resetBtn: "Varsayılana Sıfırla", languagePlaceholder: "Dil Seçin",
      insightSuffix: "erişilebilirlik düzeltmesi bu sayfada otomatik olarak uygulandı"
    },
    vi: {
      panelTitle: "Khả năng Truy cập", panelSub: "Điều chỉnh cách trang web này hiển thị cho bạn. Cài đặt áp dụng trên mọi trang.",
      profilePlaceholder: "Hồ sơ Khả năng Truy cập", profileLowVision: "Thị lực Kém", profileColorBlind: "Mù màu",
      profileDyslexia: "Chứng khó đọc", profileCognitive: "Nhận thức và Học tập", profileSeizure: "Động kinh và Co giật",
      profileAdhd: "ADHD", tileBiggerText: "Chữ Lớn hơn", tileContrast: "Độ tương phản+", tileTextSpacing: "Giãn cách Văn bản",
      tileLineHeight: "Chiều cao Dòng", tileHighlightLinks: "Làm nổi bật Liên kết", tileTextAlign: "Căn chỉnh Văn bản",
      tileDyslexiaFriendly: "Thân thiện với Chứng khó đọc", resetBtn: "Đặt lại Mặc định", languagePlaceholder: "Chọn Ngôn ngữ",
      insightSuffix: "sửa lỗi khả năng truy cập được áp dụng tự động trên trang này"
    },
    el: {
      panelTitle: "Προσβασιμότητα", panelSub: "Προσαρμόστε πώς εμφανίζεται αυτός ο ιστότοπος για εσάς. Οι ρυθμίσεις ισχύουν σε κάθε σελίδα.",
      profilePlaceholder: "Προφίλ Προσβασιμότητας", profileLowVision: "Χαμηλή Όραση", profileColorBlind: "Αχρωματοψία",
      profileDyslexia: "Δυσλεξία", profileCognitive: "Γνωστικά και Μάθηση", profileSeizure: "Επιληψία και Κρίσεις",
      profileAdhd: "ADHD", tileBiggerText: "Μεγαλύτερο Κείμενο", tileContrast: "Αντίθεση+", tileTextSpacing: "Απόσταση Κειμένου",
      tileLineHeight: "Ύψος Γραμμής", tileHighlightLinks: "Επισήμανση Συνδέσμων", tileTextAlign: "Στοίχιση Κειμένου",
      tileDyslexiaFriendly: "Φιλικό για Δυσλεξία", resetBtn: "Επαναφορά", languagePlaceholder: "Επιλέξτε Γλώσσα",
      insightSuffix: "διορθώσεις προσβασιμότητας εφαρμόστηκαν αυτόματα σε αυτή τη σελίδα"
    },
    bg: {
      panelTitle: "Достъпност", panelSub: "Коригирайте как се показва този сайт за вас. Настройките важат за всички страници.",
      profilePlaceholder: "Профили за достъпност", profileLowVision: "Слабо зрение", profileColorBlind: "Далтонизъм",
      profileDyslexia: "Дислексия", profileCognitive: "Когнитивно и учене", profileSeizure: "Епилепсия и припадъци",
      profileAdhd: "ADHD", tileBiggerText: "По-голям текст", tileContrast: "Контраст+", tileTextSpacing: "Разредка на текста",
      tileLineHeight: "Височина на реда", tileHighlightLinks: "Маркирай връзките", tileTextAlign: "Подравняване на текста",
      tileDyslexiaFriendly: "Удобно за дислексия", resetBtn: "Възстанови по подразбиране", languagePlaceholder: "Изберете език",
      insightSuffix: "корекции за достъпност, приложени автоматично на тази страница"
    },
    ru: {
      panelTitle: "Доступность", panelSub: "Настройте отображение этого сайта для вас. Настройки применяются ко всем страницам.",
      profilePlaceholder: "Профили доступности", profileLowVision: "Слабое зрение", profileColorBlind: "Дальтонизм",
      profileDyslexia: "Дислексия", profileCognitive: "Когнитивные и обучение", profileSeizure: "Эпилепсия и приступы",
      profileAdhd: "СДВГ", tileBiggerText: "Крупнее текст", tileContrast: "Контраст+", tileTextSpacing: "Межбуквенный интервал",
      tileLineHeight: "Межстрочный интервал", tileHighlightLinks: "Выделить ссылки", tileTextAlign: "Выравнивание текста",
      tileDyslexiaFriendly: "Удобно при дислексии", resetBtn: "Сбросить по умолчанию", languagePlaceholder: "Выбрать язык",
      insightSuffix: "исправлений доступности автоматически применено на этой странице"
    },
    "sr-Cyrl": {
      panelTitle: "Приступачност", panelSub: "Прилагодите како овај сајт изгледа за вас. Подешавања важе на свим страницама.",
      profilePlaceholder: "Профили приступачности", profileLowVision: "Слаб вид", profileColorBlind: "Далтонизам",
      profileDyslexia: "Дислексија", profileCognitive: "Когнитивно и учење", profileSeizure: "Епилепсија и напади",
      profileAdhd: "ADHD", tileBiggerText: "Већи текст", tileContrast: "Контраст+", tileTextSpacing: "Размак текста",
      tileLineHeight: "Висина линије", tileHighlightLinks: "Истакни линкове", tileTextAlign: "Поравнање текста",
      tileDyslexiaFriendly: "Прилагођено дислексији", resetBtn: "Врати на подразумевано", languagePlaceholder: "Изабери језик",
      insightSuffix: "исправки приступачности аутоматски примењено на овој страници"
    },
    uk: {
      panelTitle: "Доступність", panelSub: "Налаштуйте, як цей сайт відображається для вас. Налаштування діють на всіх сторінках.",
      profilePlaceholder: "Профілі доступності", profileLowVision: "Слабкий зір", profileColorBlind: "Дальтонізм",
      profileDyslexia: "Дислексія", profileCognitive: "Когнітивне та навчання", profileSeizure: "Епілепсія та напади",
      profileAdhd: "СДУГ", tileBiggerText: "Більший текст", tileContrast: "Контраст+", tileTextSpacing: "Міжлітерний інтервал",
      tileLineHeight: "Міжрядковий інтервал", tileHighlightLinks: "Виділити посилання", tileTextAlign: "Вирівнювання тексту",
      tileDyslexiaFriendly: "Зручно при дислексії", resetBtn: "Скинути за замовчуванням", languagePlaceholder: "Обрати мову",
      insightSuffix: "виправлень доступності автоматично застосовано на цій сторінці"
    },
    ka: {
      panelTitle: "ხელმისაწვდომობა", panelSub: "მოარგეთ, როგორ გამოჩნდეს ეს საიტი თქვენთვის. პარამეტრები მოქმედებს ყველა გვერდზე.",
      profilePlaceholder: "ხელმისაწვდომობის პროფილები", profileLowVision: "სუსტი მხედველობა", profileColorBlind: "ფერსიბრმე",
      profileDyslexia: "დისლექსია", profileCognitive: "კოგნიტური და სწავლა", profileSeizure: "ეპილეფსია და გულყრები",
      profileAdhd: "ADHD", tileBiggerText: "დიდი ტექსტი", tileContrast: "კონტრასტი+", tileTextSpacing: "ტექსტის დაშორება",
      tileLineHeight: "ხაზის სიმაღლე", tileHighlightLinks: "ბმულების გამოკვეთა", tileTextAlign: "ტექსტის სწორება",
      tileDyslexiaFriendly: "მოსახერხებელი დისლექსიისთვის", resetBtn: "საწყისზე დაბრუნება", languagePlaceholder: "აირჩიეთ ენა",
      insightSuffix: "ხელმისაწვდომობის შესწორება ავტომატურად გამოყენებულია ამ გვერდზე"
    },
    hy: {
      panelTitle: "Մատչելիություն", panelSub: "Կարգավորեք, թե ինչպես է այս կայքը ցուցադրվում ձեզ համար։ Կարգավորումները գործում են բոլոր էջերում։",
      profilePlaceholder: "Մատչելիության պրոֆիլներ", profileLowVision: "Թույլ տեսողություն", profileColorBlind: "Գունային կուրություն",
      profileDyslexia: "Դիսլեքսիա", profileCognitive: "Ճանաչողական և ուսուցում", profileSeizure: "Էպիլեպսիա և նոպաներ",
      profileAdhd: "ADHD", tileBiggerText: "Ավելի մեծ տեքստ", tileContrast: "Կոնտրաստ+", tileTextSpacing: "Տեքստի բացատ",
      tileLineHeight: "Տողի բարձրություն", tileHighlightLinks: "Ընդգծել հղումները", tileTextAlign: "Տեքստի հավասարեցում",
      tileDyslexiaFriendly: "Հարմար դիսլեքսիայի համար", resetBtn: "Վերականգնել", languagePlaceholder: "Ընտրել լեզու",
      insightSuffix: "մատչելիության շտկումներ ավտոմատ կերպով կիրառված այս էջում"
    },
    he: {
      panelTitle: "נגישות", panelSub: "התאם את אופן הצגת האתר עבורך. ההגדרות חלות על כל עמוד.",
      profilePlaceholder: "פרופילי נגישות", profileLowVision: "ראייה לקויה", profileColorBlind: "עיוורון צבעים",
      profileDyslexia: "דיסלקציה", profileCognitive: "קוגניטיבי ולמידה", profileSeizure: "אפילפסיה והתקפים",
      profileAdhd: "ADHD", tileBiggerText: "טקסט גדול יותר", tileContrast: "ניגודיות+", tileTextSpacing: "ריווח טקסט",
      tileLineHeight: "גובה שורה", tileHighlightLinks: "הדגש קישורים", tileTextAlign: "יישור טקסט",
      tileDyslexiaFriendly: "ידידותי לדיסלקציה", resetBtn: "אפס לברירת מחדל", languagePlaceholder: "בחר שפה",
      insightSuffix: "תיקוני נגישות הוחלו אוטומטית בעמוד זה"
    },
    ps: {
      panelTitle: "لاسرسی وړتیا", panelSub: "دا سایټ ستاسو لپاره څنګه ښکاري بدل کړئ. تنظیمات په ټولو پاڼو کې کاروي.",
      profilePlaceholder: "د لاسرسي پروفایلونه", profileLowVision: "کمزوری لید", profileColorBlind: "رنګ ړوندوالی",
      profileDyslexia: "ډیسلیکسیا", profileCognitive: "پوهنیز او زده کړه", profileSeizure: "صرع او تشنج",
      profileAdhd: "ADHD", tileBiggerText: "لوی متن", tileContrast: "تضاد+", tileTextSpacing: "د متن تشه",
      tileLineHeight: "د کرښې لوړوالی", tileHighlightLinks: "لینکونه روښانه کړئ", tileTextAlign: "د متن سمون",
      tileDyslexiaFriendly: "د ډیسلیکسیا لپاره مناسب", resetBtn: "بیا تنظیم کړئ", languagePlaceholder: "ژبه غوره کړئ",
      insightSuffix: "د لاسرسي اصلاحات په دې پاڼه کې په اتوماتيک ډول پلي شوي"
    },
    prs: {
      panelTitle: "دسترسی‌پذیری", panelSub: "نحوه نمایش این سایت را برای خود تنظیم کنید. تنظیمات در همه صفحات اعمال می‌شود.",
      profilePlaceholder: "پروفایل‌های دسترسی‌پذیری", profileLowVision: "کم‌بینایی", profileColorBlind: "کوررنگی",
      profileDyslexia: "دیسلکسی", profileCognitive: "شناختی و یادگیری", profileSeizure: "صرع و تشنج",
      profileAdhd: "بیش‌فعالی", tileBiggerText: "متن بزرگ‌تر", tileContrast: "کنتراست+", tileTextSpacing: "فاصله متن",
      tileLineHeight: "ارتفاع خط", tileHighlightLinks: "برجسته‌سازی لینک‌ها", tileTextAlign: "تراز متن",
      tileDyslexiaFriendly: "مناسب برای دیسلکسی", resetBtn: "بازنشانی", languagePlaceholder: "انتخاب زبان",
      insightSuffix: "اصلاحات دسترسی‌پذیری به‌طور خودکار در این صفحه اعمال شد"
    },
    ar: {
      panelTitle: "إمكانية الوصول", panelSub: "اضبط كيفية ظهور هذا الموقع لك. تُطبَّق الإعدادات على كل صفحة.",
      profilePlaceholder: "ملفات إمكانية الوصول", profileLowVision: "ضعف البصر", profileColorBlind: "عمى الألوان",
      profileDyslexia: "عسر القراءة", profileCognitive: "الإدراك والتعلم", profileSeizure: "الصرع والنوبات",
      profileAdhd: "فرط الحركة ونقص الانتباه", tileBiggerText: "نص أكبر", tileContrast: "التباين+", tileTextSpacing: "تباعد النص",
      tileLineHeight: "ارتفاع السطر", tileHighlightLinks: "تمييز الروابط", tileTextAlign: "محاذاة النص",
      tileDyslexiaFriendly: "مناسب لعسر القراءة", resetBtn: "إعادة التعيين", languagePlaceholder: "اختر اللغة",
      insightSuffix: "تصحيحات إمكانية الوصول طُبِّقت تلقائيًا على هذه الصفحة"
    },
    fa: {
      panelTitle: "دسترسی‌پذیری", panelSub: "نحوه نمایش این سایت را برای خود تنظیم کنید. تنظیمات در همه صفحات اعمال می‌شود.",
      profilePlaceholder: "پروفایل‌های دسترسی‌پذیری", profileLowVision: "کم‌بینایی", profileColorBlind: "کوررنگی",
      profileDyslexia: "دیسلکسی", profileCognitive: "شناختی و یادگیری", profileSeizure: "صرع و تشنج",
      profileAdhd: "بیش‌فعالی", tileBiggerText: "متن بزرگ‌تر", tileContrast: "کنتراست+", tileTextSpacing: "فاصله متن",
      tileLineHeight: "ارتفاع خط", tileHighlightLinks: "برجسته‌سازی پیوندها", tileTextAlign: "تراز متن",
      tileDyslexiaFriendly: "مناسب برای دیسلکسی", resetBtn: "بازنشانی", languagePlaceholder: "انتخاب زبان",
      insightSuffix: "اصلاحات دسترسی‌پذیری به‌طور خودکار در این صفحه اعمال شد"
    },
    hi: {
      panelTitle: "पहुँच-योग्यता", panelSub: "यह साइट आपके लिए कैसे दिखे, इसे समायोजित करें। सेटिंग्स हर पृष्ठ पर लागू होती हैं।",
      profilePlaceholder: "पहुँच-योग्यता प्रोफाइल", profileLowVision: "कम दृष्टि", profileColorBlind: "रंग अंधता",
      profileDyslexia: "डिस्लेक्सिया", profileCognitive: "संज्ञानात्मक और सीखना", profileSeizure: "मिर्गी और दौरे",
      profileAdhd: "एडीएचडी", tileBiggerText: "बड़ा टेक्स्ट", tileContrast: "कंट्रास्ट+", tileTextSpacing: "टेक्स्ट स्पेसिंग",
      tileLineHeight: "लाइन की ऊँचाई", tileHighlightLinks: "लिंक हाइलाइट करें", tileTextAlign: "टेक्स्ट अलाइनमेंट",
      tileDyslexiaFriendly: "डिस्लेक्सिया के अनुकूल", resetBtn: "डिफ़ॉल्ट पर रीसेट करें", languagePlaceholder: "भाषा चुनें",
      insightSuffix: "पहुँच-योग्यता सुधार इस पृष्ठ पर स्वचालित रूप से लागू किए गए"
    },
    bn: {
      panelTitle: "প্রবেশযোগ্যতা", panelSub: "এই সাইটটি আপনার জন্য কীভাবে দেখাবে তা সামঞ্জস্য করুন। সেটিংস প্রতিটি পৃষ্ঠায় প্রযোজ্য।",
      profilePlaceholder: "প্রবেশযোগ্যতা প্রোফাইল", profileLowVision: "দুর্বল দৃষ্টি", profileColorBlind: "বর্ণান্ধতা",
      profileDyslexia: "ডিসলেক্সিয়া", profileCognitive: "জ্ঞানীয় ও শেখা", profileSeizure: "মৃগীরোগ ও খিঁচুনি",
      profileAdhd: "এডিএইচডি", tileBiggerText: "বড় লেখা", tileContrast: "কনট্রাস্ট+", tileTextSpacing: "টেক্সট স্পেসিং",
      tileLineHeight: "লাইনের উচ্চতা", tileHighlightLinks: "লিংক হাইলাইট করুন", tileTextAlign: "টেক্সট অ্যালাইনমেন্ট",
      tileDyslexiaFriendly: "ডিসলেক্সিয়া-বান্ধব", resetBtn: "ডিফল্টে পুনরায় সেট করুন", languagePlaceholder: "ভাষা নির্বাচন করুন",
      insightSuffix: "প্রবেশযোগ্যতা সংশোধন এই পৃষ্ঠায় স্বয়ংক্রিয়ভাবে প্রয়োগ করা হয়েছে"
    },
    pa: {
      panelTitle: "ਪਹੁੰਚਯੋਗਤਾ", panelSub: "ਇਹ ਸਾਈਟ ਤੁਹਾਡੇ ਲਈ ਕਿਵੇਂ ਦਿਖੇ ਇਸਨੂੰ ਅਨੁਕੂਲ ਕਰੋ। ਸੈਟਿੰਗਾਂ ਹਰ ਪੰਨੇ 'ਤੇ ਲਾਗੂ ਹੁੰਦੀਆਂ ਹਨ।",
      profilePlaceholder: "ਪਹੁੰਚਯੋਗਤਾ ਪ੍ਰੋਫਾਈਲ", profileLowVision: "ਘੱਟ ਨਜ਼ਰ", profileColorBlind: "ਰੰਗ ਅੰਨ੍ਹਾਪਣ",
      profileDyslexia: "ਡਿਸਲੈਕਸੀਆ", profileCognitive: "ਬੋਧਾਤਮਕ ਅਤੇ ਸਿੱਖਣਾ", profileSeizure: "ਮਿਰਗੀ ਅਤੇ ਦੌਰੇ",
      profileAdhd: "ADHD", tileBiggerText: "ਵੱਡਾ ਟੈਕਸਟ", tileContrast: "ਕੰਟ੍ਰਾਸਟ+", tileTextSpacing: "ਟੈਕਸਟ ਸਪੇਸਿੰਗ",
      tileLineHeight: "ਲਾਈਨ ਦੀ ਉਚਾਈ", tileHighlightLinks: "ਲਿੰਕ ਹਾਈਲਾਈਟ ਕਰੋ", tileTextAlign: "ਟੈਕਸਟ ਅਲਾਈਨਮੈਂਟ",
      tileDyslexiaFriendly: "ਡਿਸਲੈਕਸੀਆ ਲਈ ਅਨੁਕੂਲ", resetBtn: "ਡਿਫੌਲਟ 'ਤੇ ਰੀਸੈਟ ਕਰੋ", languagePlaceholder: "ਭਾਸ਼ਾ ਚੁਣੋ",
      insightSuffix: "ਪਹੁੰਚਯੋਗਤਾ ਸੁਧਾਰ ਇਸ ਪੰਨੇ 'ਤੇ ਆਪਣੇ ਆਪ ਲਾਗੂ ਕੀਤੇ ਗਏ"
    },
    ta: {
      panelTitle: "அணுகல்தன்மை", panelSub: "இந்த தளம் உங்களுக்கு எவ்வாறு தோன்றும் என்பதை சரிசெய்யவும். அமைப்புகள் ஒவ்வொரு பக்கத்திலும் பொருந்தும்.",
      profilePlaceholder: "அணுகல்தன்மை சுயவிவரங்கள்", profileLowVision: "குறைந்த பார்வை", profileColorBlind: "நிற குருடு",
      profileDyslexia: "டிஸ்லெக்சியா", profileCognitive: "அறிவாற்றல் மற்றும் கற்றல்", profileSeizure: "வலிப்பு நோய்",
      profileAdhd: "ADHD", tileBiggerText: "பெரிய உரை", tileContrast: "மாறுபாடு+", tileTextSpacing: "உரை இடைவெளி",
      tileLineHeight: "வரி உயரம்", tileHighlightLinks: "இணைப்புகளை முன்னிலைப்படுத்து", tileTextAlign: "உரை சீரமைப்பு",
      tileDyslexiaFriendly: "டிஸ்லெக்சியாவுக்கு ஏற்றது", resetBtn: "இயல்புநிலைக்கு மீட்டமை", languagePlaceholder: "மொழியைத் தேர்ந்தெடு",
      insightSuffix: "அணுகல்தன்மை திருத்தங்கள் இந்தப் பக்கத்தில் தானாகவே பயன்படுத்தப்பட்டன"
    },
    th: {
      panelTitle: "การช่วยการเข้าถึง", panelSub: "ปรับวิธีที่เว็บไซต์นี้แสดงผลสำหรับคุณ การตั้งค่านี้จะมีผลกับทุกหน้า",
      profilePlaceholder: "โปรไฟล์การช่วยการเข้าถึง", profileLowVision: "สายตาเลือนราง", profileColorBlind: "ตาบอดสี",
      profileDyslexia: "ดิสเล็กเซีย", profileCognitive: "ความรู้ความเข้าใจและการเรียนรู้", profileSeizure: "โรคลมชักและอาการชัก",
      profileAdhd: "สมาธิสั้น", tileBiggerText: "ข้อความใหญ่ขึ้น", tileContrast: "ความคมชัด+", tileTextSpacing: "ระยะห่างข้อความ",
      tileLineHeight: "ความสูงบรรทัด", tileHighlightLinks: "ไฮไลต์ลิงก์", tileTextAlign: "การจัดแนวข้อความ",
      tileDyslexiaFriendly: "เหมาะกับดิสเล็กเซีย", resetBtn: "รีเซ็ตเป็นค่าเริ่มต้น", languagePlaceholder: "เลือกภาษา",
      insightSuffix: "การแก้ไขการช่วยการเข้าถึงถูกนำไปใช้โดยอัตโนมัติในหน้านี้"
    },
    ko: {
      panelTitle: "접근성", panelSub: "이 사이트가 표시되는 방식을 조정하세요. 설정은 모든 페이지에 적용됩니다.",
      profilePlaceholder: "접근성 프로필", profileLowVision: "저시력", profileColorBlind: "색맹",
      profileDyslexia: "난독증", profileCognitive: "인지 및 학습", profileSeizure: "간질 및 발작",
      profileAdhd: "ADHD", tileBiggerText: "글자 크게", tileContrast: "대비+", tileTextSpacing: "글자 간격",
      tileLineHeight: "줄 높이", tileHighlightLinks: "링크 강조", tileTextAlign: "텍스트 정렬",
      tileDyslexiaFriendly: "난독증 친화적", resetBtn: "기본값으로 재설정", languagePlaceholder: "언어 선택",
      insightSuffix: "접근성 수정 사항이 이 페이지에 자동으로 적용됨"
    },
    ja: {
      panelTitle: "アクセシビリティ", panelSub: "このサイトの表示方法を調整します。設定はすべてのページに適用されます。",
      profilePlaceholder: "アクセシビリティプロファイル", profileLowVision: "弱視", profileColorBlind: "色覚異常",
      profileDyslexia: "ディスレクシア", profileCognitive: "認知と学習", profileSeizure: "てんかんと発作",
      profileAdhd: "ADHD", tileBiggerText: "文字を大きく", tileContrast: "コントラスト+", tileTextSpacing: "文字間隔",
      tileLineHeight: "行の高さ", tileHighlightLinks: "リンクを強調", tileTextAlign: "テキストの配置",
      tileDyslexiaFriendly: "ディスレクシアに配慮", resetBtn: "デフォルトに戻す", languagePlaceholder: "言語を選択",
      insightSuffix: "このページで自動的に適用されたアクセシビリティ修正"
    },
    "zh-TW": {
      panelTitle: "無障礙功能", panelSub: "調整此網站對您的顯示方式。設定會套用至每個頁面。",
      profilePlaceholder: "無障礙設定檔", profileLowVision: "低視力", profileColorBlind: "色盲",
      profileDyslexia: "閱讀障礙", profileCognitive: "認知與學習", profileSeizure: "癲癇與抽搐",
      profileAdhd: "注意力不足過動症", tileBiggerText: "放大文字", tileContrast: "對比度+", tileTextSpacing: "文字間距",
      tileLineHeight: "行高", tileHighlightLinks: "醒目提示連結", tileTextAlign: "文字對齊",
      tileDyslexiaFriendly: "適合閱讀障礙者", resetBtn: "重設為預設值", languagePlaceholder: "選擇語言",
      insightSuffix: "此頁面已自動套用的無障礙修正"
    }
  };

  window.TylerA11yI18n = { LANGUAGES, STRINGS };
})();
