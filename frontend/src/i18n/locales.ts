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
  sos: {
    title: "Emergency",
    countdown: "Sending help in {{n}}…",
    cancel: "Cancel — I'm okay",
    stage1: "I am alerting your family now. Please stay where you are if it is safe.",
    tellMe: "Tell me what is wrong",
    recordBtn: "Speak now",
    recording: "Listening…",
    send: "Send to family",
    sent: "Your family has been alerted.",
    safeNow: "I'm safe now",
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
    safety: "Safety",
    location: "Location sharing",
    locationHint: "Your family can see your location and safe zone.",
    simulateBreach: "Test safe-zone alert",
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
  safety: "सुरक्षा", location: "स्थान साझा करना",
  locationHint: "आपका परिवार आपका स्थान और सुरक्षित क्षेत्र देख सकता है।",
  simulateBreach: "सुरक्षित क्षेत्र अलर्ट जांचें",
});
Object.assign(hi.sos, {
  title: "आपातकाल", countdown: "{{n}} में मदद भेजी जा रही है…", cancel: "रद्द करें — मैं ठीक हूँ",
  stage1: "मैं अभी आपके परिवार को सूचित कर रहा हूँ। यदि सुरक्षित हो तो वहीं रुकें।",
  tellMe: "बताइए क्या हुआ है", recordBtn: "अभी बोलें", recording: "सुन रहा हूँ…",
  send: "परिवार को भेजें", sent: "आपके परिवार को सूचित कर दिया गया है।", safeNow: "मैं अब सुरक्षित हूँ",
});

