/*
  © 2026 Tyler Janczak. All rights reserved.

  Tyler's site-wide accessibility suite — consolidated into one file so
  every page only needs a single <script> tag:

    <script src="js/accessibility.js" defer></script>

  This one file contains, in load order:
    1. Translation data for the widget's own UI (49 languages)
    2. The accessibility widget itself (launcher, panel, tiles, profiles,
       language picker)
    3. Automatic accessibility remediation (safe auto-fixes + a human
       review queue for anything it won't guess at)
    4. Full-page translation (calls api/translate.js, a free MyMemory-
       backed endpoint with Vercel KV caching)

  Each section below is still a self-contained block (most are their own
  IIFE), kept in this order because later sections read globals the
  earlier ones set (window.TylerA11yI18n, the "tylerA11yChange" event,
  etc.). If you ever want to pull a section back out into its own file,
  each one still works standalone — nothing here is tangled together,
  they just now ship as one request instead of four.
*/

/* ------------------------------------------------------------------ */
/* SECTION 1 — Translation data for the widget's own UI */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/* SECTION 2 — The floating widget itself (launcher, panel, tiles, profiles, language picker) */
/* ------------------------------------------------------------------ */

(function () {
  "use strict";

  if (document.getElementById("a11y-widget")) return;

  const STORAGE_KEY = "tylerSiteA11ySettings";

  const DEFAULTS = {
    biggerText: false,
    contrast: false,
    textSpacing: false,
    lineHeight: false,
    highlightLinks: false,
    textAlign: false,
    dyslexiaFriendly: false,
    reducedMotion: false, // no standalone tile — only set via the Seizure & Epileptic profile
    activeProfile: null,
    language: "en"
  };

  // Translation data for this widget's own UI (js/accessibility-i18n.js).
  // If that file wasn't included on this page, fall back to English only —
  // never throw over a missing optional script.
  const I18N = window.TylerA11yI18n || { LANGUAGES: [], STRINGS: {} };
  function t(key) {
    const dict = I18N.STRINGS[settings.language] || I18N.STRINGS.en || {};
    return dict[key] || (I18N.STRINGS.en && I18N.STRINGS.en[key]) || key;
  }

  // localStorage is scoped per-origin, so a setting saved on tylerjanczak.com
  // is invisible to bridges.tylerjanczak.com (a different origin). A cookie
  // scoped to ".tylerjanczak.com" (leading dot) is shared by every subdomain,
  // so it's mirrored here to carry settings across to the bridges chat.
  const COOKIE_NAME = "tylerA11y";
  const COOKIE_DOMAIN = ".tylerjanczak.com";

  function readCookie(name) {
    const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
    return match ? decodeURIComponent(match[1]) : null;
  }

  function writeCookie(name, value) {
    try {
      document.cookie =
        name + "=" + encodeURIComponent(value) +
        "; domain=" + COOKIE_DOMAIN +
        "; path=/; max-age=31536000; SameSite=Lax";
    } catch {
      // Cookie write blocked (e.g. local file testing) — non-critical.
    }
  }

  function loadSettings() {
    let fromCookie = {};
    let fromLocal = {};
    try {
      const cookieRaw = readCookie(COOKIE_NAME);
      if (cookieRaw) fromCookie = JSON.parse(cookieRaw);
    } catch {
      fromCookie = {};
    }
    try {
      fromLocal = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      fromLocal = {};
    }
    // Same-origin localStorage is the more current source when both exist;
    // the cookie only fills in when this origin has never saved anything.
    return Object.assign({}, DEFAULTS, fromCookie, fromLocal);
  }

  function saveSettings(settings) {
    const serialized = JSON.stringify(settings);
    try {
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch {
      // Storage blocked — settings just won't persist across pages, non-critical.
    }
    writeCookie(COOKIE_NAME, serialized);
    try {
      window.dispatchEvent(new CustomEvent("tylerA11yChange", { detail: settings }));
    } catch {
      // CustomEvent unsupported in some very old browser — non-critical.
    }
  }

  let settings = loadSettings();

  // Load OpenDyslexic (open-license web font) on demand, only if the
  // dyslexia-friendly toggle is ever turned on — no cost to page weight otherwise.
  let dyslexiaFontLoaded = false;
  function ensureDyslexiaFont() {
    if (dyslexiaFontLoaded) return;
    dyslexiaFontLoaded = true;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/open-dyslexic@1.0.3/open-dyslexic.css";
    document.head.appendChild(link);
  }

  const style = document.createElement("style");
  style.textContent = `
    #a11y-widget * { box-sizing: border-box; }

    #a11y-launcher {
      position: fixed;
      bottom: 24px;
      left: 24px;
      z-index: 999998;
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: #C84545;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px rgba(0,0,0,0.18);
      transition: transform 140ms ease;
    }

    #a11y-launcher:hover { transform: scale(1.06); }
    #a11y-launcher svg { width: 26px; height: 26px; }

    #a11y-panel {
      position: fixed;
      bottom: 86px;
      left: 24px;
      z-index: 999999;
      width: 340px;
      max-width: calc(100vw - 48px);
      max-height: 78vh;
      display: none;
      flex-direction: column;
      background: #F7F4EE;
      border: 1px solid #D9D2C4;
      border-radius: 14px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.18);
      font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
      overflow: hidden;
    }

    #a11y-panel.open { display: flex; }

    #a11y-panel-header {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 16px 16px 16px 20px;
      background: #1B1B1B;
    }

    #a11y-panel-title {
      font-family: "Fraunces", Georgia, serif;
      font-size: 16px;
      font-weight: 500;
      color: #ffffff;
    }

    #a11y-panel-close {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: rgba(255,255,255,0.1);
      border: none;
      color: #ffffff;
      cursor: pointer;
      transition: background 140ms ease;
    }

    #a11y-panel-close:hover { background: rgba(255,255,255,0.2); }
    #a11y-panel-close svg { width: 15px; height: 15px; }

    #a11y-panel-body {
      overflow-y: auto;
      padding: 18px 20px 20px;
    }

    #a11y-panel-sub {
      font-size: 12px;
      color: #4A4A48;
      margin-bottom: 16px;
    }

    #a11y-lang-wrap {
      position: relative;
      margin: -4px -4px 4px;
    }

    #a11y-lang-btn {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      background: transparent;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      font-family: "Inter", sans-serif;
      font-size: 14px;
      font-weight: 600;
      color: #1B1B1B;
      text-align: left;
      transition: background 120ms ease;
    }

    #a11y-lang-btn:hover { background: #EFEAE0; }

    #a11y-lang-btn-badge {
      flex-shrink: 0;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: #C84545;
      color: #ffffff;
      font-size: 9.5px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    #a11y-lang-btn-label { flex: 1; }

    #a11y-lang-btn .chev {
      flex-shrink: 0;
      width: 16px;
      height: 16px;
      stroke: #4A4A48;
      transition: transform 140ms ease;
    }

    #a11y-lang-btn.open .chev { transform: rotate(180deg); }

    #a11y-lang-panel {
      display: none;
      margin: 4px 0 14px;
      background: #ffffff;
      border: 1.5px solid #D9D2C4;
      border-radius: 12px;
      overflow: hidden;
    }

    #a11y-lang-panel.open { display: block; }

    #a11y-lang-search-wrap {
      position: relative;
      padding: 10px;
      border-bottom: 1px solid #EFEAE0;
    }

    #a11y-lang-search {
      width: 100%;
      padding: 8px 32px 8px 12px;
      border: 1px solid #D9D2C4;
      border-radius: 999px;
      font-family: "Inter", sans-serif;
      font-size: 12.5px;
      color: #1B1B1B;
      background: #F7F4EE;
    }

    #a11y-lang-search:focus { outline: 2px solid #C8454580; outline-offset: 1px; }

    #a11y-lang-search-icon {
      position: absolute;
      right: 20px;
      top: 50%;
      transform: translateY(-50%);
      width: 14px;
      height: 14px;
      stroke: #8b857e;
      pointer-events: none;
    }

    #a11y-lang-list {
      max-height: 220px;
      overflow-y: auto;
    }

    .a11y-lang-option {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 9px 14px;
      background: transparent;
      border: none;
      border-top: 1px solid #EFEAE0;
      cursor: pointer;
      font-family: "Inter", sans-serif;
      font-size: 12.5px;
      color: #1B1B1B;
      text-align: left;
    }

    .a11y-lang-option:first-child { border-top: none; }
    .a11y-lang-option:hover { background: #FBEFEF; }
    .a11y-lang-option.selected { color: #C84545; font-weight: 700; background: #FBEFEF; }

    .a11y-lang-badge {
      flex-shrink: 0;
      min-width: 26px;
      padding: 2px 5px;
      border-radius: 999px;
      background: #EFEAE0;
      color: #4A4A48;
      font-size: 9.5px;
      font-weight: 700;
      text-align: center;
      letter-spacing: 0.02em;
    }

    .a11y-lang-option.selected .a11y-lang-badge { background: #C84545; color: #ffffff; }

    .a11y-lang-native { flex: 1; }

    .a11y-lang-check {
      flex-shrink: 0;
      width: 16px;
      height: 16px;
      stroke: #C84545;
      visibility: hidden;
    }

    .a11y-lang-option.selected .a11y-lang-check { visibility: visible; }

    .a11y-lang-empty {
      padding: 14px;
      font-size: 12px;
      color: #8b857e;
      text-align: center;
    }

    #a11y-profile-wrap {
      position: relative;
      margin: 0 -4px 14px;
    }

    #a11y-profile-btn {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      background: transparent;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      font-family: "Inter", sans-serif;
      font-size: 13.5px;
      font-weight: 600;
      color: #1B1B1B;
      text-align: left;
      transition: background 120ms ease;
    }

    #a11y-profile-btn:hover { background: #EFEAE0; }

    #a11y-profile-btn.has-profile { color: #C84545; }

    #a11y-profile-btn-badge {
      flex-shrink: 0;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: #1B1B1B;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    #a11y-profile-btn-badge svg { width: 14px; height: 14px; stroke: #ffffff; fill: none; }
    #a11y-profile-btn.has-profile #a11y-profile-btn-badge { background: #C84545; }

    #a11y-profile-btn-label { flex: 1; }

    #a11y-profile-btn .chev {
      flex-shrink: 0;
      width: 16px;
      height: 16px;
      stroke: currentColor;
      transition: transform 140ms ease;
    }

    #a11y-profile-btn.open .chev { transform: rotate(180deg); }

    #a11y-profile-list {
      display: none;
      margin: 2px 0 4px;
      background: #ffffff;
      border: 1.5px solid #D9D2C4;
      border-radius: 12px;
      overflow: hidden;
    }

    #a11y-profile-list.open { display: block; }

    .a11y-profile-option {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 10px 14px;
      background: transparent;
      border: none;
      border-top: 1px solid #EFEAE0;
      cursor: pointer;
      font-family: "Inter", sans-serif;
      font-size: 13px;
      color: #1B1B1B;
      text-align: left;
    }

    .a11y-profile-option:first-child { border-top: none; }
    .a11y-profile-option:hover { background: #FBEFEF; }
    .a11y-profile-option.selected { color: #C84545; font-weight: 700; background: #FBEFEF; }

    .a11y-profile-option-icon {
      flex-shrink: 0;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #EFEAE0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .a11y-profile-option-icon svg { width: 13px; height: 13px; stroke: #1B1B1B; fill: none; }
    .a11y-profile-option.selected .a11y-profile-option-icon { background: #C84545; }
    .a11y-profile-option.selected .a11y-profile-option-icon svg { stroke: #ffffff; }

    .a11y-profile-option-label { flex: 1; }

    .a11y-profile-check {
      flex-shrink: 0;
      width: 16px;
      height: 16px;
      stroke: #C84545;
      visibility: hidden;
    }

    .a11y-profile-option.selected .a11y-profile-check { visibility: visible; }

    #a11y-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .a11y-tile {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 18px 8px;
      background: #ffffff;
      border: 1.5px solid #D9D2C4;
      border-radius: 10px;
      cursor: pointer;
      transition: border-color 140ms ease, background 140ms ease;
      text-align: center;
    }

    .a11y-tile:hover { border-color: #C8454580; }

    .a11y-tile.on {
      border-color: #C84545;
      background: #FBEFEF;
    }

    .a11y-tile svg {
      width: 26px;
      height: 26px;
      stroke: #1B1B1B;
      fill: none;
    }

    .a11y-tile.on svg { stroke: #C84545; }

    .a11y-tile-label {
      font-size: 12.5px;
      font-weight: 600;
      color: #1B1B1B;
      line-height: 1.2;
    }

    .a11y-tile.on .a11y-tile-label { color: #C84545; }

    #a11y-reset {
      margin-top: 16px;
      width: 100%;
      padding: 9px 0;
      background: transparent;
      border: 1px solid #D9D2C4;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #4A4A48;
      cursor: pointer;
    }

    #a11y-reset:hover { border-color: #C84545; color: #C84545; }

    #a11y-insight {
      display: none;
      margin-top: 14px;
      padding-top: 14px;
      border-top: 1px solid #EFEAE0;
      font-size: 11.5px;
      color: #4A4A48;
    }

    #a11y-insight.visible { display: block; }

    #a11y-insight-summary {
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      list-style: none;
    }

    #a11y-insight-summary::-webkit-details-marker { display: none; }

    #a11y-insight-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #3f9b64;
      flex-shrink: 0;
    }

    #a11y-insight-list {
      margin: 8px 0 0;
      padding-left: 16px;
      max-height: 140px;
      overflow-y: auto;
    }

    #a11y-insight-list li { margin-bottom: 5px; line-height: 1.4; }

    /* Applied effects */
    html.a11y-bigger-text { font-size: 118% !important; }
    html.a11y-contrast body { background: #ffffff !important; color: #000000 !important; }
    html.a11y-contrast a { color: #00008B !important; }
    html.a11y-text-spacing body { letter-spacing: 0.04em !important; word-spacing: 0.12em !important; }
    html.a11y-line-height body, html.a11y-line-height p { line-height: 2 !important; }
    html.a11y-highlight-links a {
      background: #FFF3B0 !important;
      text-decoration: underline !important;
      text-decoration-thickness: 2px !important;
    }
    html.a11y-text-align-left body, html.a11y-text-align-left p { text-align: left !important; }
    html.a11y-dyslexia-font body, html.a11y-dyslexia-font p, html.a11y-dyslexia-font li,
    html.a11y-dyslexia-font h1, html.a11y-dyslexia-font h2, html.a11y-dyslexia-font h3,
    html.a11y-dyslexia-font span, html.a11y-dyslexia-font a, html.a11y-dyslexia-font div {
      font-family: "OpenDyslexic", "Comic Sans MS", Verdana, Tahoma, sans-serif !important;
      letter-spacing: 0.03em !important;
    }
    html.a11y-reduced-motion *, html.a11y-reduced-motion *::before, html.a11y-reduced-motion *::after {
      animation-duration: 0.001ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.001ms !important;
    }

    /* Tyler AI chat widget — it's injected as plain DOM (no shadow root),
       so it's reachable, but it sets its own fixed px sizes/colors that
       the generic rules above don't touch. Hook its specific classes here. */
    html.a11y-bigger-text .tyler-ai-title { font-size: 27px !important; }
    html.a11y-bigger-text .tyler-ai-message { font-size: 16.5px !important; }
    html.a11y-bigger-text .tyler-ai-message.notice { font-size: 15.5px !important; }
    html.a11y-bigger-text .tyler-ai-suggestion-chip { font-size: 14.5px !important; }
    html.a11y-bigger-text .tyler-ai-searching-list li,
    html.a11y-bigger-text .tyler-ai-searching-title { font-size: 13.5px !important; }
    html.a11y-bigger-text .tyler-ai-status { font-size: 11.5px !important; }

    html.a11y-contrast #tyler-ai-panel { background: #ffffff !important; }
    html.a11y-contrast #tyler-ai-messages { background: #ffffff !important; }
    html.a11y-contrast .tyler-ai-message {
      background: #ffffff !important;
      color: #000000 !important;
      border-color: #000000 !important;
    }
    html.a11y-contrast .tyler-ai-row.user .tyler-ai-message {
      background: #000000 !important;
      color: #ffffff !important;
      border-color: #000000 !important;
    }
    html.a11y-contrast .tyler-ai-message a { color: #00008B !important; }
    html.a11y-contrast .tyler-ai-row.user .tyler-ai-message a { color: #9fd2ff !important; }
    html.a11y-contrast .tyler-ai-suggestion-chip {
      background: #ffffff !important;
      color: #000000 !important;
      border-color: #000000 !important;
    }

    html.a11y-text-spacing .tyler-ai-message {
      letter-spacing: 0.04em !important;
      word-spacing: 0.12em !important;
    }

    html.a11y-line-height .tyler-ai-message { line-height: 1.9 !important; }

    html.a11y-text-align-left .tyler-ai-message,
    html.a11y-text-align-left .tyler-ai-suggestion-chip { text-align: left !important; }
  `;
  document.head.appendChild(style);

  const CLASS_MAP = {
    biggerText: "a11y-bigger-text",
    contrast: "a11y-contrast",
    textSpacing: "a11y-text-spacing",
    lineHeight: "a11y-line-height",
    highlightLinks: "a11y-highlight-links",
    textAlign: "a11y-text-align-left",
    dyslexiaFriendly: "a11y-dyslexia-font",
    reducedMotion: "a11y-reduced-motion"
  };

  function applySettings() {
    if (settings.dyslexiaFriendly) ensureDyslexiaFont();
    Object.keys(CLASS_MAP).forEach((key) => {
      document.documentElement.classList.toggle(CLASS_MAP[key], !!settings[key]);
    });
  }

  applySettings();

  const TOGGLES = [
    {
      key: "biggerText",
      labelKey: "tileBiggerText",
      icon: `<path d="M4 6h7M7.5 6v12" stroke-width="1.8" stroke-linecap="round"/><path d="M14 10h7M17.5 10v8" stroke-width="1.8" stroke-linecap="round"/>`
    },
    {
      key: "contrast",
      labelKey: "tileContrast",
      icon: `<circle cx="12" cy="12" r="9" stroke-width="1.8"/><path d="M12 3a9 9 0 010 18z" fill="currentColor" stroke="none"/>`
    },
    {
      key: "textSpacing",
      labelKey: "tileTextSpacing",
      icon: `<path d="M5 12h2M17 12h2M9 12h1M14 12h1" stroke-width="1.8" stroke-linecap="round"/><path d="M4 8l-1.5 4L4 16M20 8l1.5 4L20 16" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`
    },
    {
      key: "lineHeight",
      labelKey: "tileLineHeight",
      icon: `<path d="M6 5v14M6 5l-2 2M6 5l2 2M6 19l-2-2M6 19l2-2" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 7h9M12 12h9M12 17h9" stroke-width="1.8" stroke-linecap="round"/>`
    },
    {
      key: "highlightLinks",
      labelKey: "tileHighlightLinks",
      icon: `<path d="M9 15l6-6" stroke-width="1.8" stroke-linecap="round"/><path d="M10 6.5l1-1a3.5 3.5 0 015 5l-1 1M14 17.5l-1 1a3.5 3.5 0 01-5-5l1-1" stroke-width="1.8" stroke-linecap="round"/>`
    },
    {
      key: "textAlign",
      labelKey: "tileTextAlign",
      icon: `<path d="M4 6h16M4 11h11M4 16h16M4 21h11" stroke-width="1.8" stroke-linecap="round"/>`
    },
    {
      key: "dyslexiaFriendly",
      labelKey: "tileDyslexiaFriendly",
      icon: `<text x="12" y="17" text-anchor="middle" font-size="14" font-weight="700" fill="currentColor" stroke="none" font-family="Georgia, serif">Df</text>`
    }
  ];

  // Each profile is a self-identified starting point, not a diagnosis — picking
  // one just applies the combination of the toggles above that best fits it.
  // Left out: "Blind" and "Motor Impaired" — none of these display toggles do
  // anything for either (screen readers work natively regardless, and nothing
  // here addresses pointer/click precision), so listing them would promise
  // something the widget doesn't deliver.
  const PROFILES = [
    {
      key: "lowVision",
      labelKey: "profileLowVision",
      icon: `<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" stroke-width="1.6"/><circle cx="12" cy="12" r="2.6" stroke-width="1.6"/>`,
      settings: { biggerText: true, contrast: true }
    },
    {
      key: "colorBlind",
      labelKey: "profileColorBlind",
      icon: `<path d="M12 3c3 4 5 6.5 5 9.5a5 5 0 01-10 0C7 9.5 9 7 12 3z" stroke-width="1.6" stroke-linejoin="round"/>`,
      settings: { contrast: true, highlightLinks: true }
    },
    {
      key: "dyslexia",
      labelKey: "profileDyslexia",
      icon: `<text x="12" y="16" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor" stroke="none" font-family="Georgia, serif">Df</text>`,
      settings: { dyslexiaFriendly: true, lineHeight: true, textSpacing: true }
    },
    {
      key: "cognitive",
      labelKey: "profileCognitive",
      icon: `<circle cx="9" cy="9" r="2.2" stroke-width="1.6"/><circle cx="15" cy="9" r="2.2" stroke-width="1.6"/><circle cx="9" cy="15" r="2.2" stroke-width="1.6"/><circle cx="15" cy="15" r="2.2" stroke-width="1.6"/>`,
      settings: { lineHeight: true, textSpacing: true, highlightLinks: true }
    },
    {
      key: "seizure",
      labelKey: "profileSeizure",
      icon: `<path d="M12 3a9 9 0 100 18 9 9 0 000-18z" stroke-width="1.6"/><path d="M12 3a9 9 0 000 18" stroke-width="1.6"/>`,
      settings: { reducedMotion: true, contrast: true }
    },
    {
      key: "adhd",
      labelKey: "profileAdhd",
      icon: `<circle cx="12" cy="12" r="8" stroke-width="1.6"/><circle cx="12" cy="12" r="3.5" stroke-width="1.6"/>`,
      settings: { highlightLinks: true, lineHeight: true }
    }
  ];

  const widget = document.createElement("div");
  widget.id = "a11y-widget";

  const launcher = document.createElement("button");
  launcher.id = "a11y-launcher";
  launcher.type = "button";
  launcher.setAttribute("aria-label", "Accessibility settings");
  launcher.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="12" cy="4.5" r="1.8" fill="#ffffff"/>
      <path d="M4 8.5c2.5 1 5.3 1.5 8 1.5s5.5-.5 8-1.5" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M12 10v10.5M12 14l-3.5 6.5M12 14l3.5 6.5" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;

  const panel = document.createElement("div");
  panel.id = "a11y-panel";

  // --- Dark header bar with title + close button ---
  const panelHeader = document.createElement("div");
  panelHeader.id = "a11y-panel-header";

  const title = document.createElement("div");
  title.id = "a11y-panel-title";

  const panelClose = document.createElement("button");
  panelClose.id = "a11y-panel-close";
  panelClose.type = "button";
  panelClose.setAttribute("aria-label", "Close accessibility menu");
  panelClose.innerHTML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
  panelClose.addEventListener("click", () => {
    panel.classList.remove("open");
    closeDropdowns();
  });

  panelHeader.appendChild(title);
  panelHeader.appendChild(panelClose);
  panel.appendChild(panelHeader);

  // --- Scrollable body: everything below the header lives here ---
  const panelBody = document.createElement("div");
  panelBody.id = "a11y-panel-body";
  panel.appendChild(panelBody);

  const sub = document.createElement("div");
  sub.id = "a11y-panel-sub";
  panelBody.appendChild(sub);

  // --- Language menu row ---
  const langWrap = document.createElement("div");
  langWrap.id = "a11y-lang-wrap";

  const langBtn = document.createElement("button");
  langBtn.id = "a11y-lang-btn";
  langBtn.type = "button";
  langBtn.setAttribute("aria-haspopup", "listbox");
  langBtn.setAttribute("aria-expanded", "false");

  const langBtnBadge = document.createElement("span");
  langBtnBadge.id = "a11y-lang-btn-badge";

  const langBtnLabel = document.createElement("span");
  langBtnLabel.id = "a11y-lang-btn-label";

  const langChev = document.createElement("span");
  langChev.innerHTML = `<svg class="chev" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M6 9l6 6 6-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  langBtn.appendChild(langBtnBadge);
  langBtn.appendChild(langBtnLabel);
  langBtn.appendChild(langChev.firstElementChild);

  // Bordered panel that drops open below the button: search box + scroll list.
  const langPanel = document.createElement("div");
  langPanel.id = "a11y-lang-panel";

  const langSearchWrap = document.createElement("div");
  langSearchWrap.id = "a11y-lang-search-wrap";

  const langSearch = document.createElement("input");
  langSearch.id = "a11y-lang-search";
  langSearch.type = "text";
  langSearch.setAttribute("autocomplete", "off");
  langSearch.setAttribute("aria-label", "Search language");

  const langSearchIcon = document.createElement("span");
  langSearchIcon.innerHTML = `<svg id="a11y-lang-search-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" stroke-width="1.8"/><path d="M20 20l-4.5-4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;

  langSearchWrap.appendChild(langSearch);
  langSearchWrap.appendChild(langSearchIcon.firstElementChild);

  const langList = document.createElement("div");
  langList.id = "a11y-lang-list";
  langList.setAttribute("role", "listbox");

  const langEmpty = document.createElement("div");
  langEmpty.className = "a11y-lang-empty";
  langEmpty.style.display = "none";

  (I18N.LANGUAGES || []).forEach((lang) => {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "a11y-lang-option";
    option.setAttribute("role", "option");
    option.setAttribute("data-lang", lang.code);
    option.innerHTML = `
      <span class="a11y-lang-badge">${lang.badge}</span>
      <span class="a11y-lang-native">${lang.native}</span>
      <svg class="a11y-lang-check" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    `;
    option.addEventListener("click", () => {
      settings.language = lang.code;
      saveSettings(settings);
      applyTranslations();
      langSearch.value = "";
      filterLangList("");
      langPanel.classList.remove("open");
      langBtn.classList.remove("open");
      langBtn.setAttribute("aria-expanded", "false");
    });
    langList.appendChild(option);
  });

  langList.appendChild(langEmpty);

  function filterLangList(query) {
    const normalized = query.trim().toLowerCase();
    let visibleCount = 0;
    langList.querySelectorAll(".a11y-lang-option").forEach((el) => {
      const native = el.querySelector(".a11y-lang-native");
      const matches = !normalized || (native && native.textContent.toLowerCase().includes(normalized));
      el.style.display = matches ? "" : "none";
      if (matches) visibleCount += 1;
    });
    langEmpty.textContent = "No languages found";
    langEmpty.style.display = visibleCount === 0 ? "block" : "none";
  }

  langSearch.addEventListener("input", () => filterLangList(langSearch.value));
  langSearch.addEventListener("click", (event) => event.stopPropagation());

  langPanel.appendChild(langSearchWrap);
  langPanel.appendChild(langList);

  langBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = langPanel.classList.toggle("open");
    langBtn.classList.toggle("open", isOpen);
    langBtn.setAttribute("aria-expanded", String(isOpen));
    if (isOpen) {
      langSearch.value = "";
      filterLangList("");
      setTimeout(() => langSearch.focus(), 0);
    }
  });

  langWrap.appendChild(langBtn);
  langWrap.appendChild(langPanel);
  panelBody.appendChild(langWrap);

  // --- Accessibility Profiles menu row ---
  const profileWrap = document.createElement("div");
  profileWrap.id = "a11y-profile-wrap";

  const profileBtn = document.createElement("button");
  profileBtn.id = "a11y-profile-btn";
  profileBtn.type = "button";
  profileBtn.setAttribute("aria-haspopup", "listbox");
  profileBtn.setAttribute("aria-expanded", "false");

  const profileBtnBadge = document.createElement("span");
  profileBtnBadge.id = "a11y-profile-btn-badge";
  profileBtnBadge.innerHTML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="12" cy="8" r="3.4" stroke-width="1.8"/><path d="M5 20c1.4-4 4-6 7-6s5.6 2 7 6" stroke-width="1.8" stroke-linecap="round"/></svg>`;

  const profileBtnLabel = document.createElement("span");
  profileBtnLabel.id = "a11y-profile-btn-label";

  const chevSvg = document.createElement("span");
  chevSvg.innerHTML = `<svg class="chev" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M6 9l6 6 6-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  profileBtn.appendChild(profileBtnBadge);
  profileBtn.appendChild(profileBtnLabel);
  profileBtn.appendChild(chevSvg.firstElementChild);

  const profileList = document.createElement("div");
  profileList.id = "a11y-profile-list";
  profileList.setAttribute("role", "listbox");

  function profileLabelFor(key) {
    if (!key) return t("profilePlaceholder");
    const match = PROFILES.find((p) => p.key === key);
    return match ? t(match.labelKey) : t("profilePlaceholder");
  }

  function refreshProfileButton() {
    profileBtnLabel.textContent = profileLabelFor(settings.activeProfile);
    profileBtn.classList.toggle("has-profile", !!settings.activeProfile);
  }

  function refreshTiles() {
    grid.querySelectorAll(".a11y-tile").forEach((el) => {
      const key = el.getAttribute("data-key");
      const on = !!settings[key];
      el.classList.toggle("on", on);
      el.setAttribute("aria-checked", String(on));
    });
  }

  function refreshProfileOptions() {
    profileList.querySelectorAll(".a11y-profile-option").forEach((el) => {
      el.classList.toggle("selected", el.getAttribute("data-key") === settings.activeProfile);
    });
  }

  PROFILES.forEach((profile) => {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "a11y-profile-option";
    option.setAttribute("role", "option");
    option.setAttribute("data-key", profile.key);
    option.innerHTML = `
      <span class="a11y-profile-option-icon">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${profile.icon}</svg>
      </span>
      <span class="a11y-profile-option-label" data-label-key="${profile.labelKey}">${t(profile.labelKey)}</span>
      <svg class="a11y-profile-check" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    `;
    option.addEventListener("click", () => {
      const alreadySelected = settings.activeProfile === profile.key;
      settings = Object.assign({}, DEFAULTS, { language: settings.language });
      if (!alreadySelected) {
        Object.assign(settings, profile.settings);
        settings.activeProfile = profile.key;
      }
      applySettings();
      saveSettings(settings);
      refreshProfileButton();
      refreshProfileOptions();
      refreshTiles();
      profileList.classList.remove("open");
      profileBtn.classList.remove("open");
      profileBtn.setAttribute("aria-expanded", "false");
    });
    profileList.appendChild(option);
  });

  profileBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = profileList.classList.toggle("open");
    profileBtn.classList.toggle("open", isOpen);
    profileBtn.setAttribute("aria-expanded", String(isOpen));
  });

  profileWrap.appendChild(profileBtn);
  profileWrap.appendChild(profileList);
  panelBody.appendChild(profileWrap);

  const grid = document.createElement("div");
  grid.id = "a11y-grid";

  TOGGLES.forEach(({ key, labelKey, icon }) => {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "a11y-tile" + (settings[key] ? " on" : "");
    tile.setAttribute("data-key", key);
    tile.setAttribute("role", "switch");
    tile.setAttribute("aria-checked", String(!!settings[key]));
    tile.setAttribute("aria-label", t(labelKey));

    tile.innerHTML = `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${icon}</svg>
      <span class="a11y-tile-label" data-label-key="${labelKey}">${t(labelKey)}</span>
    `;

    tile.addEventListener("click", () => {
      settings[key] = !settings[key];
      // A manual toggle makes the combination custom, so it no longer
      // matches whichever profile (if any) was selected.
      settings.activeProfile = null;
      applySettings();
      saveSettings(settings);
      refreshTiles();
      refreshProfileButton();
      refreshProfileOptions();
    });

    grid.appendChild(tile);
  });

  panelBody.appendChild(grid);

  const resetBtn = document.createElement("button");
  resetBtn.id = "a11y-reset";
  resetBtn.type = "button";
  resetBtn.addEventListener("click", () => {
    settings = Object.assign({}, DEFAULTS, { language: settings.language });
    applySettings();
    saveSettings(settings);
    refreshTiles();
    refreshProfileButton();
    refreshProfileOptions();
  });

  panelBody.appendChild(resetBtn);

  // --- Remediation insight (populated only if js/accessibility-remediation.js
  // is also included on this page — otherwise this section just stays hidden) ---
  const insight = document.createElement("details");
  insight.id = "a11y-insight";

  const insightSummary = document.createElement("summary");
  insightSummary.id = "a11y-insight-summary";
  insightSummary.innerHTML = `<span id="a11y-insight-dot"></span><span id="a11y-insight-text"></span>`;

  const insightList = document.createElement("ul");
  insightList.id = "a11y-insight-list";

  insight.appendChild(insightSummary);
  insight.appendChild(insightList);
  panelBody.appendChild(insight);

  let lastRemediationData = null;

  function refreshInsight(data) {
    lastRemediationData = data;
    const applied = (data && data.appliedFixes) || [];
    if (!applied.length) {
      insight.classList.remove("visible");
      return;
    }
    insight.classList.add("visible");
    document.getElementById("a11y-insight-text").textContent =
      `${applied.length} ${t("insightSuffix")}`;
    insightList.innerHTML = "";
    applied.slice(0, 20).forEach((fix) => {
      const li = document.createElement("li");
      li.textContent = fix.description;
      insightList.appendChild(li);
    });
  }

  if (window.__tylerA11yRemediation) refreshInsight(window.__tylerA11yRemediation);
  window.addEventListener("tylerA11yRemediationUpdate", (event) => refreshInsight(event.detail));

  // Re-renders every piece of the widget's own text in the currently
  // selected language — called on init and whenever the language changes.
  function applyTranslations() {
    title.textContent = t("panelTitle");
    sub.textContent = t("panelSub");
    resetBtn.textContent = t("resetBtn");

    const currentLang = (I18N.LANGUAGES || []).find((l) => l.code === settings.language);
    langBtnBadge.textContent = currentLang ? currentLang.badge : "";
    langBtnLabel.textContent = currentLang ? currentLang.native : t("languagePlaceholder");
    langList.querySelectorAll(".a11y-lang-option").forEach((el) => {
      el.classList.toggle("selected", el.getAttribute("data-lang") === settings.language);
    });

    panel.querySelectorAll("[data-label-key]").forEach((el) => {
      el.textContent = t(el.getAttribute("data-label-key"));
    });

    TOGGLES.forEach(({ key, labelKey }) => {
      const tile = grid.querySelector(`.a11y-tile[data-key="${key}"]`);
      if (tile) tile.setAttribute("aria-label", t(labelKey));
    });

    refreshProfileButton();
    if (lastRemediationData) refreshInsight(lastRemediationData);

    // Lets the rest of the page (and screen readers) know the widget's own
    // content is now in a different language than the surrounding page.
    widget.setAttribute("lang", settings.language);
    const RTL_LANGS = ["ar", "he", "fa", "ps", "prs"];
    panel.setAttribute("dir", RTL_LANGS.includes(settings.language) ? "rtl" : "ltr");
  }

  applyTranslations();
  refreshProfileOptions();

  launcher.addEventListener("click", () => {
    panel.classList.toggle("open");
  });

  function closeDropdowns() {
    profileList.classList.remove("open");
    profileBtn.classList.remove("open");
    profileBtn.setAttribute("aria-expanded", "false");
    langPanel.classList.remove("open");
    langBtn.classList.remove("open");
    langBtn.setAttribute("aria-expanded", "false");
  }

  document.addEventListener("click", (event) => {
    if (!widget.contains(event.target)) {
      panel.classList.remove("open");
      closeDropdowns();
    } else if (!profileWrap.contains(event.target) && !langWrap.contains(event.target)) {
      closeDropdowns();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      panel.classList.remove("open");
      closeDropdowns();
    }
  });

  widget.appendChild(launcher);
  widget.appendChild(panel);
  document.body.appendChild(widget);
})();

