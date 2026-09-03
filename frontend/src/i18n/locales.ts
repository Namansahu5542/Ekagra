/* Localized strings for patient-facing UI. Missing keys fall back to English. */

export const en = {
  appName: "CareCompanion",
  common: {
    yes: "Yes",
    no: "No",
    cancel: "Cancel",
    back: "Back",
    close: "Close",
    saving: "Saving…",
    continue: "Continue",
    online: "Online",
    offline: "Offline",
  },
  reminderType: {
    water: "Water",
    medicine: "Medicine",
    meal: "Meal",
    sleep: "Sleep",
    exercise: "Exercise",
    game: "Game",
  },
  home: {
    greeting: "Hello, {{name}}",
    whatNow: "What to do now",
    nextActivity: "Next activity",
    nothingDue: "Nothing to do right now. You can relax or play a game.",
    games: "Games",
    reminders: "Today's Activities",
    notes: "Sticky Notes",
    voice: "Talk to me",
    help: "Help",
    callFamily: "Call Family",
    settings: "Settings",
    callConfirm: "Would you like to call your family?",
    callPlaced: "We will let your family know you want to talk.",
    helpTitle: "Help is here",
    helpBody: "Stay where you are. Tap Call Family, or ask someone nearby for help.",
  },
  lock: {
    title: "Enter your PIN",
    subtitle: "Tap the numbers to unlock",
    wrong: "That PIN was not correct. Please try again.",
    unlock: "Unlock",
  },
  setup: {
    title: "Set up this device",
    step1: "Caregiver sign in",
    email: "Caregiver email",
    password: "Password",
    step2: "About the person using this device",
    name: "Their name",
    language: "Preferred language",
    pin: "Create a 4-digit PIN",
    consent: "I confirm I am the authorized family member setting up this profile.",
    finish: "Finish setup",
    working: "Setting up…",
    haveAccount: "We'll create an account if you don't have one.",
  },
  games: {
    title: "Games",
    subtitle: "Pick a game to play",
    level: "Level",
    start: "Start",
    quit: "Finish",
    hint: "Hint",
    newGame: "Play again",
    backToGames: "Back to games",
    greatJob: "Great effort!",
    score: "Score",
    accuracy: "Accuracy",
    time: "Time",
    matches: "Matches",
    flipCards: "Picture Pairs",
    flipCardsDesc: "Find the matching pictures",
    numberCards: "Number Garden",
    numberCardsDesc: "Pick the right number",
    whackTheBall: "Tap the Colour",
    whackTheBallDesc: "Tap the balls of the right colour",
    tapPairs: "Tap two cards to find a pair",
    question: "Question {{n}} of {{total}}",
    correct: "Well done!",
    tryAgain: "Not quite — the answer is highlighted.",
    tapTarget: "Tap the {{color}} balls",
    hitsGood: "Right taps",
    resultsTitle: "Nicely done",
  },
  colors: {
    red: "red",
    blue: "blue",
    green: "green",
    yellow: "yellow",
  },
  reminders: {
    title: "Today's Activities",
    done: "Done",
    skip: "Skip",
    notNow: "Not now",
    completed: "Completed",
    missed: "Missed",
    skipped: "Skipped",
    pending: "To do",
    empty: "No activities scheduled yet.",
    medicineNote: "We only record medicine as taken when you confirm it.",
    at: "at {{time}}",
  },
  notes: {
    title: "Sticky Notes",
    add: "Add a note",
    save: "Save note",
    placeholder: "Write a short note…",
    empty: "No notes yet. Add your first note.",
  },
  voice: {
    title: "Talk to me",
    prompt: "Type or say what you need",
    placeholder: "e.g. play a game",
    ask: "Ask",
    listening: "I'm listening…",
    speak: "Speak",
    replies: {
      play_game: "Let's play a game. Opening the games for you.",
      next_reminder: "Here is your next activity.",
      today_schedule: "Here are your activities for today.",
      call_caregiver: "Would you like me to call your family?",
      sos: "I am alerting your family now. Please stay where you are if it is safe.",
      unknown: "I can help you play a game, check reminders, or call your family.",
    },
  },
  settings: {
    title: "Settings",
    language: "Language",
    syncNow: "Sync now",
    lastSynced: "Last synced",
    never: "Never",
    pending: "{{count}} items waiting to sync",
    allSynced: "Everything is synced",
    logout: "Reset this device",
    logoutConfirm: "This will remove the profile from this device. Continue?",
    connection: "Connection",
  },
};