// Complete Bengali (bn) — Sarvam supports bn voice end-to-end.
const bn: any = {
  appName: "কেয়ারকম্প্যানিয়ন",
  common: { yes: "হ্যাঁ", no: "না", cancel: "বাতিল", back: "পেছনে", close: "বন্ধ", saving: "সংরক্ষণ হচ্ছে…", continue: "এগিয়ে যান", online: "অনলাইন", offline: "অফলাইন" },
  reminderType: { water: "জল", medicine: "ওষুধ", meal: "খাবার", sleep: "ঘুম", exercise: "ব্যায়াম", game: "খেলা" },
  home: {
    greeting: "নমস্কার, {{name}}", whatNow: "এখন কী করবেন", nextActivity: "পরবর্তী কাজ",
    nothingDue: "এখন কিছু করার নেই। বিশ্রাম নিন বা একটি খেলা খেলুন।",
    games: "খেলা", reminders: "আজকের কাজ", notes: "নোট", voice: "আমার সাথে কথা বলুন",
    help: "সাহায্য", callFamily: "পরিবারকে ফোন করুন", settings: "সেটিংস",
    callConfirm: "আপনি কি পরিবারকে ফোন করতে চান?", callPlaced: "আমরা আপনার পরিবারকে জানিয়ে দেব।",
    helpTitle: "সাহায্য এখানে আছে", helpBody: "যেখানে আছেন সেখানেই থাকুন। পরিবারকে ফোন করুন বা কাছের কাউকে সাহায্যের জন্য বলুন।",
  },
  lock: { title: "আপনার পিন দিন", subtitle: "আনলক করতে নম্বর চাপুন", wrong: "পিন সঠিক নয়। আবার চেষ্টা করুন।", unlock: "আনলক" },
  setup: {
    title: "এই ডিভাইস সেট আপ করুন", step1: "পরিচর্যাকারী সাইন ইন", email: "পরিচর্যাকারীর ইমেল", password: "পাসওয়ার্ড",
    step2: "যিনি এই ডিভাইস ব্যবহার করবেন", name: "তাঁর নাম", language: "পছন্দের ভাষা", pin: "৪-সংখ্যার পিন তৈরি করুন",
    consent: "আমি নিশ্চিত করছি যে আমি অনুমোদিত পরিবারের সদস্য।", finish: "সেটআপ শেষ করুন", working: "সেট আপ হচ্ছে…",
    haveAccount: "অ্যাকাউন্ট না থাকলে আমরা তৈরি করে দেব।",
  },
  games: {
    title: "খেলা", subtitle: "খেলার জন্য একটি খেলা বেছে নিন", level: "স্তর", start: "শুরু", quit: "শেষ", hint: "ইঙ্গিত",
    newGame: "আবার খেলুন", backToGames: "খেলায় ফিরে যান", greatJob: "দারুণ চেষ্টা!", score: "স্কোর", accuracy: "নির্ভুলতা",
    time: "সময়", matches: "জোড়া", flipCards: "ছবি জোড়া", flipCardsDesc: "মিলযুক্ত ছবি খুঁজুন",
    numberCards: "সংখ্যা বাগান", numberCardsDesc: "সঠিক সংখ্যা বেছে নিন", whackTheBall: "রঙ ছুঁয়ে দিন",
    whackTheBallDesc: "সঠিক রঙের বল ছুঁয়ে দিন", tapPairs: "জোড়া খুঁজতে দুটি কার্ড চাপুন",
    question: "প্রশ্ন {{n}} / {{total}}", correct: "বাহ!", tryAgain: "প্রায় — সঠিক উত্তর চিহ্নিত।",
    tapTarget: "{{color}} বল ছুঁয়ে দিন", hitsGood: "সঠিক স্পর্শ", resultsTitle: "সুন্দর হয়েছে",
  },
  colors: { red: "লাল", blue: "নীল", green: "সবুজ", yellow: "হলুদ" },
  reminders: {
    title: "আজকের কাজ", done: "হয়েছে", skip: "এড়িয়ে যান", notNow: "এখন নয়", completed: "সম্পন্ন", missed: "মিস হয়েছে",
    skipped: "এড়ানো হয়েছে", pending: "করতে হবে", empty: "এখনও কোনো কাজ নেই।",
    medicineNote: "আপনি নিশ্চিত করলেই ওষুধ নথিভুক্ত হয়।", at: "{{time}} টায়",
  },
  notes: { title: "নোট", add: "নোট যোগ করুন", save: "নোট সংরক্ষণ করুন", placeholder: "একটি ছোট নোট লিখুন…", empty: "এখনও কোনো নোট নেই।" },
  voice: {
    title: "আমার সাথে কথা বলুন", prompt: "আপনার প্রয়োজন লিখুন বা বলুন", placeholder: "যেমন একটি খেলা খেলুন",
    ask: "জিজ্ঞাসা", listening: "শুনছি…", speak: "বলুন",
    replies: {
      play_game: "চলুন একটি খেলা খেলি।", next_reminder: "এই আপনার পরবর্তী কাজ।", today_schedule: "আজকের কাজগুলি এখানে।",
      call_caregiver: "আমি কি পরিবারকে ফোন করব?", sos: "আমি এখন আপনার পরিবারকে সতর্ক করছি। নিরাপদ হলে সেখানেই থাকুন।",
      unknown: "আমি খেলা, কাজ বা পরিবারকে ফোন করতে সাহায্য করতে পারি।",
    },
  },
  sos: {
    title: "জরুরি", countdown: "{{n}} সেকেন্ডে সাহায্য পাঠানো হচ্ছে…", cancel: "বাতিল — আমি ঠিক আছি",
    stage1: "আমি এখন আপনার পরিবারকে সতর্ক করছি। নিরাপদ হলে সেখানেই থাকুন।", tellMe: "কী হয়েছে বলুন",
    recordBtn: "এখন বলুন", recording: "শুনছি…", send: "পরিবারকে পাঠান", sent: "আপনার পরিবারকে সতর্ক করা হয়েছে।", safeNow: "আমি এখন নিরাপদ",
  },
  settings: {
    title: "সেটিংস", language: "ভাষা", syncNow: "এখন সিঙ্ক করুন", lastSynced: "শেষ সিঙ্ক", never: "কখনো না",
    pending: "{{count}}টি আইটেম সিঙ্কের অপেক্ষায়", allSynced: "সবকিছু সিঙ্ক হয়েছে", logout: "এই ডিভাইস রিসেট করুন",
    logoutConfirm: "এতে প্রোফাইল মুছে যাবে। চালিয়ে যাবেন?", connection: "সংযোগ", safety: "নিরাপত্তা", location: "অবস্থান ভাগ",
    locationHint: "আপনার পরিবার আপনার অবস্থান ও নিরাপদ এলাকা দেখতে পাবে।", simulateBreach: "নিরাপদ এলাকা সতর্কতা পরীক্ষা করুন",
  },
};