/* ------------------------------------------------------------------ */
/* SECTION 3 — Automatic issue scanning + safe auto-fixes */
/* ------------------------------------------------------------------ */

(function () {
  "use strict";

  const LOG_URL = "https://tylerjanczak-github-io.vercel.app/api/a11y-log";
  const SESSION_FLAG = "tylerA11yRemediationSentThisPage";

  const appliedFixes = [];
  const needsReview = [];

  function describe(el) {
    const tag = el.tagName ? el.tagName.toLowerCase() : "node";
    const id = el.id ? `#${el.id}` : "";
    const cls = el.className && typeof el.className === "string"
      ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".")
      : "";
    return `${tag}${id}${cls}`;
  }

  function snippet(el) {
    try {
      return el.outerHTML.slice(0, 200);
    } catch {
      return "";
    }
  }

  function recordFix(type, el, note) {
    appliedFixes.push({ type, description: `${note} (${describe(el)})` });
  }

  function recordReview(type, el, note) {
    needsReview.push({
      type,
      description: `${note} (${describe(el)})`,
      elementSnippet: snippet(el)
    });
  }

  // --- 1. Images missing alt text ---
  function fixImages(root) {
    root.querySelectorAll("img:not([alt])").forEach((img) => {
      const w = img.naturalWidth || img.width || 0;
      const h = img.naturalHeight || img.height || 0;
      const smallIcon = w && h && w <= 32 && h <= 32;
      const insideLinkOrButton = !!img.closest("a, button");

      if (smallIcon || insideLinkOrButton) {
        // Likely decorative or redundant with surrounding link/button text.
        img.setAttribute("alt", "");
        recordFix("image-alt", img, "Marked small/decorative image as alt=\"\"");
        return;
      }

      const figcaption = img.closest("figure")?.querySelector("figcaption");
      if (figcaption && figcaption.textContent.trim()) {
        img.setAttribute("alt", figcaption.textContent.trim().slice(0, 120));
        recordFix("image-alt", img, "Used nearby figcaption text as alt text");
        return;
      }

      // Best-effort fallback from the filename — low confidence, so it's
      // also flagged for a human to write something better.
      const filename = (img.currentSrc || img.src || "")
        .split("/").pop()
        .split("?")[0]
        .replace(/\.[a-z0-9]+$/i, "")
        .replace(/[-_]+/g, " ")
        .trim();
      img.setAttribute("alt", filename || "Image");
      recordFix("image-alt", img, "Added low-confidence alt text from filename");
      recordReview("image-alt-low-confidence", img, "Auto-generated alt text from filename — needs a real description");
    });
  }

  // --- 2. Form fields missing an accessible name ---
  function fixFormLabels(root) {
    root.querySelectorAll("input, textarea, select").forEach((field) => {
      if (field.type === "hidden") return;
      const hasLabel =
        field.labels && field.labels.length > 0 ||
        field.getAttribute("aria-label") ||
        field.getAttribute("aria-labelledby") ||
        field.getAttribute("title");
      if (hasLabel) return;

      // Look for likely label text immediately before the field.
      let candidate = field.previousElementSibling;
      let labelText = "";
      if (candidate && /^(label|span|div|p)$/i.test(candidate.tagName) && candidate.textContent.trim().length < 80) {
        labelText = candidate.textContent.trim();
      }

      if (labelText) {
        field.setAttribute("aria-label", labelText);
        recordFix("form-label", field, `Associated nearby text "${labelText}" as its label`);
        return;
      }

      if (field.placeholder) {
        field.setAttribute("aria-label", field.placeholder);
        recordFix("form-label", field, "Used placeholder text as a fallback label");
        recordReview("form-label-placeholder-fallback", field, "Labeled only via placeholder — needs a real <label>");
        return;
      }

      recordReview("form-label-missing", field, "No accessible name found for this field");
    });
  }

  // --- 3. Icon-only buttons/links with no accessible text ---
  const ICON_NAME_HINTS = [
    [/close|dismiss|×/i, "Close"],
    [/menu|hamburger/i, "Menu"],
    [/search/i, "Search"],
    [/back/i, "Back"],
    [/next/i, "Next"],
    [/prev/i, "Previous"],
    [/play/i, "Play"],
    [/pause/i, "Pause"],
    [/send/i, "Send"],
    [/expand|chevron|arrow/i, "Expand"]
  ];

  function fixIconOnlyControls(root) {
    root.querySelectorAll("button, a[href]").forEach((el) => {
      const hasText = el.textContent.trim().length > 0;
      const hasLabel = el.getAttribute("aria-label") || el.getAttribute("aria-labelledby");
      if (hasText || hasLabel) return;
      const hasVisualContent = el.querySelector("svg, img");
      if (!hasVisualContent) return;

      const haystack = `${el.className} ${el.id}`;
      const hint = ICON_NAME_HINTS.find(([pattern]) => pattern.test(haystack));

      if (hint) {
        el.setAttribute("aria-label", hint[1]);
        recordFix("icon-label", el, `Inferred label "${hint[1]}" from element class/id`);
      } else {
        el.setAttribute("aria-label", el.tagName.toLowerCase() === "a" ? "Link" : "Button");
        recordFix("icon-label", el, "Added a generic placeholder label — low confidence");
        recordReview("icon-label-low-confidence", el, "Icon-only control given a generic label — needs a specific one");
      }
    });
  }

  // --- 4. Non-semantic clickable elements ---
  function fixClickableDivs(root) {
    root.querySelectorAll("[onclick]").forEach((el) => {
      if (/^(a|button|input|select|textarea)$/i.test(el.tagName)) return;
      if (el.getAttribute("role") === "button" && el.hasAttribute("tabindex")) return;

      el.setAttribute("role", "button");
      if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "0");

      if (!el.dataset.tylerA11yKeyHandler) {
        el.dataset.tylerA11yKeyHandler = "1";
        el.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            el.click();
          }
        });
      }

      recordFix("clickable-div", el, "Added role=\"button\", tabindex, and keyboard support to a clickable non-semantic element");
    });
  }

  // --- 5. Skip-to-content link ---
  function ensureSkipLink() {
    if (document.getElementById("tyler-a11y-skip-link")) return;

    const main = document.querySelector("main, #main, [role='main']");
    if (!main) return;

    if (!main.id) main.id = "tyler-a11y-main";

    const link = document.createElement("a");
    link.id = "tyler-a11y-skip-link";
    link.href = `#${main.id}`;
    link.textContent = "Skip to main content";
    link.style.cssText = `
      position: absolute;
      left: -9999px;
      top: 0;
      z-index: 1000000;
      padding: 10px 16px;
      background: #C84545;
      color: #ffffff;
      font-family: "Inter", sans-serif;
      font-size: 14px;
      font-weight: 600;
      border-radius: 0 0 8px 0;
      text-decoration: none;
    `;
    link.addEventListener("focus", () => {
      link.style.left = "0px";
    });
    link.addEventListener("blur", () => {
      link.style.left = "-9999px";
    });
    document.body.insertBefore(link, document.body.firstChild);
    recordFix("skip-link", document.body, "Injected a skip-to-main-content link");
  }

  // --- 6. Contrast (detect only — never auto-recolor brand colors) ---
  function relativeLuminance(r, g, b) {
    const [rs, gs, bs] = [r, g, b].map((c) => {
      const v = c / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  function contrastRatio(rgb1, rgb2) {
    const l1 = relativeLuminance(...rgb1) + 0.05;
    const l2 = relativeLuminance(...rgb2) + 0.05;
    return l1 > l2 ? l1 / l2 : l2 / l1;
  }

  function parseRgb(str) {
    const match = str.match(/rgba?\(([^)]+)\)/);
    if (!match) return null;
    const parts = match[1].split(",").map((n) => parseFloat(n));
    if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return null;
    return parts.slice(0, 3);
  }

  function effectiveBackground(el) {
    let node = el;
    while (node && node !== document.documentElement) {
      const bg = getComputedStyle(node).backgroundColor;
      const rgb = parseRgb(bg);
      if (rgb && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") return rgb;
      node = node.parentElement;
    }
    return [247, 244, 238]; // page background fallback
  }

  function checkContrast(root) {
    const candidates = root.querySelectorAll("p, a, span, li, h1, h2, h3, button, label");
    let checked = 0;
    candidates.forEach((el) => {
      if (checked >= 60) return; // cap the scan cost on very long pages
      if (!el.textContent.trim()) return;
      const style = getComputedStyle(el);
      const fg = parseRgb(style.color);
      if (!fg) return;
      const bg = effectiveBackground(el);
      const ratio = contrastRatio(fg, bg);
      const fontSize = parseFloat(style.fontSize) || 16;
      const isLarge = fontSize >= 24 || (fontSize >= 18.66 && parseInt(style.fontWeight, 10) >= 700);
      const minRatio = isLarge ? 3 : 4.5;
      checked++;
      if (ratio < minRatio) {
        recordReview(
          "low-contrast",
          el,
          `Text contrast ${ratio.toFixed(2)}:1 is below the ${minRatio}:1 WCAG minimum`
        );
      }
    });
  }

  // --- 7. Heading order (detect only) ---
  function checkHeadingOrder(root) {
    const headings = Array.from(root.querySelectorAll("h1, h2, h3, h4, h5, h6"));
    let previousLevel = 0;
    headings.forEach((h) => {
      const level = parseInt(h.tagName[1], 10);
      if (previousLevel && level > previousLevel + 1) {
        recordReview(
          "heading-order",
          h,
          `Heading level jumps from h${previousLevel} to h${level} — skips a level`
        );
      }
      previousLevel = level;
    });
  }

  function runScan(root) {
    fixImages(root);
    fixFormLabels(root);
    fixIconOnlyControls(root);
    fixClickableDivs(root);
    if (root === document) ensureSkipLink();
    checkContrast(root);
    checkHeadingOrder(root);
  }

  runScan(document);

  // Re-scan dynamically-added content (e.g. Tyler AI chat messages as they
  // stream in) without rescanning the whole page every time.
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) runScan(node);
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });

  window.__tylerA11yRemediation = { appliedFixes, needsReview };

  function announce() {
    try {
      window.dispatchEvent(
        new CustomEvent("tylerA11yRemediationUpdate", {
          detail: { appliedFixes, needsReview }
        })
      );
    } catch {
      // Non-critical.
    }
  }

  announce();

  // Report only what needs a human — applied fixes stay purely client-side.
  function reportNeedsReview() {
    if (!needsReview.length) return;
    if (sessionStorage.getItem(SESSION_FLAG)) return;

    try {
      sessionStorage.setItem(SESSION_FLAG, "1");
    } catch {
      // Non-critical.
    }

    fetch(LOG_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pageUrl: location.pathname,
        issues: needsReview.slice(0, 25)
      }),
      keepalive: true
    }).catch(() => {
      // Non-critical — visitor's experience never depends on this succeeding.
    });
  }

  // Give the MutationObserver a moment to catch anything injected right
  // after load (e.g. the chat widget's own DOM) before reporting.
  window.setTimeout(() => {
    announce();
    reportNeedsReview();
  }, 1500);
})();

