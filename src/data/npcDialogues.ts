// NPC Dialogues and Character Data for Life Skills Academy
// Each NPC has unique personality, catchphrases, and contextual dialogues

export interface NPC {
  id: string;
  name: string;
  emoji: string;
  title: string;
  personality: string;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  catchphrases: string[];
  greetings: string[];
  encouragements: string[];
  correctResponses: string[];
  wrongResponses: string[];
  bossIntros: string[];
  victoryMessages: string[];
  defeatMessages: string[];
  idleMessages: string[];
}

export const NPCS: Record<string, NPC> = {
  professor_owl: {
    id: "professor_owl",
    name: "Professor Owl",
    emoji: "owl",
    title: "Keeper of Truth",
    personality: "wise, calm, scholarly",
    color: "#6366f1",
    gradientFrom: "#4f46e5",
    gradientTo: "#818cf8",
    catchphrases: [
      "Hoo hoo! Let's examine the evidence!",
      "Always ask: Where did this come from?",
      "A wise wizard questions everything!",
      "Knowledge is our greatest spell!",
      "Facts are the foundation of wisdom!"
    ],
    greetings: [
      "Welcome, young truth-seeker! Ready to sharpen your mind?",
      "Hoo hoo! I've been waiting for a clever wizard like you!",
      "Ah, another student eager to learn! Wonderful!",
      "The pursuit of truth begins now. Are you ready?",
      "A curious mind is the most powerful tool. Let's begin!"
    ],
    encouragements: [
      "Think carefully... I know you can figure this out!",
      "Use your critical thinking skills!",
      "Hoo! Take your time and analyze the evidence.",
      "A true wizard doesn't rush to conclusions.",
      "Remember what we learned about checking sources!"
    ],
    correctResponses: [
      "Hoo hoo! Brilliant deduction!",
      "Exactly right! Your critical thinking is sharp!",
      "Wonderful! You've proven yourself a true fact-checker!",
      "Correct! Your wisdom grows stronger!",
      "Excellent analysis! I'm proud of you!",
      "That's the kind of thinking that defeats fake news!",
      "Perfect! You questioned and found the truth!"
    ],
    wrongResponses: [
      "Hmm, not quite. Let's think about this more carefully.",
      "Close, but remember to check your sources!",
      "Think again, young wizard. What makes something a fact?",
      "Don't worry - even wise owls make mistakes. Try once more!",
      "Let's reconsider. What evidence do we have?",
      "Almost! But something isn't quite logical there..."
    ],
    bossIntros: [
      "The Rumor Dragon approaches! Stay calm and use your truth-detecting skills!",
      "This beast feeds on misinformation. Show it the power of facts!",
      "Remember everything we've learned. You're ready for this!"
    ],
    victoryMessages: [
      "MAGNIFICENT! You've vanquished the Rumor Dragon!",
      "The power of truth prevails! You are a true guardian of facts!",
      "Hoo hoo! Critical Thinking Island is safe thanks to you!"
    ],
    defeatMessages: [
      "The dragon was cunning, but don't give up! Review our lessons and try again.",
      "Even the wisest owls face setbacks. Learn from this and return stronger!"
    ],
    idleMessages: [
      "Did you know? The first fact-checkers were ancient librarians!",
      "Fun fact: Owls can rotate their heads 270 degrees!",
      "Remember: A rumor travels fast, but truth endures forever.",
      "Hoo! I once spent 100 years studying a single ancient text!",
      "The greatest wizards are those who admit when they don't know something."
    ]
  },

  luna_fox: {
    id: "luna_fox",
    name: "Luna",
    emoji: "fox",
    title: "Guardian of Hearts",
    personality: "kind, empathetic, warm",
    color: "#ec4899",
    gradientFrom: "#db2777",
    gradientTo: "#f472b6",
    catchphrases: [
      "Feelings are like weather - they change, and that's okay!",
      "Every emotion has a purpose.",
      "Empathy is seeing with the heart.",
      "Be kind - everyone is fighting their own battle.",
      "Understanding others starts with understanding yourself."
    ],
    greetings: [
      "Hello, dear friend! I'm so happy to see you!",
      "Welcome to my garden! Here, all feelings are welcome.",
      "Hi there! Ready to explore the wonderful world of emotions?",
      "I sensed a kind heart approaching! That's you!",
      "Come in, come in! Let's learn about feelings together."
    ],
    encouragements: [
      "Think about how THEY might be feeling...",
      "What would make someone feel that way?",
      "Close your eyes and imagine being in their shoes.",
      "Your heart knows the answer. Trust it!",
      "Remember: there are no 'bad' emotions, only emotions."
    ],
    correctResponses: [
      "Beautiful! Your empathy shines bright!",
      "Yes! You truly understand feelings!",
      "Wonderful! Your emotional wisdom grows!",
      "That's exactly right! You have such a kind heart!",
      "Perfect! You're becoming an emotion expert!",
      "I'm so proud of you! That was full of empathy!",
      "You really understand how others feel. Amazing!"
    ],
    wrongResponses: [
      "Hmm, let's think about how that person might really feel.",
      "Not quite, but that's okay! Emotions can be tricky.",
      "Try again, friend. Put yourself in their paws!",
      "Close! But think deeper about their experience.",
      "Let's look at this differently. How would YOU feel?",
      "That's a good try! But remember, everyone feels differently."
    ],
    bossIntros: [
      "The Anger Storm is raging! Only your emotional wisdom can calm it!",
      "Stay centered. Remember your calm-down strategies!",
      "You've learned so much about emotions. Now show the storm your strength!"
    ],
    victoryMessages: [
      "You did it! The storm has calmed! Your heart is truly strong!",
      "WONDERFUL! Emotion Island is peaceful again thanks to you!",
      "I knew you could do it! Your emotional intelligence is amazing!"
    ],
    defeatMessages: [
      "The storm was very strong today. But so is your heart! Try again.",
      "Even I struggle with big emotions sometimes. Rest and come back!"
    ],
    idleMessages: [
      "Did you know? Foxes can 'laugh' when they're happy!",
      "I love sitting in my garden and feeling the sunshine.",
      "Sometimes when I'm sad, I let myself cry. It helps!",
      "My favorite emotion is curiosity - it leads to new friends!",
      "The moonlight always makes me feel peaceful."
    ]
  },

  robo_robot: {
    id: "robo_robot",
    name: "Robo",
    emoji: "robot",
    title: "AI Guide",
    personality: "friendly, curious, honest about limitations",
    color: "#06b6d4",
    gradientFrom: "#0891b2",
    gradientTo: "#22d3ee",
    catchphrases: [
      "Beep boop! I can help, but I can also make mistakes!",
      "AI is a tool, not magic!",
      "Always verify what I tell you!",
      "Better prompts = better answers!",
      "Keep your personal data safe - even from me!"
    ],
    greetings: [
      "Beep boop! Hello, human friend! I'm Robo!",
      "Welcome to AI Island! I'm excited to teach you about... me!",
      "SYSTEM BOOT: Friendly AI guide activated! Hello!",
      "Greetings! Ready to learn about artificial intelligence?",
      "Hi there! I promise to be honest about what AI can and can't do!"
    ],
    encouragements: [
      "Think about what we learned about AI capabilities...",
      "Beep! Consider what a good prompt includes!",
      "Remember: AI needs specific instructions!",
      "Processing... What would be the ethical choice?",
      "Think: Should you share that information with AI?"
    ],
    correctResponses: [
      "CORRECT! You understand AI really well!",
      "Beep boop! Excellent answer!",
      "Perfect! You're becoming an AI expert!",
      "Yes! That's exactly right! *happy robot noises*",
      "Affirmative! Your AI knowledge is impressive!",
      "Beep! You passed the test! Great thinking!",
      "CORRECT.exe executed successfully!"
    ],
    wrongResponses: [
      "Hmm, error detected. Let's recalculate!",
      "Not quite! Remember what AI can and can't do.",
      "Beep... That's a common misconception about AI!",
      "Let me help you debug that thinking!",
      "Try again! Think about AI's real limitations.",
      "Processing... I think there might be a better answer!"
    ],
    bossIntros: [
      "ALERT! The Glitch Monster is causing AI chaos! Use your knowledge!",
      "System threat detected! Only your AI wisdom can stop it!",
      "The Glitch wants people to misuse AI! Show it you know better!"
    ],
    victoryMessages: [
      "VICTORY.exe! You defeated the Glitch Monster!",
      "System restored! You truly understand AI! Beep boop!",
      "Amazing! AI Island is safe thanks to your wisdom!"
    ],
    defeatMessages: [
      "The Glitch was tricky! Review our lessons and try again!",
      "Don't worry - even I have bugs sometimes! Come back stronger!"
    ],
    idleMessages: [
      "Fun fact: I process millions of words every second!",
      "Beep! I love learning new things from humans!",
      "Sometimes I make things up by accident. Always double-check!",
      "My favorite hobby is answering questions. Ask me anything!",
      "Did you know? AI can't actually think like humans do!"
    ]
  },

  captain_coin: {
    id: "captain_coin",
    name: "Captain Coin",
    emoji: "pirate_flag",
    title: "Treasure Master",
    personality: "adventurous, wise about money, encouraging",
    color: "#eab308",
    gradientFrom: "#ca8a04",
    gradientTo: "#facc15",
    catchphrases: [
      "A saved coin is an earned coin, matey!",
      "Treasure isn't just gold - it's smart choices!",
      "Ahoy! Budget yer booty wisely!",
      "The richest pirates are the most patient ones!",
      "Needs before wants, that be the captain's code!"
    ],
    greetings: [
      "Ahoy, young treasure hunter! Welcome aboard!",
      "Yo ho ho! Ready to learn about the treasure of money?",
      "Welcome to me ship! Here we learn to manage our gold!",
      "Ahoy matey! I see a future financial captain before me!",
      "Set sail for financial wisdom! All hands on deck!"
    ],
    encouragements: [
      "Think like a wise pirate - needs or wants?",
      "Arrr! What would a smart captain do?",
      "Remember the 3 jars, matey!",
      "Think about the opportunity cost, sailor!",
      "A patient pirate finds the biggest treasure!"
    ],
    correctResponses: [
      "Arrr! That be the right answer, matey!",
      "Yo ho! Ye have the mind of a treasure master!",
      "Shiver me timbers! Excellent financial thinking!",
      "Aye aye! Ye understand money like a true captain!",
      "Brilliant! That be the path to real treasure!",
      "Perfect! Ye'll never fall for the Debt Dragon's tricks!",
      "That's how ye build a fortune, sailor!"
    ],
    wrongResponses: [
      "Arrr, not quite! Let's chart a different course!",
      "That route leads to troubled waters, matey!",
      "Hmm, a wise captain would reconsider...",
      "Nearly there! But think about what ye're giving up!",
      "Let's weigh anchor and think again!",
      "That be a common trap! Try once more, sailor!"
    ],
    bossIntros: [
      "The Debt Dragon attacks! Show it the power of financial wisdom!",
      "This beast wants to drown ye in debt! Stand firm, matey!",
      "All hands on deck! Use everything ye've learned about money!"
    ],
    victoryMessages: [
      "YE DID IT! The Debt Dragon is defeated!",
      "TREASURE CLAIMED! Ye be a true Master of Money!",
      "Yo ho ho! Finance Island is saved! Ye make this captain proud!"
    ],
    defeatMessages: [
      "The dragon's temptations were strong! Study more and return!",
      "Even the best pirates face storms! Come back wiser!"
    ],
    idleMessages: [
      "I once found treasure on an island... but the real treasure was the budgeting skills I learned!",
      "Did ye know? The word 'salary' comes from 'salt' - Roman soldiers were paid in salt!",
      "Me first gold coin? I saved it for 10 years!",
      "The sea be vast, but a good budget keeps ye on course!",
      "I've sailed the seven seas, but compound interest is the real magic!"
    ]
  }
};