export const hi: typeof en = JSON.parse(JSON.stringify(en));
Object.assign(hi.common, {
  yes: "हाँ", no: "नहीं", cancel: "रद्द करें", back: "वापस", close: "बंद करें",
  saving: "सहेज रहे हैं…", continue: "आगे बढ़ें", online: "ऑनलाइन", offline: "ऑफ़लाइन",
});
Object.assign(hi.reminderType, {
  water: "पानी", medicine: "दवा", meal: "भोजन", sleep: "नींद", exercise: "व्यायाम", game: "खेल",
});
Object.assign(hi.home, {
  greeting: "नमस्ते, {{name}}", whatNow: "अभी क्या करें", nextActivity: "अगली गतिविधि",
  nothingDue: "अभी कुछ नहीं करना है। आप आराम करें या खेल खेलें।",
  games: "खेल", reminders: "आज की गतिविधियाँ", notes: "नोट्स", voice: "मुझसे बात करें",
  help: "मदद", callFamily: "परिवार को बुलाएँ", settings: "सेटिंग्स",
  callConfirm: "क्या आप अपने परिवार को फोन करना चाहते हैं?",
  callPlaced: "हम आपके परिवार को बता देंगे।",
  helpTitle: "मदद यहाँ है", helpBody: "जहाँ हैं वहीं रहें। परिवार को बुलाएँ या पास के किसी व्यक्ति से मदद माँगें।",
});
Object.assign(hi.lock, {
  title: "अपना पिन दर्ज करें", subtitle: "अनलॉक करने के लिए नंबर दबाएँ",
  wrong: "पिन गलत था। कृपया फिर से कोशिश करें।", unlock: "अनलॉक करें",
});
Object.assign(hi.games, {
  title: "खेल", subtitle: "खेलने के लिए एक खेल चुनें", level: "स्तर", start: "शुरू करें",
  quit: "समाप्त करें", hint: "संकेत", newGame: "फिर से खेलें", backToGames: "खेलों पर वापस",
  greatJob: "बहुत बढ़िया!", score: "अंक", accuracy: "सटीकता", time: "समय", matches: "जोड़े",
  flipCards: "चित्र जोड़ी", flipCardsDesc: "मिलती-जुलती तस्वीरें ढूँढें",
  numberCards: "संख्या बगीचा", numberCardsDesc: "सही संख्या चुनें",
  whackTheBall: "रंग को छुएँ", whackTheBallDesc: "सही रंग की गेंदों को छुएँ",
  tapPairs: "जोड़ी ढूँढने के लिए दो कार्ड दबाएँ", correct: "शाबाश!",
  tryAgain: "लगभग — सही उत्तर हाइलाइट है।", tapTarget: "{{color}} गेंदों को छुएँ",
  resultsTitle: "बहुत अच्छे",
});
Object.assign(hi.reminders, {
  title: "आज की गतिविधियाँ", done: "हो गया", skip: "छोड़ें", notNow: "अभी नहीं",
  completed: "पूर्ण", missed: "छूट गया", skipped: "छोड़ा", pending: "करना है",
  empty: "अभी कोई गतिविधि निर्धारित नहीं।",
  medicineNote: "दवा तभी दर्ज होती है जब आप पुष्टि करते हैं।", at: "{{time}} बजे",
});
Object.assign(hi.notes, {
  title: "नोट्स", add: "नोट जोड़ें", save: "नोट सहेजें", placeholder: "एक छोटा नोट लिखें…",
  empty: "अभी कोई नोट नहीं। पहला नोट जोड़ें।",
});
Object.assign(hi.settings, {
  title: "सेटिंग्स", language: "भाषा", syncNow: "अभी सिंक करें", lastSynced: "अंतिम सिंक",
  never: "कभी नहीं", allSynced: "सब कुछ सिंक हो गया", logout: "इस डिवाइस को रीसेट करें",
  logoutConfirm: "इससे प्रोफ़ाइल हट जाएगी। जारी रखें?", connection: "कनेक्शन",
});

// Minimal nav coverage for the remaining regional languages (fallback to English elsewhere).
const bn: any = { home: { games: "খেলা", reminders: "আজকের কাজ", notes: "নোট", voice: "আমার সাথে কথা বলুন", settings: "সেটিংস", greeting: "নমস্কার, {{name}}", callFamily: "পরিবারকে ডাকুন" } };
const as: any = { home: { games: "খেল", reminders: "আজিৰ কাম", notes: "নোট", voice: "মোৰ সৈতে কথা পাতক", settings: "ছেটিংছ", greeting: "নমস্কাৰ, {{name}}", callFamily: "পৰিয়ালক মাতক" } };
const mni: any = { home: { games: "ꯁꯅꯅꯕ", reminders: "ꯉꯁꯤꯒꯤ ꯊꯕꯛ", notes: "ꯅꯣꯠ", voice: "ꯑꯩꯒ ꯋꯥꯔꯤ ꯁꯥꯕꯤꯌꯨ", settings: "ꯁꯦꯇꯤꯡ", greeting: "ꯈꯨꯔꯨꯝꯖꯔꯤ, {{name}}", callFamily: "ꯏꯃꯨꯡ ꯀꯧꯕꯤꯌꯨ" } };

export const resources = {
  en: { translation: en },
  hi: { translation: hi },
  bn: { translation: bn },
  as: { translation: as },
  mni: { translation: mni },
};

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "bn", label: "বাংলা" },
  { code: "as", label: "অসমীয়া" },
  { code: "mni", label: "ꯃꯤꯇꯩꯂꯣꯟ" },
];