/* ------------------------------------------------------------------ */
/* SECTION 4 — Full-page translation */
/* ------------------------------------------------------------------ */

(function () {
  "use strict";

  if (window.__tylerA11yTranslateInit) return;
  window.__tylerA11yTranslateInit = true;

  const STORAGE_KEY = "tylerSiteA11ySettings";
  const COOKIE_NAME = "tylerA11y";
  const CACHE_PREFIX = "tylerTranslateCache::";
  const TRANSLATE_URL = "https://tylerjanczak-github-io.vercel.app/api/translate";
  const BATCH_SIZE = 60;

  // Elements whose text should never be sent out for translation.
  const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "CODE", "PRE"]);

  function readCookie(name) {
    const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
    return match ? decodeURIComponent(match[1]) : null;
  }

  function currentLanguage() {
    try {
      const local = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      if (local.language) return local.language;
    } catch {
      /* fall through to cookie */
    }
    try {
      const cookieRaw = readCookie(COOKIE_NAME);
      if (cookieRaw) {
        const fromCookie = JSON.parse(cookieRaw);
        if (fromCookie.language) return fromCookie.language;
      }
    } catch {
      /* default below */
    }
    return "en";
  }

  // Cheap, fast, non-cryptographic string hash (djb2) — only used to
  // detect "has this page's translatable text changed since it was
  // cached", not for anything security-sensitive.
  function hashString(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
    }
    return String(hash >>> 0);
  }

  function isSkippableAncestor(node) {
    let el = node.parentElement;
    while (el) {
      if (SKIP_TAGS.has(el.tagName)) return true;
      if (el.id === "a11y-widget") return true; // widget has its own i18n
      if (el.hasAttribute && el.hasAttribute("data-no-translate")) return true;
      if (el.isContentEditable) return true;
      el = el.parentElement;
    }
    return false;
  }

  // Every text node we've ever touched keeps its untouched original text
  // here, so switching languages (including back to English) never needs
  // a page reload and never compounds translations on top of translations.
  const originalTextMap = new WeakMap();
  const knownNodes = [];

  function collectTextNodes() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        if (isSkippableAncestor(node)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    const nodes = [];
    let current;
    while ((current = walker.nextNode())) {
      if (!originalTextMap.has(current)) {
        originalTextMap.set(current, current.nodeValue);
        knownNodes.push(current);
      }
      nodes.push(current);
    }
    return nodes;
  }

  function restoreOriginals() {
    knownNodes.forEach((node) => {
      if (node.isConnected && originalTextMap.has(node)) {
        node.nodeValue = originalTextMap.get(node);
      }
    });
  }

  async function fetchTranslations(lang, texts) {
    const chunks = [];
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      chunks.push(texts.slice(i, i + BATCH_SIZE));
    }

    const map = {};
    for (const chunk of chunks) {
      try {
        const res = await fetch(TRANSLATE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lang, texts: chunk })
        });
        if (!res.ok) throw new Error(`Translate endpoint HTTP ${res.status}`);
        const data = await res.json();
        const translations = data.translations || [];
        chunk.forEach((original, i) => {
          map[original] = translations[i] || original;
        });
      } catch (err) {
        // Network hiccup or the endpoint isn't deployed yet — leave this
        // chunk untranslated rather than breaking the page.
        console.warn("[accessibility-translate] batch failed, showing original text:", err);
        chunk.forEach((original) => {
          map[original] = original;
        });
      }
    }
    return map;
  }

  let translateToken = 0;

  async function translatePage(lang) {
    const normalizedLang = (lang || "en").toLowerCase();
    const myToken = ++translateToken;

    if (normalizedLang === "en" || normalizedLang === "en-us") {
      restoreOriginals();
      window.dispatchEvent(new CustomEvent("tylerA11yTranslateStatus", { detail: { status: "done", lang: "en" } }));
      return;
    }

    const nodes = collectTextNodes();
    if (!nodes.length) return;

    // Always translate from the untouched original, never from whatever
    // is currently on screen — otherwise switching es -> ja would try to
    // translate Spanish text instead of the real source English.
    const uniqueOriginals = Array.from(
      new Set(nodes.map((n) => originalTextMap.get(n).trim()).filter(Boolean))
    );

    const contentHash = hashString(uniqueOriginals.join("|"));
    const cacheKey = CACHE_PREFIX + normalizedLang + "::" + location.pathname;

    let cachedMap = null;
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.hash === contentHash && parsed.map) cachedMap = parsed.map;
      }
    } catch {
      cachedMap = null;
    }

    window.dispatchEvent(new CustomEvent("tylerA11yTranslateStatus", { detail: { status: "translating", lang: normalizedLang } }));

    const map = cachedMap || (await fetchTranslations(normalizedLang, uniqueOriginals));

    // If the language changed again while we were waiting on the network,
    // don't clobber whatever the user picked next.
    if (myToken !== translateToken) return;

    if (!cachedMap) {
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ hash: contentHash, map }));
      } catch {
        // Storage full or blocked — translation still applies this visit,
        // just won't be instant on the next one.
      }
    }

    nodes.forEach((node) => {
      const original = originalTextMap.get(node);
      const trimmed = original.trim();
      if (!trimmed) return;
      const translated = map[trimmed];
      if (translated) {
        // Preserve original leading/trailing whitespace so layout spacing
        // between inline elements doesn't collapse.
        const leading = original.match(/^\s*/)[0];
        const trailing = original.match(/\s*$/)[0];
        node.nodeValue = leading + translated + trailing;
      }
    });

    window.dispatchEvent(new CustomEvent("tylerA11yTranslateStatus", { detail: { status: "done", lang: normalizedLang } }));
  }

  window.TylerA11yTranslate = { translatePage };

  window.addEventListener("tylerA11yChange", (event) => {
    translatePage(event.detail && event.detail.language);
  });

  function init() {
    const lang = currentLanguage();
    if (lang && lang.toLowerCase() !== "en") translatePage(lang);
  }

  if (document.readyState === "complete") {
    init();
  } else {
    window.addEventListener("load", init);
  }
})();