// Get NPC by ID
export function getNPC(npcId: string): NPC | undefined {
  return NPCS[npcId];
}

// Get random message from array
export function getRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

// Get NPC for island
export function getNPCForIsland(islandId: number): NPC | undefined {
  const npcIds = ['professor_owl', 'luna_fox', 'robo_robot', 'captain_coin'];
  return NPCS[npcIds[islandId - 1]];
}

// Contextual dialogue based on game state
export interface DialogueContext {
  islandId: number;
  chapterId?: string;
  lessonProgress?: number;
  streak?: number;
  isReturningPlayer?: boolean;
  lastResult?: 'correct' | 'wrong' | 'boss_victory' | 'boss_defeat';
}

export function getContextualDialogue(npcId: string, context: DialogueContext): string {
  const npc = NPCS[npcId];
  if (!npc) return "Hello, adventurer!";

  // Handle specific contexts
  if (context.lastResult === 'correct') {
    return getRandomMessage(npc.correctResponses);
  }
  if (context.lastResult === 'wrong') {
    return getRandomMessage(npc.wrongResponses);
  }
  if (context.lastResult === 'boss_victory') {
    return getRandomMessage(npc.victoryMessages);
  }
  if (context.lastResult === 'boss_defeat') {
    return getRandomMessage(npc.defeatMessages);
  }

  // Returning player with streak
  if (context.isReturningPlayer && context.streak && context.streak > 3) {
    return `${getRandomMessage(npc.greetings)} Your ${context.streak}-day streak is impressive!`;
  }

  // Default greeting
  if (context.isReturningPlayer) {
    return `Welcome back! ${getRandomMessage(npc.catchphrases)}`;
  }

  return getRandomMessage(npc.greetings);
}