// Complete Assamese (as). Note: Sarvam TTS does not support Assamese, so the voice
// output path falls back to on-device speech; all on-screen text is fully localized.
const as: any = {
  appName: "কেয়াৰকম্পেনিয়ন",
  common: { yes: "হয়", no: "নহয়", cancel: "বাতিল", back: "পিছলৈ", close: "বন্ধ", saving: "সাঁচি থোৱা হৈছে…", continue: "আগবাঢ়ক", online: "অনলাইন", offline: "অফলাইন" },
  reminderType: { water: "পানী", medicine: "ঔষধ", meal: "আহাৰ", sleep: "শোৱা", exercise: "ব্যায়াম", game: "খেল" },
  home: {
    greeting: "নমস্কাৰ, {{name}}", whatNow: "এতিয়া কি কৰিব", nextActivity: "পৰৱৰ্তী কাম",
    nothingDue: "এতিয়া একো কৰিবলগীয়া নাই। জিৰাওক বা এটা খেল খেলক।",
    games: "খেল", reminders: "আজিৰ কাম", notes: "নোট", voice: "মোৰ সৈতে কথা পাতক",
    help: "সহায়", callFamily: "পৰিয়ালক মাতক", settings: "ছেটিংছ",
    callConfirm: "আপুনি পৰিয়ালক মাতিব বিচাৰেনে?", callPlaced: "আমি আপোনাৰ পৰিয়ালক জনাম।",
    helpTitle: "সহায় ইয়াতে আছে", helpBody: "য'তে আছে তাতে থাকক। পৰিয়ালক মাতক বা ওচৰৰ কাৰোবাক সহায়ৰ বাবে কওক।",
  },
  lock: { title: "আপোনাৰ পিন দিয়ক", subtitle: "আনলক কৰিবলৈ নম্বৰ টিপক", wrong: "পিন শুদ্ধ নহয়। আকৌ চেষ্টা কৰক।", unlock: "আনলক" },
  setup: {
    title: "এই ডিভাইচ ছেট আপ কৰক", step1: "যত্নকাৰী ছাইন ইন", email: "যত্নকাৰীৰ ইমেইল", password: "পাছৱৰ্ড",
    step2: "যিয়ে এই ডিভাইচ ব্যৱহাৰ কৰিব", name: "তেওঁৰ নাম", language: "পছন্দৰ ভাষা", pin: "৪-অংকৰ পিন সৃষ্টি কৰক",
    consent: "মই নিশ্চিত কৰোঁ যে মই অনুমোদিত পৰিয়ালৰ সদস্য।", finish: "ছেটআপ সম্পূৰ্ণ কৰক", working: "ছেট আপ হৈছে…",
    haveAccount: "একাউণ্ট নাথাকিলে আমি সৃষ্টি কৰি দিম।",
  },
  games: {
    title: "খেল", subtitle: "খেলিবলৈ এটা খেল বাছক", level: "স্তৰ", start: "আৰম্ভ", quit: "শেষ", hint: "ইংগিত",
    newGame: "আকৌ খেলক", backToGames: "খেললৈ উভতি যাওক", greatJob: "বৰ ভাল চেষ্টা!", score: "স্ক'ৰ", accuracy: "সঠিকতা",
    time: "সময়", matches: "যোৰা", flipCards: "ছবিৰ যোৰা", flipCardsDesc: "মিলা ছবি বিচাৰক",
    numberCards: "সংখ্যা বাগিছা", numberCardsDesc: "শুদ্ধ সংখ্যা বাছক", whackTheBall: "ৰং স্পৰ্শ কৰক",
    whackTheBallDesc: "শুদ্ধ ৰঙৰ বল স্পৰ্শ কৰক", tapPairs: "যোৰা বিচাৰিবলৈ দুখন কাৰ্ড টিপক",
    question: "প্ৰশ্ন {{n}} / {{total}}", correct: "সাব্বাস!", tryAgain: "প্ৰায় — শুদ্ধ উত্তৰ চিহ্নিত।",
    tapTarget: "{{color}} বল স্পৰ্শ কৰক", hitsGood: "শুদ্ধ স্পৰ্শ", resultsTitle: "ধুনীয়া হ'ল",
  },
  colors: { red: "ৰঙা", blue: "নীলা", green: "সেউজীয়া", yellow: "হালধীয়া" },
  reminders: {
    title: "আজিৰ কাম", done: "হ'ল", skip: "এৰি যাওক", notNow: "এতিয়া নহয়", completed: "সম্পূৰ্ণ", missed: "হেৰুৱালে",
    skipped: "এৰি দিলে", pending: "কৰিবলগীয়া", empty: "এতিয়ালৈকে কোনো কাম নাই।",
    medicineNote: "আপুনি নিশ্চিত কৰিলেহে ঔষধ লিপিবদ্ধ হয়।", at: "{{time}} বজাত",
  },
  notes: { title: "নোট", add: "নোট যোগ কৰক", save: "নোট সাঁচক", placeholder: "এটা সৰু নোট লিখক…", empty: "এতিয়ালৈকে কোনো নোট নাই।" },
  voice: {
    title: "মোৰ সৈতে কথা পাতক", prompt: "আপোনাৰ প্ৰয়োজন লিখক বা কওক", placeholder: "যেনে এটা খেল খেলক",
    ask: "সোধক", listening: "শুনি আছোঁ…", speak: "কওক",
    replies: {
      play_game: "আহক এটা খেল খেলোঁ।", next_reminder: "এইটো আপোনাৰ পৰৱৰ্তী কাম।", today_schedule: "আজিৰ কামবোৰ ইয়াত।",
      call_caregiver: "মই পৰিয়ালক মাতিমনে?", sos: "মই এতিয়া আপোনাৰ পৰিয়ালক সতৰ্ক কৰিছোঁ। নিৰাপদ হ'লে তাতে থাকক।",
      unknown: "মই খেল, কাম বা পৰিয়ালক মতাত সহায় কৰিব পাৰোঁ।",
    },
  },
  sos: {
    title: "জৰুৰী", countdown: "{{n}} ছেকেণ্ডত সহায় পঠিওৱা হৈছে…", cancel: "বাতিল — মই ঠিক আছোঁ",
    stage1: "মই এতিয়া আপোনাৰ পৰিয়ালক সতৰ্ক কৰিছোঁ। নিৰাপদ হ'লে তাতে থাকক।", tellMe: "কি হ'ল কওক",
    recordBtn: "এতিয়া কওক", recording: "শুনি আছোঁ…", send: "পৰিয়ালক পঠিয়াওক", sent: "আপোনাৰ পৰিয়ালক সতৰ্ক কৰা হৈছে।", safeNow: "মই এতিয়া নিৰাপদ",
  },
  settings: {
    title: "ছেটিংছ", language: "ভাষা", syncNow: "এতিয়া ছিংক কৰক", lastSynced: "শেষ ছিংক", never: "কেতিয়াও নহয়",
    pending: "{{count}}টা বস্তু ছিংকৰ অপেক্ষাত", allSynced: "সকলো ছিংক হৈছে", logout: "এই ডিভাইচ ৰিছেট কৰক",
    logoutConfirm: "ইয়াৰ দ্বাৰা প্ৰ'ফাইল আঁতৰি যাব। আগবাঢ়িবনে?", connection: "সংযোগ", safety: "সুৰক্ষা", location: "অৱস্থান ভাগ",
    locationHint: "আপোনাৰ পৰিয়ালে আপোনাৰ অৱস্থান আৰু নিৰাপদ অঞ্চল চাব পাৰিব।", simulateBreach: "নিৰাপদ অঞ্চল সতৰ্কবাণী পৰীক্ষা কৰক",
  },
};