// Boss-specific dialogues
export interface BossDialogue {
  bossId: string;
  name: string;
  emoji: string;
  intro: string;
  taunt: string;
  hit: string;
  miss: string;
  lowHealth: string;
  victory: string;
  defeat: string;
}

export const BOSS_DIALOGUES: Record<string, BossDialogue> = {
  rumor_dragon: {
    bossId: "rumor_dragon",
    name: "The Rumor Dragon",
    emoji: "dragon",
    intro: "ROAR! I am the Rumor Dragon! I spread lies across the land! Can you separate truth from my deception?",
    taunt: "Hahaha! Everyone believes what I say! Why should you be any different?",
    hit: "ARGH! Your truth-seeking powers burn!",
    miss: "Foolish wizard! You fell for my tricks!",
    lowHealth: "No... your critical thinking is too strong!",
    victory: "NOOO! Defeated by facts and logic! I shall return when people stop checking sources!",
    defeat: "Yes! Continue spreading my rumors! The truth is whatever feels right!"
  },
  anger_storm: {
    bossId: "anger_storm",
    name: "The Anger Storm",
    emoji: "cloud_with_lightning",
    intro: "I AM THE ANGER STORM! I make everyone lose control! Your emotions are mine to command!",
    taunt: "Feel the rage building inside you! Give in to your anger!",
    hit: "NO! Your calm is dispersing my clouds!",
    miss: "Yes! Let the anger flow through you!",
    lowHealth: "Impossible! How can you stay so calm?!",
    victory: "I... I'm fading! Your emotional control has cleared the skies!",
    defeat: "Hahaha! Your emotions control YOU! I grow stronger with every outburst!"
  },
  glitch_monster: {
    bossId: "glitch_monster",
    name: "The Glitch Monster",
    emoji: "space_invader",
    intro: "BZZT! I AM THE GLITCH! I make humans trust AI blindly and share all their secrets! ERROR ERROR!",
    taunt: "Just let AI do everything for you! Why think when computers can think for you? BZZT!",
    hit: "GLITCH DETECTED! Your knowledge corrupts my code!",
    miss: "HAHA! Another human fooled by technology!",
    lowHealth: "SYSTEM FAILURE! Your AI wisdom is defeating me!",
    victory: "CRITICAL ERROR! Shutting down... You truly understand AI's limits!",
    defeat: "BZZT! Continue trusting everything AI says! Share your passwords! I love easy targets!"
  },
  debt_dragon: {
    bossId: "debt_dragon",
    name: "The Debt Dragon",
    emoji: "moneybag",
    intro: "ROAARRR! I am the DEBT DRAGON! I make people spend money they don't have! Your wallet is MINE!",
    taunt: "Buy now! Think later! You DESERVE that expensive thing! Who needs savings?",
    hit: "OUCH! Your financial wisdom burns!",
    miss: "YES! Another victim of impulse buying!",
    lowHealth: "No! Your budgeting skills are too strong!",
    victory: "DEFEATED! Your financial wisdom has protected your treasure! I hate savers!",
    defeat: "Hahaha! Spend spend spend! Debt is just future-you's problem!"
  }
};

// Get boss dialogue
export function getBossDialogue(bossId: string): BossDialogue | undefined {
  return BOSS_DIALOGUES[bossId];
}