// Manipuri/Meitei (mni) — core navigation + safety in Meitei Mayek.
// MACHINE-GENERATED, PENDING NATIVE REVIEW. Untranslated keys fall back to English.
// Sarvam TTS does not support Manipuri, so voice output uses on-device speech fallback.
const mni: any = {
  appName: "ꯀꯦꯌꯔꯀꯝꯄꯦꯅꯤꯌꯟ",
  common: { yes: "ꯍꯣꯏ", no: "ꯅꯠꯇꯦ", cancel: "ꯀꯛꯊꯠ", back: "ꯍꯟꯗꯣꯛ", close: "ꯂꯣꯟꯁꯤꯅꯕ", online: "ꯑꯟꯂꯥꯏꯟ", offline: "ꯑꯐꯂꯥꯏꯟ" },
  reminderType: { water: "ꯏꯁꯤꯡ", medicine: "ꯍꯤꯗꯥꯛ", meal: "ꯆꯥꯛ", sleep: "ꯇꯨꯝꯕ", exercise: "ꯑꯀꯨꯞꯄ", game: "ꯁꯥꯅꯅꯕ" },
  home: {
    greeting: "ꯈꯨꯔꯨꯝꯖꯔꯤ, {{name}}", games: "ꯁꯥꯅꯅꯕ", reminders: "ꯉꯁꯤꯒꯤ ꯊꯕꯛ", notes: "ꯅꯣꯠ",
    voice: "ꯑꯩꯒ ꯋꯥꯔꯤ ꯁꯥꯅꯕꯤꯌꯨ", help: "ꯃꯇꯦꯡ", callFamily: "ꯏꯃꯨꯡ ꯀꯧꯕꯤꯌꯨ", settings: "ꯁꯦꯇꯤꯡ",
    callConfirm: "ꯑꯗꯣꯝꯒꯤ ꯏꯃꯨꯡ ꯀꯧꯒꯗꯔꯥ?",
  },
  lock: { title: "ꯄꯤꯟ ꯍꯥꯞꯆꯤꯜꯂꯨ", unlock: "ꯑꯟꯂꯣꯛ", wrong: "ꯄꯤꯟ ꯆꯨꯝꯗꯦ꯫ ꯑꯃꯨꯛ ꯍꯣꯠꯅꯕꯤꯌꯨ꯫" },
  sos: {
    title: "ꯑꯋꯥꯕ", cancel: "ꯀꯛꯊꯠ — ꯑꯩ ꯐꯖꯩ",
    stage1: "ꯑꯩꯅ ꯍꯧꯖꯤꯛ ꯑꯗꯣꯝꯒꯤ ꯏꯃꯨꯡ ꯈꯪꯍꯜꯂꯤ꯫ ꯅꯤꯡꯊꯤꯖꯔꯕꯗꯤ ꯃꯐꯝ ꯑꯗꯨꯗ ꯂꯦꯞꯄꯤꯌꯨ꯫",
    tellMe: "ꯀꯔꯤ ꯊꯣꯛꯈꯤꯕꯒꯦ ꯍꯥꯏꯕꯤꯌꯨ", recordBtn: "ꯍꯧꯖꯤꯛ ꯉꯥꯡꯕꯤꯌꯨ", sent: "ꯑꯗꯣꯝꯒꯤ ꯏꯃꯨꯡꯗ ꯈꯪꯍꯜꯂꯦ꯫", safeNow: "ꯑꯩ ꯍꯧꯖꯤꯛ ꯅꯤꯡꯊꯤꯖꯔꯦ",
  },
  settings: { title: "ꯁꯦꯇꯤꯡ", language: "ꯂꯣꯟ", safety: "ꯉꯥꯛꯊꯣꯛꯄ", connection: "ꯀꯅꯦꯛꯁꯟ" },
};

export const TRANSLATION_META = {
  en: { version: 1, reviewer: "source" },
  hi: { version: 1, reviewer: "reviewed" },
  bn: { version: 1, reviewer: "reviewed" },
  as: { version: 1, reviewer: "reviewed", note: "UI complete; Sarvam TTS unsupported → on-device speech fallback" },
  mni: { version: 1, reviewer: "machine", note: "Core + safety only; pending native review; TTS unsupported" },
};

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
