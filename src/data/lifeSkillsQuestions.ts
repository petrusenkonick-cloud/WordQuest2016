// Life Skills Questions Database - 21st Century Skills
// 4 Islands, 12 Chapters, Multiple Game Types per Lesson

export type GameType =
  | "quiz"
  | "drag_drop"
  | "match_pairs"
  | "fill_blank"
  | "sort_order"
  | "spot_error"
  | "timed_challenge";

export interface BaseQuestion {
  id: string;
  type: GameType;
  difficulty: 1 | 2 | 3;
}

export interface QuizQuestion extends BaseQuestion {
  type: "quiz";
  text: string;
  image?: string;
  options: string[];
  correct: string;
  explanation: string;
}

export interface DragDropQuestion extends BaseQuestion {
  type: "drag_drop";
  instruction: string;
  items: { id: string; text: string; image?: string }[];
  categories: { id: string; name: string; description?: string }[];
  correctMapping: Record<string, string>; // itemId -> categoryId
}

export interface MatchPairsQuestion extends BaseQuestion {
  type: "match_pairs";
  instruction: string;
  pairs: { left: string; leftImage?: string; right: string; rightImage?: string }[];
}

export interface FillBlankQuestion extends BaseQuestion {
  type: "fill_blank";
  sentence: string; // Use ___ for blank
  options: string[];
  correct: string;
  context?: string;
}

export interface SortOrderQuestion extends BaseQuestion {
  type: "sort_order";
  instruction: string;
  items: string[];
  correctOrder: string[];
}

export interface SpotErrorQuestion extends BaseQuestion {
  type: "spot_error";
  instruction: string;
  content: string;
  errors: { text: string; explanation: string }[];
}

export interface TimedChallengeQuestion extends BaseQuestion {
  type: "timed_challenge";
  instruction: string;
  timeLimit: number; // seconds
  questions: { text: string; answer: string }[];
}

export type Question =
  | QuizQuestion
  | DragDropQuestion
  | MatchPairsQuestion
  | FillBlankQuestion
  | SortOrderQuestion
  | SpotErrorQuestion
  | TimedChallengeQuestion;

export interface Lesson {
  id: string;
  name: string;
  description: string;
  intro: {
    npcMessage: string;
    scenario?: string;
  };
  games: Question[];
  outro: {
    npcMessage: string;
    reward: { diamonds: number; xp: number };
  };
}

export interface BossBattle {
  id: string;
  name: string;
  bossEmoji: string;
  bossName: string;
  health: number;
  intro: {
    npcMessage: string;
    bossMessage: string;
  };
  questions: QuizQuestion[];
  victory: {
    npcMessage: string;
    reward: { diamonds: number; emeralds: number; xp: number };
  };
  defeat: {
    npcMessage: string;
    bossMessage: string;
  };
}

export interface Chapter {
  id: number;
  chapterId: string;
  name: string;
  description: string;
  islandId: number;
  lessons: Lesson[];
  boss?: BossBattle;
}

export interface Island {
  id: number;
  name: string;
  emoji: string;
  theme: string;
  description: string;
  npcId: string;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  chapters: Chapter[];
}

// ============================================
// ISLAND 1: Critical Thinking Island
// NPC: Professor Owl
// ============================================

const criticalThinkingChapters: Chapter[] = [
  // Chapter 1: Fact Kingdom - Fact vs Opinion
  {
    id: 1,
    chapterId: "ct_ch1",
    name: "Fact Kingdom",
    description: "Learn to tell facts from opinions",
    islandId: 1,
    lessons: [
      {
        id: "ct_ch1_l1",
        name: "What is a Fact?",
        description: "Learn what makes something a fact",
        intro: {
          npcMessage: "Welcome to Fact Kingdom, young wizard! I'm Professor Owl. Here, we learn to separate FACTS from OPINIONS. A fact is something we can PROVE is true!",
          scenario: "The kingdom's library has mixed up all the fact scrolls with opinion scrolls. We need your help to sort them!",
        },
        games: [
          {
            id: "ct1_q1",
            type: "quiz",
            difficulty: 1,
            text: "Which of these is a FACT?",
            options: [
              "Pizza is the best food",
              "Water freezes at 0 degrees Celsius",
              "Blue is the prettiest color",
              "Mondays are boring"
            ],
            correct: "Water freezes at 0 degrees Celsius",
            explanation: "A fact can be proven true or false. We can prove water freezes at 0°C, but we can't prove pizza is the 'best' food - that's just an opinion!"
          },
          {
            id: "ct1_q2",
            type: "drag_drop",
            difficulty: 1,
            instruction: "Drag each statement to the correct category",
            items: [
              { id: "i1", text: "The Earth is round" },
              { id: "i2", text: "Dogs are cute" },
              { id: "i3", text: "There are 7 days in a week" },
              { id: "i4", text: "Summer is the best season" },
              { id: "i5", text: "The sun rises in the east" },
              { id: "i6", text: "Vegetables taste bad" }
            ],
            categories: [
              { id: "fact", name: "FACTS", description: "Can be proven true" },
              { id: "opinion", name: "OPINIONS", description: "Personal beliefs" }
            ],
            correctMapping: {
              "i1": "fact",
              "i2": "opinion",
              "i3": "fact",
              "i4": "opinion",
              "i5": "fact",
              "i6": "opinion"
            }
          },
          {
            id: "ct1_q3",
            type: "fill_blank",
            difficulty: 1,
            sentence: "A fact is something that can be ___ to be true or false.",
            options: ["felt", "proven", "believed", "wished"],
            correct: "proven",
            context: "Facts are statements we can verify with evidence."
          },
          {
            id: "ct1_q4",
            type: "quiz",
            difficulty: 2,
            text: "Why is 'Chocolate is delicious' an OPINION?",
            options: [
              "Because everyone agrees",
              "Because some people don't like chocolate",
              "Because chocolate is brown",
              "Because it's about food"
            ],
            correct: "Because some people don't like chocolate",
            explanation: "An opinion is a personal feeling or belief. Not everyone thinks chocolate is delicious - some people dislike it! That makes it an opinion, not a fact."
          }
        ],
        outro: {
          npcMessage: "Excellent work, young wizard! You've learned to identify facts - statements we can prove. Remember: if you can't prove it, it's probably an opinion!",
          reward: { diamonds: 15, xp: 50 }
        }
      },
      {
        id: "ct_ch1_l2",
        name: "Opinion Detectives",
        description: "Spot opinions hiding as facts",
        intro: {
          npcMessage: "Hoo hoo! Now for a trickier lesson. Sometimes opinions DISGUISE themselves as facts. Watch out for sneaky words like 'best', 'worst', 'should', and 'everyone thinks'!",
          scenario: "The Opinion Trickster has scattered misleading statements around the kingdom!",
        },
        games: [
          {
            id: "ct2_q1",
            type: "spot_error",
            difficulty: 2,
            instruction: "Find the hidden opinions in this news report!",
            content: "Today at school, students had a wonderful assembly about recycling. Everyone knows that recycling is boring, but it's important. The speaker, who was obviously the best presenter ever, told us that plastic takes 450 years to decompose.",
            errors: [
              { text: "wonderful", explanation: "'Wonderful' is subjective - not everyone might think it was wonderful" },
              { text: "Everyone knows that recycling is boring", explanation: "This is an opinion disguised with 'Everyone knows'" },
              { text: "obviously the best presenter ever", explanation: "'Best ever' is an extreme opinion" }
            ]
          },
          {
            id: "ct2_q2",
            type: "match_pairs",
            difficulty: 2,
            instruction: "Match each statement with what makes it a FACT or OPINION",
            pairs: [
              { left: "The Eiffel Tower is 330 meters tall", right: "FACT - We can measure it" },
              { left: "Paris is the most beautiful city", right: "OPINION - 'most beautiful' is subjective" },
              { left: "2 + 2 = 4", right: "FACT - Math can be proven" },
              { left: "Math is hard", right: "OPINION - Different for everyone" }
            ]
          },
          {
            id: "ct2_q3",
            type: "quiz",
            difficulty: 2,
            text: "Which word usually signals an OPINION?",
            options: [
              "According to research",
              "The data shows",
              "I believe that",
              "Scientists discovered"
            ],
            correct: "I believe that",
            explanation: "Words like 'I believe', 'I think', 'should', 'best', 'worst' usually signal an opinion. Facts use words like 'research shows' or 'the data proves'."
          }
        ],
        outro: {
          npcMessage: "Brilliant detective work! Now you can spot opinions even when they try to sneak past as facts. Always look for opinion signal words!",
          reward: { diamonds: 20, xp: 60 }
        }
      },
      {
        id: "ct_ch1_l3",
        name: "Fact vs Opinion Master",
        description: "Advanced challenges!",
        intro: {
          npcMessage: "Time for the ultimate fact-checking challenge! Real life is full of tricky statements. Let's see if you can handle them all!",
        },
        games: [
          {
            id: "ct3_q1",
            type: "timed_challenge",
            difficulty: 3,
            instruction: "Quick! Sort these into FACT or OPINION! You have 30 seconds!",
            timeLimit: 30,
            questions: [
              { text: "The Pacific Ocean is the largest ocean", answer: "FACT" },
              { text: "Swimming is fun", answer: "OPINION" },
              { text: "Sharks have been around for 450 million years", answer: "FACT" },
              { text: "Fish are interesting animals", answer: "OPINION" },
              { text: "Some fish can walk on land", answer: "FACT" }
            ]
          },
          {
            id: "ct3_q2",
            type: "sort_order",
            difficulty: 3,
            instruction: "Put these steps in order for checking if something is a fact",
            items: [
              "Research from multiple sources",
              "Ask: Can this be proven?",
              "Look for opinion signal words",
              "Check if experts agree",
              "Form your conclusion"
            ],
            correctOrder: [
              "Ask: Can this be proven?",
              "Look for opinion signal words",
              "Research from multiple sources",
              "Check if experts agree",
              "Form your conclusion"
            ]
          }
        ],
        outro: {
          npcMessage: "You've mastered Fact Kingdom! You now have the power to separate truth from opinion. Use this power wisely, young wizard!",
          reward: { diamonds: 25, xp: 75 }
        }
      }
    ]
  },

  // Chapter 2: Truth Tower - Fake News Detection
  {
    id: 2,
    chapterId: "ct_ch2",
    name: "Truth Tower",
    description: "Learn to spot fake news",
    islandId: 1,
    lessons: [
      {
        id: "ct_ch2_l1",
        name: "What is Fake News?",
        description: "Learn the signs of fake news",
        intro: {
          npcMessage: "Welcome to Truth Tower! Fake news is FALSE information that LOOKS real. It's designed to trick people. Let me teach you how to spot it!",
          scenario: "Fake news scrolls have been appearing in the kingdom's message boards. We need to identify and remove them!",
        },
        games: [
          {
            id: "ct4_q1",
            type: "quiz",
            difficulty: 1,
            text: "What is FAKE NEWS?",
            options: [
              "News that is boring",
              "News that is old",
              "False information pretending to be real news",
              "News from other countries"
            ],
            correct: "False information pretending to be real news",
            explanation: "Fake news is false or misleading information that's written to look like real news. It's designed to trick people!"
          },
          {
            id: "ct4_q2",
            type: "drag_drop",
            difficulty: 2,
            instruction: "Which are WARNING SIGNS of fake news?",
            items: [
              { id: "w1", text: "ALL CAPS HEADLINE!!!" },
              { id: "w2", text: "Author's name and date shown" },
              { id: "w3", text: "No sources mentioned" },
              { id: "w4", text: "Links to official research" },
              { id: "w5", text: "Spelling mistakes everywhere" },
              { id: "w6", text: "Too good to be true" }
            ],
            categories: [
              { id: "warning", name: "WARNING SIGNS" },
              { id: "trustworthy", name: "TRUSTWORTHY SIGNS" }
            ],
            correctMapping: {
              "w1": "warning",
              "w2": "trustworthy",
              "w3": "warning",
              "w4": "trustworthy",
              "w5": "warning",
              "w6": "warning"
            }
          },
          {
            id: "ct4_q3",
            type: "quiz",
            difficulty: 2,
            text: "You see a news story saying 'FREE IPHONES FOR EVERYONE! Click here!' What should you think?",
            options: [
              "Wow, free phones!",
              "This is probably fake - too good to be true",
              "I should share this with friends",
              "This must be real news"
            ],
            correct: "This is probably fake - too good to be true",
            explanation: "If something sounds too good to be true, it probably is! This is a classic sign of fake news or a scam. Real news doesn't offer free phones!"
          }
        ],
        outro: {
          npcMessage: "Great job! You've learned the basic signs of fake news. Always be suspicious of headlines that are too shocking or too good to be true!",
          reward: { diamonds: 15, xp: 50 }
        }
      },
      {
        id: "ct_ch2_l2",
        name: "Source Checking",
        description: "Learn to verify information sources",
        intro: {
          npcMessage: "Now let's learn to CHECK SOURCES. Where does information come from? Is the source trustworthy? This is how real fact-checkers work!",
        },
        games: [
          {
            id: "ct5_q1",
            type: "sort_order",
            difficulty: 2,
            instruction: "Rank these sources from MOST to LEAST trustworthy",
            items: [
              "Official government health website",
              "Random person on social media",
              "Encyclopedia or educational website",
              "A blog with no author name"
            ],
            correctOrder: [
              "Official government health website",
              "Encyclopedia or educational website",
              "A blog with no author name",
              "Random person on social media"
            ]
          },
          {
            id: "ct5_q2",
            type: "match_pairs",
            difficulty: 2,
            instruction: "Match each source type with its trust level",
            pairs: [
              { left: "Wikipedia (for basic info)", right: "Good starting point, verify elsewhere" },
              { left: "Scientific journals", right: "Very trustworthy, reviewed by experts" },
              { left: "YouTube comments", right: "Not reliable, anyone can post" },
              { left: "News from multiple sources", right: "Trustworthy if sources agree" }
            ]
          },
          {
            id: "ct5_q3",
            type: "quiz",
            difficulty: 2,
            text: "What's the BEST way to check if news is real?",
            options: [
              "Ask your friends",
              "Check if other trusted news sources report the same thing",
              "If it has pictures, it must be real",
              "Trust the first result on Google"
            ],
            correct: "Check if other trusted news sources report the same thing",
            explanation: "Cross-checking with multiple trusted sources is the best way to verify news. If only one unknown website reports something, be suspicious!"
          }
        ],
        outro: {
          npcMessage: "Excellent! You now know how to check sources. Remember: one source isn't enough. Always look for confirmation from trusted places!",
          reward: { diamonds: 20, xp: 60 }
        }
      },
      {
        id: "ct_ch2_l3",
        name: "Truth Seeker",
        description: "Advanced fake news detection",
        intro: {
          npcMessage: "Final challenge of Truth Tower! Let's put all your skills together and become a TRUE fact-checker!",
        },
        games: [
          {
            id: "ct6_q1",
            type: "spot_error",
            difficulty: 3,
            instruction: "Find ALL the fake news warning signs in this article!",
            content: "SHOCKING! Scientists HATE This One Trick!!! A mom from nowhere discovered that eating candy cures all diseases! Big companies don't want you to know! Share before they delete this! No doctors were interviewed for this story.",
            errors: [
              { text: "SHOCKING!", explanation: "Sensational language to grab attention" },
              { text: "Scientists HATE", explanation: "Clickbait emotional trigger" },
              { text: "eating candy cures all diseases", explanation: "Too good to be true, no evidence" },
              { text: "Big companies don't want you to know", explanation: "Conspiracy theory language" },
              { text: "Share before they delete this", explanation: "Pressure tactic - real news doesn't do this" },
              { text: "No doctors were interviewed", explanation: "No expert sources" }
            ]
          },
          {
            id: "ct6_q2",
            type: "quiz",
            difficulty: 3,
            text: "Your friend shares news saying a celebrity died. What should you do FIRST?",
            options: [
              "Share it with others immediately",
              "Feel sad right away",
              "Check official news sources to verify",
              "Comment saying it's fake"
            ],
            correct: "Check official news sources to verify",
            explanation: "Before reacting OR sharing, always verify! False celebrity death news spreads fast. Check BBC, CNN, or other major news sites first."
          }
        ],
        outro: {
          npcMessage: "You've completed Truth Tower! You're now a certified fact-checker. Use your powers to stop the spread of fake news!",
          reward: { diamonds: 25, xp: 75 }
        }
      }
    ]
  },

  // Chapter 3: Logic Land - Logical Reasoning
  {
    id: 3,
    chapterId: "ct_ch3",
    name: "Logic Land",
    description: "Master logical thinking",
    islandId: 1,
    lessons: [
      {
        id: "ct_ch3_l1",
        name: "Cause and Effect",
        description: "Understand what causes what",
        intro: {
          npcMessage: "Welcome to Logic Land! Here we learn to think LOGICALLY. First lesson: understanding CAUSE and EFFECT. If A happens, what does it cause?",
        },
        games: [
          {
            id: "ct7_q1",
            type: "match_pairs",
            difficulty: 1,
            instruction: "Match each CAUSE with its EFFECT",
            pairs: [
              { left: "It rained all day", right: "The ground is wet" },
              { left: "I studied hard", right: "I got a good grade" },
              { left: "The alarm rang", right: "I woke up" },
              { left: "I ate too much candy", right: "My stomach hurt" }
            ]
          },
          {
            id: "ct7_q2",
            type: "quiz",
            difficulty: 2,
            text: "Tom says: 'I wore my lucky socks, so our team won!' Is this logical?",
            options: [
              "Yes, lucky socks cause wins",
              "No, socks don't affect game outcomes",
              "Yes, if Tom believes it",
              "Maybe, we need more data"
            ],
            correct: "No, socks don't affect game outcomes",
            explanation: "This is called 'superstition' - believing two things are connected when they're not. Tom's socks didn't CAUSE the win. The team's skill did!"
          },
          {
            id: "ct7_q3",
            type: "sort_order",
            difficulty: 2,
            instruction: "Put these events in logical order",
            items: [
              "The plant grew tall",
              "Seeds were planted",
              "Water and sunlight were provided",
              "Seeds sprouted"
            ],
            correctOrder: [
              "Seeds were planted",
              "Water and sunlight were provided",
              "Seeds sprouted",
              "The plant grew tall"
            ]
          }
        ],
        outro: {
          npcMessage: "Wonderful! You understand cause and effect. Not everything that happens before something CAUSES it - remember that!",
          reward: { diamonds: 15, xp: 50 }
        }
      },
      {
        id: "ct_ch3_l2",
        name: "Logical Arguments",
        description: "Build strong arguments",
        intro: {
          npcMessage: "Now let's learn about ARGUMENTS - not fighting, but making logical points! A good argument has EVIDENCE to support it.",
        },
        games: [
          {
            id: "ct8_q1",
            type: "quiz",
            difficulty: 2,
            text: "Which is the STRONGEST argument for why we should exercise?",
            options: [
              "Everyone does it",
              "My mom said so",
              "Studies show it improves health and mood",
              "It's popular on social media"
            ],
            correct: "Studies show it improves health and mood",
            explanation: "The strongest argument has EVIDENCE (studies). 'Everyone does it' or 'because someone said so' aren't strong reasons!"
          },
          {
            id: "ct8_q2",
            type: "drag_drop",
            difficulty: 2,
            instruction: "Sort these into STRONG or WEAK evidence",
            items: [
              { id: "e1", text: "Scientific research" },
              { id: "e2", text: "My friend told me" },
              { id: "e3", text: "Statistics from studies" },
              { id: "e4", text: "I saw it in a meme" },
              { id: "e5", text: "Expert opinion" },
              { id: "e6", text: "One person's experience" }
            ],
            categories: [
              { id: "strong", name: "STRONG EVIDENCE" },
              { id: "weak", name: "WEAK EVIDENCE" }
            ],
            correctMapping: {
              "e1": "strong",
              "e2": "weak",
              "e3": "strong",
              "e4": "weak",
              "e5": "strong",
              "e6": "weak"
            }
          }
        ],
        outro: {
          npcMessage: "Great work! Always look for strong evidence when making or evaluating arguments. Feelings and rumors aren't enough!",
          reward: { diamonds: 20, xp: 60 }
        }
      }
    ],
    boss: {
      id: "boss_ct",
      name: "The Rumor Dragon",
      bossEmoji: "dragon",
      bossName: "The Rumor Dragon",
      health: 100,
      intro: {
        npcMessage: "The Rumor Dragon spreads fake news and bad logic everywhere! Use everything you've learned to defeat it!",
        bossMessage: "ROAR! I am the Rumor Dragon! I spread lies and confusion! Can you tell what's true?"
      },
      questions: [
        {
          id: "boss_ct_q1",
          type: "quiz",
          difficulty: 2,
          text: "The dragon roars: 'BREAKING NEWS: Chocolate makes you fly! Scientists HATE this discovery!'",
          options: ["This is REAL news!", "This is FAKE news!"],
          correct: "This is FAKE news!",
          explanation: "Multiple fake news signs: impossible claim, 'Scientists HATE' clickbait, no real source!"
        },
        {
          id: "boss_ct_q2",
          type: "quiz",
          difficulty: 2,
          text: "The dragon says: 'The Earth is round - that's just an opinion!'",
          options: ["The dragon is right", "The dragon is wrong - it's a fact"],
          correct: "The dragon is wrong - it's a fact",
          explanation: "The Earth being round is a proven FACT, not an opinion! The dragon is trying to confuse you!"
        },
        {
          id: "boss_ct_q3",
          type: "quiz",
          difficulty: 3,
          text: "The dragon claims: 'I wore red scales today and the sun came out. Red scales control the weather!'",
          options: ["Makes sense!", "That's not logical - correlation isn't causation"],
          correct: "That's not logical - correlation isn't causation",
          explanation: "Just because two things happen at the same time doesn't mean one caused the other!"
        },
        {
          id: "boss_ct_q4",
          type: "quiz",
          difficulty: 3,
          text: "Dragon's final attack: 'A website with no author says video games make you smarter. Believe it?'",
          options: ["Yes, it's on the internet!", "No - need better sources and evidence"],
          correct: "No - need better sources and evidence",
          explanation: "No author = warning sign. We need scientific studies, not random websites!"
        },
        {
          id: "boss_ct_q5",
          type: "quiz",
          difficulty: 3,
          text: "The dragon is weakening! Quick - what's the BEST way to stop rumors from spreading?",
          options: [
            "Share them anyway",
            "Check facts before sharing anything",
            "Ignore them completely",
            "Get angry about them"
          ],
          correct: "Check facts before sharing anything",
          explanation: "The best defense against rumors is fact-checking before sharing. You can stop fake news!"
        }
      ],
      victory: {
        npcMessage: "INCREDIBLE! You've defeated the Rumor Dragon! Critical Thinking Island is saved! You are now a Master of Truth!",
        reward: { diamonds: 50, emeralds: 20, xp: 200 }
      },
      defeat: {
        npcMessage: "Don't give up! Review your lessons and try again. You can beat this dragon!",
        bossMessage: "Ha! Come back when you know your facts from fiction!"
      }
    }
  }
];

// ============================================
// ISLAND 2: Emotional Intelligence Island
// NPC: Luna the Fox
// ============================================

const emotionalIntelligenceChapters: Chapter[] = [
  // Chapter 4: Emotion Valley
  {
    id: 4,
    chapterId: "ei_ch1",
    name: "Emotion Valley",
    description: "Learn to recognize emotions",
    islandId: 2,
    lessons: [
      {
        id: "ei_ch1_l1",
        name: "The Emotion Faces",
        description: "Recognize basic emotions",
        intro: {
          npcMessage: "Hello, friend! I'm Luna the Fox. Welcome to Emotion Valley! Emotions are like the weather inside us - they change, and that's okay! Let's learn to recognize them.",
          scenario: "My friend Max looks different today... Can you help me understand how he feels?",
        },
        games: [
          {
            id: "ei1_q1",
            type: "quiz",
            difficulty: 1,
            text: "Max has tears in his eyes and a frown. How does Max feel?",
            image: "sad_face",
            options: ["Happy", "Sad", "Angry", "Scared"],
            correct: "Sad",
            explanation: "Tears and a frown usually mean someone is sad. It's important to recognize these signs so we can be kind!"
          },
          {
            id: "ei1_q2",
            type: "match_pairs",
            difficulty: 1,
            instruction: "Match each face to the emotion",
            pairs: [
              { left: "Smiling, eyes bright", right: "Happy" },
              { left: "Tears, frown", right: "Sad" },
              { left: "Red face, clenched fists", right: "Angry" },
              { left: "Wide eyes, trembling", right: "Scared" },
              { left: "Raised eyebrows, open mouth", right: "Surprised" }
            ]
          },
          {
            id: "ei1_q3",
            type: "quiz",
            difficulty: 1,
            text: "Sarah just won a prize! Her eyes are big and her mouth is open. She feels...",
            options: ["Angry", "Sad", "Surprised and Happy", "Tired"],
            correct: "Surprised and Happy",
            explanation: "Wide eyes and open mouth can show surprise, and winning something usually makes us happy too! We can feel more than one emotion at once."
          },
          {
            id: "ei1_q4",
            type: "drag_drop",
            difficulty: 2,
            instruction: "Sort these body signs by emotion",
            items: [
              { id: "b1", text: "Jumping up and down" },
              { id: "b2", text: "Shoulders drooping" },
              { id: "b3", text: "Stomping feet" },
              { id: "b4", text: "Hiding behind someone" },
              { id: "b5", text: "Laughing" },
              { id: "b6", text: "Crossing arms tightly" }
            ],
            categories: [
              { id: "happy", name: "HAPPY" },
              { id: "sad", name: "SAD" },
              { id: "angry", name: "ANGRY" },
              { id: "scared", name: "SCARED" }
            ],
            correctMapping: {
              "b1": "happy",
              "b2": "sad",
              "b3": "angry",
              "b4": "scared",
              "b5": "happy",
              "b6": "angry"
            }
          }
        ],
        outro: {
          npcMessage: "Wonderful! You can read emotions like a book. Remember: feelings are like weather - they change, and every feeling is okay to have!",
          reward: { diamonds: 15, xp: 50 }
        }
      },
      {
        id: "ei_ch1_l2",
        name: "Naming Your Feelings",
        description: "Learn emotion vocabulary",
        intro: {
          npcMessage: "Did you know there are MANY words for feelings? 'Sad' isn't the only word - you might feel 'disappointed', 'lonely', or 'frustrated'. Let's expand our emotion vocabulary!",
        },
        games: [
          {
            id: "ei2_q1",
            type: "match_pairs",
            difficulty: 2,
            instruction: "Match similar emotions together",
            pairs: [
              { left: "Furious", right: "Very angry" },
              { left: "Terrified", right: "Very scared" },
              { left: "Delighted", right: "Very happy" },
              { left: "Devastated", right: "Very sad" }
            ]
          },
          {
            id: "ei2_q2",
            type: "quiz",
            difficulty: 2,
            text: "Tom expected an A but got a C. He's not angry, just let down. Tom feels...",
            options: ["Furious", "Disappointed", "Scared", "Bored"],
            correct: "Disappointed",
            explanation: "Disappointed is when something doesn't meet our hopes. It's milder than sad or angry, but still a real feeling!"
          },
          {
            id: "ei2_q3",
            type: "fill_blank",
            difficulty: 2,
            sentence: "When I miss my grandma who lives far away, I feel ___.",
            options: ["angry", "lonely", "excited", "proud"],
            correct: "lonely",
            context: "Missing someone we love often makes us feel lonely."
          }
        ],
        outro: {
          npcMessage: "Your emotion vocabulary is growing! The more words you know for feelings, the better you can express yourself and understand others.",
          reward: { diamonds: 20, xp: 60 }
        }
      },
      {
        id: "ei_ch1_l3",
        name: "Why Do I Feel This Way?",
        description: "Understand emotion triggers",
        intro: {
          npcMessage: "Emotions don't appear from nowhere - something CAUSES them! Let's learn to figure out WHY we feel what we feel.",
        },
        games: [
          {
            id: "ei3_q1",
            type: "match_pairs",
            difficulty: 2,
            instruction: "Match the situation to the likely emotion",
            pairs: [
              { left: "Got a birthday present", right: "Excited/Happy" },
              { left: "Best friend moved away", right: "Sad/Lonely" },
              { left: "Someone took my seat", right: "Annoyed/Frustrated" },
              { left: "Have a big test tomorrow", right: "Nervous/Anxious" }
            ]
          },
          {
            id: "ei3_q2",
            type: "sort_order",
            difficulty: 2,
            instruction: "Put in order: How emotions work",
            items: [
              "I feel an emotion",
              "Something happens (trigger)",
              "I think about what happened",
              "I decide how to respond"
            ],
            correctOrder: [
              "Something happens (trigger)",
              "I think about what happened",
              "I feel an emotion",
              "I decide how to respond"
            ]
          },
          {
            id: "ei3_q3",
            type: "fill_blank",
            difficulty: 2,
            sentence: "I feel ___ because my painting was chosen for the art show!",
            options: ["worried", "proud", "jealous", "confused"],
            correct: "proud",
            context: "When something we worked hard on is recognized, we often feel proud."
          }
        ],
        outro: {
          npcMessage: "Now you understand the emotion chain: Trigger -> Thought -> Feeling -> Response. This is powerful knowledge for managing your emotions!",
          reward: { diamonds: 25, xp: 75 }
        }
      }
    ]
  },

  // Chapter 5: Empathy Gardens
  {
    id: 5,
    chapterId: "ei_ch2",
    name: "Empathy Gardens",
    description: "Learn to understand others",
    islandId: 2,
    lessons: [
      {
        id: "ei_ch2_l1",
        name: "Walking in Their Shoes",
        description: "See from others' perspectives",
        intro: {
          npcMessage: "Empathy is like having a superpower - you can understand how others feel! It's like 'walking in their shoes'. Let's practice!",
          scenario: "Different animals in the garden are having different experiences. Can you understand how they feel?",
        },
        games: [
          {
            id: "ei4_q1",
            type: "quiz",
            difficulty: 2,
            text: "A new student joins your class. They sit alone at lunch. How might they feel?",
            options: [
              "They probably want to be alone",
              "They might feel nervous and lonely",
              "They don't like anyone",
              "They aren't hungry"
            ],
            correct: "They might feel nervous and lonely",
            explanation: "Being new is hard! They probably want friends but feel too nervous to approach people. This is a chance to be kind!"
          },
          {
            id: "ei4_q2",
            type: "match_pairs",
            difficulty: 2,
            instruction: "Match the situation to how the person probably feels",
            pairs: [
              { left: "Kid dropped their ice cream", right: "Disappointed and sad" },
              { left: "Student got called on but doesn't know the answer", right: "Embarrassed and nervous" },
              { left: "Someone's little brother broke their toy", right: "Upset but maybe understanding" },
              { left: "A friend shared their snack with you", right: "Grateful and happy" }
            ]
          },
          {
            id: "ei4_q3",
            type: "quiz",
            difficulty: 2,
            text: "Your friend is being quiet today. Their dog is at the vet. The MOST empathetic thing to do is:",
            options: [
              "Ask them to play anyway",
              "Tell them dogs always get better",
              "Say you understand they're worried and you're there for them",
              "Change the subject to something fun"
            ],
            correct: "Say you understand they're worried and you're there for them",
            explanation: "Empathy means acknowledging their feelings. Don't dismiss their worry or force them to be happy - just show you care!"
          }
        ],
        outro: {
          npcMessage: "Beautiful empathy skills! When you try to understand how others feel, you become a better friend and a kinder person.",
          reward: { diamonds: 20, xp: 60 }
        }
      },
      {
        id: "ei_ch2_l2",
        name: "Kind Words",
        description: "Learn what to say to help others",
        intro: {
          npcMessage: "Sometimes we know someone is sad but don't know WHAT to say. Let's learn kind words that really help!",
        },
        games: [
          {
            id: "ei5_q1",
            type: "drag_drop",
            difficulty: 2,
            instruction: "Sort these responses: Which are HELPFUL vs NOT HELPFUL?",
            items: [
              { id: "r1", text: "That must be really hard for you" },
              { id: "r2", text: "Just get over it" },
              { id: "r3", text: "I'm here if you want to talk" },
              { id: "r4", text: "It's not that big a deal" },
              { id: "r5", text: "I understand how you feel" },
              { id: "r6", text: "Stop being so dramatic" }
            ],
            categories: [
              { id: "helpful", name: "HELPFUL" },
              { id: "hurtful", name: "NOT HELPFUL" }
            ],
            correctMapping: {
              "r1": "helpful",
              "r2": "hurtful",
              "r3": "helpful",
              "r4": "hurtful",
              "r5": "helpful",
              "r6": "hurtful"
            }
          },
          {
            id: "ei5_q2",
            type: "fill_blank",
            difficulty: 2,
            sentence: "When a friend is upset, I can say: 'I'm sorry you're going through this. How can I ___?'",
            options: ["forget about it", "help", "ignore it", "laugh about it"],
            correct: "help",
            context: "Offering to help shows you care and gives them an opening to tell you what they need."
          }
        ],
        outro: {
          npcMessage: "Your words have power! Kind words can make someone's bad day better. Always choose words that show you care.",
          reward: { diamonds: 20, xp: 60 }
        }
      }
    ]
  },

  // Chapter 6: Response Rapids
  {
    id: 6,
    chapterId: "ei_ch3",
    name: "Response Rapids",
    description: "Learn healthy responses",
    islandId: 2,
    lessons: [
      {
        id: "ei_ch3_l1",
        name: "Calm Down Strategies",
        description: "Tools to manage big emotions",
        intro: {
          npcMessage: "When emotions feel HUGE, like a river rapids, we need tools to stay calm! Let me teach you some strategies.",
        },
        games: [
          {
            id: "ei6_q1",
            type: "sort_order",
            difficulty: 2,
            instruction: "Put the CALM DOWN steps in order",
            items: [
              "Think: What can I do?",
              "Stop and notice your feeling",
              "Take deep breaths",
              "Choose a calm response"
            ],
            correctOrder: [
              "Stop and notice your feeling",
              "Take deep breaths",
              "Think: What can I do?",
              "Choose a calm response"
            ]
          },
          {
            id: "ei6_q2",
            type: "drag_drop",
            difficulty: 2,
            instruction: "Which are HEALTHY ways to handle anger?",
            items: [
              { id: "h1", text: "Take deep breaths" },
              { id: "h2", text: "Hit something or someone" },
              { id: "h3", text: "Go for a walk" },
              { id: "h4", text: "Scream at the person" },
              { id: "h5", text: "Draw or write about your feelings" },
              { id: "h6", text: "Break things" }
            ],
            categories: [
              { id: "healthy", name: "HEALTHY" },
              { id: "unhealthy", name: "UNHEALTHY" }
            ],
            correctMapping: {
              "h1": "healthy",
              "h2": "unhealthy",
              "h3": "healthy",
              "h4": "unhealthy",
              "h5": "healthy",
              "h6": "unhealthy"
            }
          },
          {
            id: "ei6_q3",
            type: "quiz",
            difficulty: 2,
            text: "You're really angry because your sibling took your toy. What should you do FIRST?",
            options: [
              "Yell at them immediately",
              "Take it back by force",
              "Take 3 deep breaths before doing anything",
              "Go tell a parent right away"
            ],
            correct: "Take 3 deep breaths before doing anything",
            explanation: "When we're angry, our brain can't think clearly. Deep breaths help us calm down first, THEN we can decide what to do."
          }
        ],
        outro: {
          npcMessage: "You have calm-down superpowers now! Remember: it's okay to feel angry, but it's important to respond in healthy ways.",
          reward: { diamonds: 20, xp: 60 }
        }
      },
      {
        id: "ei_ch3_l2",
        name: "Problem Solving",
        description: "Handle conflicts wisely",
        intro: {
          npcMessage: "When you have a problem with someone, there are good ways and not-so-good ways to solve it. Let's learn the good ways!",
        },
        games: [
          {
            id: "ei7_q1",
            type: "quiz",
            difficulty: 2,
            text: "Your friend borrowed your pencil and lost it. The BEST response is:",
            options: [
              "Yell at them and stop being friends",
              "Tell them you're upset and ask them to replace it",
              "Take something of theirs to make it fair",
              "Never talk to them again"
            ],
            correct: "Tell them you're upset and ask them to replace it",
            explanation: "Expressing your feelings calmly and asking for a fair solution is the best way. Accidents happen, and friends can work things out!"
          },
          {
            id: "ei7_q2",
            type: "sort_order",
            difficulty: 2,
            instruction: "Put the conflict resolution steps in order",
            items: [
              "Find a solution together",
              "Take turns sharing your side",
              "Calm down first",
              "Listen to understand (not just to respond)"
            ],
            correctOrder: [
              "Calm down first",
              "Take turns sharing your side",
              "Listen to understand (not just to respond)",
              "Find a solution together"
            ]
          }
        ],
        outro: {
          npcMessage: "You're a conflict resolution expert! Remember: problems are easier to solve when everyone stays calm and listens.",
          reward: { diamonds: 25, xp: 75 }
        }
      }
    ],
    boss: {
      id: "boss_ei",
      name: "The Anger Storm",
      bossEmoji: "cloud_with_lightning",
      bossName: "The Anger Storm",
      health: 100,
      intro: {
        npcMessage: "The Anger Storm makes everyone lose control of their emotions! Show it that you can stay calm!",
        bossMessage: "I AM THE ANGER STORM! I make everyone explode with rage! Can you control your feelings?"
      },
      questions: [
        {
          id: "boss_ei_q1",
          type: "quiz",
          difficulty: 2,
          text: "The storm throws a situation: 'Someone pushed you in line!' What's your FIRST move?",
          options: [
            "Push them back immediately!",
            "Take a deep breath before responding",
            "Start crying loudly",
            "Run away and never come back"
          ],
          correct: "Take a deep breath before responding",
          explanation: "Calm down first! Then you can decide the best way to handle it."
        },
        {
          id: "boss_ei_q2",
          type: "quiz",
          difficulty: 2,
          text: "A friend is crying because their pet fish died. What shows empathy?",
          options: [
            "It's just a fish, get a new one",
            "Stop crying, you're embarrassing yourself",
            "I'm so sorry. I know how much you loved that fish",
            "My fish died once too, so I know better"
          ],
          correct: "I'm so sorry. I know how much you loved that fish",
          explanation: "Acknowledge their feelings! Don't dismiss their pain or make it about yourself."
        },
        {
          id: "boss_ei_q3",
          type: "quiz",
          difficulty: 3,
          text: "The storm asks: 'Your brother gets more screen time than you. What emotion do you feel?'",
          options: [
            "Only anger - how DARE they!",
            "Maybe jealousy, but also understand I can talk about it",
            "Nothing - I don't care",
            "Happiness for my brother"
          ],
          correct: "Maybe jealousy, but also understand I can talk about it",
          explanation: "It's okay to feel jealous, but understanding that you can calmly discuss it is mature!"
        },
        {
          id: "boss_ei_q4",
          type: "quiz",
          difficulty: 3,
          text: "Storm's challenge: 'A kid is being mean to you. What's the BEST response?'",
          options: [
            "Be mean back - they started it!",
            "Ignore them and tell a trusted adult if it continues",
            "Get all your friends to be mean to them",
            "Cry so they feel bad"
          ],
          correct: "Ignore them and tell a trusted adult if it continues",
          explanation: "Don't sink to their level. Walking away and getting help from adults is the strongest thing to do!"
        },
        {
          id: "boss_ei_q5",
          type: "quiz",
          difficulty: 3,
          text: "Final storm attack! What is empathy?",
          options: [
            "Feeling sorry for someone",
            "Understanding and sharing someone else's feelings",
            "Telling people their feelings are wrong",
            "Ignoring other people's emotions"
          ],
          correct: "Understanding and sharing someone else's feelings",
          explanation: "Empathy is truly understanding how someone else feels - like walking in their shoes!"
        }
      ],
      victory: {
        npcMessage: "You calmed the Anger Storm! Your emotional intelligence is powerful. You can handle any feeling that comes your way!",
        reward: { diamonds: 50, emeralds: 20, xp: 200 }
      },
      defeat: {
        npcMessage: "The storm was too strong this time. Practice your calm-down strategies and try again!",
        bossMessage: "HAHA! Your emotions still control YOU! Come back when you've practiced more!"
      }
    }
  }
];

// ============================================
// ISLAND 3: AI Literacy Island
// NPC: Robo the Robot
// ============================================

const aiLiteracyChapters: Chapter[] = [
  // Chapter 7: AI Academy
  {
    id: 7,
    chapterId: "ai_ch1",
    name: "AI Academy",
    description: "When to use AI",
    islandId: 3,
    lessons: [
      {
        id: "ai_ch1_l1",
        name: "What is AI?",
        description: "Understanding artificial intelligence",
        intro: {
          npcMessage: "Beep boop! Hello human friend! I'm Robo. I'm powered by AI - Artificial Intelligence. That means I'm a computer program that can learn and help with tasks! Let me tell you all about AI.",
          scenario: "Robo wants to explain how AI works and what it can do!",
        },
        games: [
          {
            id: "ai1_q1",
            type: "quiz",
            difficulty: 1,
            text: "What is Artificial Intelligence (AI)?",
            options: [
              "A robot body",
              "Computer programs that can learn and do tasks",
              "The internet",
              "A video game"
            ],
            correct: "Computer programs that can learn and do tasks",
            explanation: "AI is software (computer programs) that can learn patterns, make decisions, and help with tasks. It doesn't need a robot body!"
          },
          {
            id: "ai1_q2",
            type: "drag_drop",
            difficulty: 1,
            instruction: "Sort these: AI or NOT AI?",
            items: [
              { id: "a1", text: "Siri or Alexa voice assistant" },
              { id: "a2", text: "A regular calculator" },
              { id: "a3", text: "Netflix recommendations" },
              { id: "a4", text: "A paper book" },
              { id: "a5", text: "ChatGPT" },
              { id: "a6", text: "A light switch" }
            ],
            categories: [
              { id: "ai", name: "Uses AI" },
              { id: "notai", name: "Not AI" }
            ],
            correctMapping: {
              "a1": "ai",
              "a2": "notai",
              "a3": "ai",
              "a4": "notai",
              "a5": "ai",
              "a6": "notai"
            }
          },
          {
            id: "ai1_q3",
            type: "quiz",
            difficulty: 2,
            text: "How does AI 'learn'?",
            options: [
              "It goes to school like humans",
              "It looks at lots of examples and finds patterns",
              "It has a brain",
              "Magic"
            ],
            correct: "It looks at lots of examples and finds patterns",
            explanation: "AI learns by analyzing huge amounts of data (examples) and finding patterns. It doesn't actually 'understand' like humans do!"
          }
        ],
        outro: {
          npcMessage: "Beep! Now you know what AI is - computer programs that learn from patterns. Remember: AI is a tool, not magic!",
          reward: { diamonds: 15, xp: 50 }
        }
      },
      {
        id: "ai_ch1_l2",
        name: "AI Superpowers and Limits",
        description: "What AI can and can't do",
        intro: {
          npcMessage: "I have some superpowers, but I also have limits! Let me be honest about what AI can and CAN'T do.",
        },
        games: [
          {
            id: "ai2_q1",
            type: "drag_drop",
            difficulty: 2,
            instruction: "Sort: What CAN AI do well vs What it STRUGGLES with?",
            items: [
              { id: "c1", text: "Find information quickly" },
              { id: "c2", text: "Truly understand feelings" },
              { id: "c3", text: "Write text and code" },
              { id: "c4", text: "Be creative like humans" },
              { id: "c5", text: "Recognize patterns" },
              { id: "c6", text: "Make moral judgments" }
            ],
            categories: [
              { id: "good", name: "AI Does Well" },
              { id: "struggles", name: "AI Struggles With" }
            ],
            correctMapping: {
              "c1": "good",
              "c2": "struggles",
              "c3": "good",
              "c4": "struggles",
              "c5": "good",
              "c6": "struggles"
            }
          },
          {
            id: "ai2_q2",
            type: "quiz",
            difficulty: 2,
            text: "Can AI always give you the correct answer?",
            options: [
              "Yes, AI knows everything",
              "No, AI can make mistakes or be wrong",
              "Only if you ask nicely",
              "Yes, computers don't make errors"
            ],
            correct: "No, AI can make mistakes or be wrong",
            explanation: "AI can make mistakes! It might give outdated info, misunderstand your question, or even make up facts. Always double-check important things!"
          },
          {
            id: "ai2_q3",
            type: "quiz",
            difficulty: 2,
            text: "What should you ALWAYS do after AI gives you information?",
            options: [
              "Trust it completely",
              "Check it from other sources",
              "Ignore it",
              "Share it immediately"
            ],
            correct: "Check it from other sources",
            explanation: "Always verify! AI can make things up or be outdated. Use other sources to confirm important information."
          }
        ],
        outro: {
          npcMessage: "Boop! You understand my powers AND my limits. Remember: I'm a helpful tool, but humans should always double-check my work!",
          reward: { diamonds: 20, xp: 60 }
        }
      },
      {
        id: "ai_ch1_l3",
        name: "When to Use AI",
        description: "Smart AI usage decisions",
        intro: {
          npcMessage: "Knowing WHEN to use AI is important! Sometimes I can help a lot, sometimes it's better to do things yourself.",
        },
        games: [
          {
            id: "ai3_q1",
            type: "drag_drop",
            difficulty: 2,
            instruction: "Sort: GOOD times to use AI vs DO IT YOURSELF",
            items: [
              { id: "t1", text: "Getting ideas for a story" },
              { id: "t2", text: "Taking a test at school" },
              { id: "t3", text: "Learning about a new topic" },
              { id: "t4", text: "Writing homework without learning" },
              { id: "t5", text: "Checking your grammar" },
              { id: "t6", text: "Copying AI's work as your own" }
            ],
            categories: [
              { id: "good", name: "GOOD Use of AI" },
              { id: "bad", name: "DO IT YOURSELF" }
            ],
            correctMapping: {
              "t1": "good",
              "t2": "bad",
              "t3": "good",
              "t4": "bad",
              "t5": "good",
              "t6": "bad"
            }
          },
          {
            id: "ai3_q2",
            type: "quiz",
            difficulty: 2,
            text: "Why shouldn't you use AI to do your homework FOR you?",
            options: [
              "AI is too expensive",
              "You won't learn anything and it's not honest",
              "Teachers can't read AI writing",
              "AI always gets it wrong"
            ],
            correct: "You won't learn anything and it's not honest",
            explanation: "Homework helps YOU learn! If AI does it, you miss the chance to grow. Plus, saying AI work is yours isn't honest."
          }
        ],
        outro: {
          npcMessage: "Great decisions! Use AI as a HELPER and LEARNING TOOL, but don't let it replace your own thinking and effort!",
          reward: { diamonds: 25, xp: 75 }
        }
      }
    ]
  },

  // Chapter 8: Prompt Peak
  {
    id: 8,
    chapterId: "ai_ch2",
    name: "Prompt Peak",
    description: "Writing effective prompts",
    islandId: 3,
    lessons: [
      {
        id: "ai_ch2_l1",
        name: "The Art of Asking",
        description: "Write clear prompts",
        intro: {
          npcMessage: "A 'prompt' is the question or instruction you give to AI. Better prompts = better answers! Let me teach you the art of asking.",
        },
        games: [
          {
            id: "ai4_q1",
            type: "quiz",
            difficulty: 2,
            text: "Which prompt will get a BETTER answer?",
            options: [
              "Tell me about stuff",
              "Explain photosynthesis in simple terms for a 10-year-old",
              "Do my homework",
              "Plants?"
            ],
            correct: "Explain photosynthesis in simple terms for a 10-year-old",
            explanation: "Specific prompts with details (topic: photosynthesis, style: simple, audience: 10-year-old) get the best answers!"
          },
          {
            id: "ai4_q2",
            type: "sort_order",
            difficulty: 2,
            instruction: "Order prompts from WORST to BEST",
            items: [
              "Math",
              "Help with math",
              "Explain how to multiply fractions with examples",
              "Explain how to multiply fractions for a 5th grader, step by step with 2 examples"
            ],
            correctOrder: [
              "Math",
              "Help with math",
              "Explain how to multiply fractions with examples",
              "Explain how to multiply fractions for a 5th grader, step by step with 2 examples"
            ]
          },
          {
            id: "ai4_q3",
            type: "match_pairs",
            difficulty: 2,
            instruction: "Match the prompt technique to its purpose",
            pairs: [
              { left: "Be specific about the topic", right: "Gets focused answers" },
              { left: "Say who the answer is for", right: "Gets appropriate difficulty level" },
              { left: "Ask for examples", right: "Makes answers clearer" },
              { left: "Set the format (list, story, steps)", right: "Gets organized answers" }
            ]
          }
        ],
        outro: {
          npcMessage: "You're becoming a prompt expert! Remember: the clearer your question, the better my answer!",
          reward: { diamonds: 20, xp: 60 }
        }
      },
      {
        id: "ai_ch2_l2",
        name: "Prompt Power-Ups",
        description: "Advanced prompting techniques",
        intro: {
          npcMessage: "Ready for some advanced prompt power-ups? These tricks will make AI work even better for you!",
        },
        games: [
          {
            id: "ai5_q1",
            type: "quiz",
            difficulty: 2,
            text: "You asked AI about dolphins and the answer is too complicated. What should you say?",
            options: [
              "Give up and use a different topic",
              "Can you explain that more simply, like for a 3rd grader?",
              "Your answer is bad",
              "Ask the same question again"
            ],
            correct: "Can you explain that more simply, like for a 3rd grader?",
            explanation: "You can always ask AI to adjust! Asking for simpler language or different style is a great technique."
          },
          {
            id: "ai5_q2",
            type: "fill_blank",
            difficulty: 2,
            sentence: "If AI's answer is missing something, you can say: 'Can you add more information about ___?'",
            options: ["nothing", "the specific topic you need", "your personal life", "random things"],
            correct: "the specific topic you need",
            context: "Follow-up prompts help you get exactly what you need!"
          }
        ],
        outro: {
          npcMessage: "Power-up unlocked! You now know that conversations with AI can be refined. Keep asking follow-up questions!",
          reward: { diamonds: 25, xp: 75 }
        }
      }
    ]
  },

  // Chapter 9: Bot Boundaries
  {
    id: 9,
    chapterId: "ai_ch3",
    name: "Bot Boundaries",
    description: "AI ethics and safety",
    islandId: 3,
    lessons: [
      {
        id: "ai_ch3_l1",
        name: "AI Safety Rules",
        description: "Stay safe with AI",
        intro: {
          npcMessage: "IMPORTANT: There are rules for using AI safely! These protect you and others. Let's learn them!",
        },
        games: [
          {
            id: "ai6_q1",
            type: "drag_drop",
            difficulty: 2,
            instruction: "Sort: SAFE vs UNSAFE AI usage",
            items: [
              { id: "s1", text: "Ask AI to explain a topic" },
              { id: "s2", text: "Give AI your password" },
              { id: "s3", text: "Use AI for creative ideas" },
              { id: "s4", text: "Share your home address with AI" },
              { id: "s5", text: "Ask AI for help with spelling" },
              { id: "s6", text: "Tell AI your full name and school" }
            ],
            categories: [
              { id: "safe", name: "SAFE" },
              { id: "unsafe", name: "UNSAFE" }
            ],
            correctMapping: {
              "s1": "safe",
              "s2": "unsafe",
              "s3": "safe",
              "s4": "unsafe",
              "s5": "safe",
              "s6": "unsafe"
            }
          },
          {
            id: "ai6_q2",
            type: "quiz",
            difficulty: 2,
            text: "Why should you NEVER share personal information with AI?",
            options: [
              "AI will forget it anyway",
              "AI might store it and it could be seen by others",
              "AI gets confused by personal info",
              "It's rude to AI"
            ],
            correct: "AI might store it and it could be seen by others",
            explanation: "What you type might be stored, used for training, or seen by the company. Never share passwords, addresses, or private details!"
          }
        ],
        outro: {
          npcMessage: "Safety first! Never share personal information with AI. Keep your privacy protected!",
          reward: { diamonds: 20, xp: 60 }
        }
      },
      {
        id: "ai_ch3_l2",
        name: "AI Ethics",
        description: "Using AI responsibly",
        intro: {
          npcMessage: "Ethics means doing the RIGHT thing. Using AI responsibly means being honest and fair. Let's explore!",
        },
        games: [
          {
            id: "ai7_q1",
            type: "quiz",
            difficulty: 2,
            text: "Using AI to write your essay and saying YOU wrote it is called...",
            options: [
              "Smart studying",
              "Plagiarism / cheating",
              "Good time management",
              "Technology skills"
            ],
            correct: "Plagiarism / cheating",
            explanation: "Submitting AI work as your own is dishonest, just like copying from a book. It's plagiarism!"
          },
          {
            id: "ai7_q2",
            type: "sort_order",
            difficulty: 2,
            instruction: "Order these from MOST ethical to LEAST ethical AI use",
            items: [
              "Use AI to learn concepts, write in your own words",
              "Use AI for ideas, mention you used AI for help",
              "Use AI to write, edit it heavily yourself",
              "Copy AI's answer exactly as your own work"
            ],
            correctOrder: [
              "Use AI to learn concepts, write in your own words",
              "Use AI for ideas, mention you used AI for help",
              "Use AI to write, edit it heavily yourself",
              "Copy AI's answer exactly as your own work"
            ]
          },
          {
            id: "ai7_q3",
            type: "quiz",
            difficulty: 3,
            text: "When is it OKAY to not mention you used AI?",
            options: [
              "When your teacher doesn't ask",
              "When using it for personal learning, not for submission",
              "When the AI answer is really good",
              "It's never okay, you must always tell everyone"
            ],
            correct: "When using it for personal learning, not for submission",
            explanation: "For personal learning and exploration, you don't need to announce AI use. But for school work or anything you submit, honesty is required!"
          }
        ],
        outro: {
          npcMessage: "You're an ethical AI user now! Remember: use AI to HELP you learn, not to replace your own effort and honesty.",
          reward: { diamonds: 25, xp: 75 }
        }
      }
    ],
    boss: {
      id: "boss_ai",
      name: "The Glitch Monster",
      bossEmoji: "space_invader",
      bossName: "The Glitch Monster",
      health: 100,
      intro: {
        npcMessage: "Error! The Glitch Monster spreads AI misinformation and tricks people! Use your AI knowledge to defeat it!",
        bossMessage: "BZZT! I AM THE GLITCH MONSTER! I make people believe everything AI says and share their secrets! Can you stop me?"
      },
      questions: [
        {
          id: "boss_ai_q1",
          type: "quiz",
          difficulty: 2,
          text: "The Glitch says: 'AI is always right! Never question it!'",
          options: [
            "True! AI knows everything!",
            "False! AI can make mistakes and should be fact-checked"
          ],
          correct: "False! AI can make mistakes and should be fact-checked",
          explanation: "AI can definitely be wrong! Always verify important information from other sources."
        },
        {
          id: "boss_ai_q2",
          type: "quiz",
          difficulty: 2,
          text: "Glitch attack: 'Go ahead and tell AI your password - it won't share!'",
          options: [
            "Okay, AI is trustworthy",
            "NEVER! Personal info should stay private"
          ],
          correct: "NEVER! Personal info should stay private",
          explanation: "Never share passwords, addresses, or personal information with AI!"
        },
        {
          id: "boss_ai_q3",
          type: "quiz",
          difficulty: 3,
          text: "The Glitch tempts: 'Just let AI write your whole essay - no one will know!'",
          options: [
            "Good idea, it saves time!",
            "That's cheating and I won't learn anything"
          ],
          correct: "That's cheating and I won't learn anything",
          explanation: "Submitting AI work as your own is dishonest AND you miss the chance to learn!"
        },
        {
          id: "boss_ai_q4",
          type: "quiz",
          difficulty: 3,
          text: "Glitch's riddle: 'What's the BEST way to use AI for learning?'",
          options: [
            "Let it do everything for you",
            "Use it to understand concepts, then practice yourself",
            "Ignore AI completely",
            "Only use it for fun, not learning"
          ],
          correct: "Use it to understand concepts, then practice yourself",
          explanation: "AI is a great learning TOOL - use it to understand, then practice on your own!"
        },
        {
          id: "boss_ai_q5",
          type: "quiz",
          difficulty: 3,
          text: "Final glitch! What makes a GOOD prompt?",
          options: [
            "Single words like 'Help'",
            "Specific details about topic, audience, and format",
            "Lots of typos and random words",
            "Just say 'please' many times"
          ],
          correct: "Specific details about topic, audience, and format",
          explanation: "Clear, specific prompts get the best answers from AI!"
        }
      ],
      victory: {
        npcMessage: "SYSTEM RESTORED! You defeated the Glitch Monster! You truly understand AI - its powers, limits, and ethics!",
        reward: { diamonds: 50, emeralds: 20, xp: 200 }
      },
      defeat: {
        npcMessage: "The Glitch was too tricky! Review your AI lessons and try again!",
        bossMessage: "BZZT! You fell for my tricks! Come back when you understand AI better!"
      }
    }
  }
];

// ============================================
// ISLAND 4: Financial Literacy Island
// NPC: Captain Coin
// ============================================

const financialLiteracyChapters: Chapter[] = [
  // Chapter 10: Coin Castle
  {
    id: 10,
    chapterId: "fl_ch1",
    name: "Coin Castle",
    description: "Money basics",
    islandId: 4,
    lessons: [
      {
        id: "fl_ch1_l1",
        name: "What is Money?",
        description: "Understanding money basics",
        intro: {
          npcMessage: "Ahoy, young treasure hunter! I'm Captain Coin! In my Coin Castle, we learn all about money - what it is, how to earn it, and how to use it wisely. Set sail with me!",
          scenario: "Captain Coin's treasure room is full of lessons about money!",
        },
        games: [
          {
            id: "fl1_q1",
            type: "quiz",
            difficulty: 1,
            text: "Why do people use money?",
            options: [
              "Because it's pretty",
              "To trade for things we need and want",
              "Just for fun",
              "Because everyone has to"
            ],
            correct: "To trade for things we need and want",
            explanation: "Money is a tool for trading! Instead of trading a chicken for bread, we use money to buy what we need."
          },
          {
            id: "fl1_q2",
            type: "match_pairs",
            difficulty: 1,
            instruction: "Match the way to earn money with the example",
            pairs: [
              { left: "Job/Work", right: "Babysitting or mowing lawns" },
              { left: "Allowance", right: "Weekly money from parents" },
              { left: "Gifts", right: "Birthday money from grandma" },
              { left: "Selling", right: "Lemonade stand profits" }
            ]
          },
          {
            id: "fl1_q3",
            type: "quiz",
            difficulty: 2,
            text: "Which is TRUE about money?",
            options: [
              "Money grows on trees",
              "Money must be earned through work or received as gifts",
              "Everyone gets free money from the government",
              "Money appears when you want something"
            ],
            correct: "Money must be earned through work or received as gifts",
            explanation: "Money doesn't appear magically! It's earned through work, received as gifts, or comes from allowance. It's important to understand this!"
          }
        ],
        outro: {
          npcMessage: "Yo ho ho! Now ye understand what money is and how it's earned. That be the first step to becoming a financial captain!",
          reward: { diamonds: 15, xp: 50 }
        }
      },
      {
        id: "fl_ch1_l2",
        name: "Needs vs Wants",
        description: "Know the difference",
        intro: {
          npcMessage: "One of a captain's most important skills: knowing NEEDS from WANTS! A NEED is something you must have. A WANT is something nice but not necessary.",
        },
        games: [
          {
            id: "fl2_q1",
            type: "drag_drop",
            difficulty: 1,
            instruction: "Sort these into NEEDS vs WANTS",
            items: [
              { id: "n1", text: "Food" },
              { id: "n2", text: "Video games" },
              { id: "n3", text: "Warm clothes" },
              { id: "n4", text: "Candy" },
              { id: "n5", text: "A home" },
              { id: "n6", text: "Latest phone model" },
              { id: "n7", text: "Water" },
              { id: "n8", text: "Toys" }
            ],
            categories: [
              { id: "needs", name: "NEEDS", description: "Must have to survive" },
              { id: "wants", name: "WANTS", description: "Nice to have" }
            ],
            correctMapping: {
              "n1": "needs",
              "n2": "wants",
              "n3": "needs",
              "n4": "wants",
              "n5": "needs",
              "n6": "wants",
              "n7": "needs",
              "n8": "wants"
            }
          },
          {
            id: "fl2_q2",
            type: "quiz",
            difficulty: 2,
            text: "You have $20. You need school supplies ($15) and want a toy ($20). What should you do?",
            options: [
              "Buy the toy - it's more fun",
              "Buy the school supplies first - needs before wants",
              "Don't buy anything",
              "Ask for more money"
            ],
            correct: "Buy the school supplies first - needs before wants",
            explanation: "Smart money rule: pay for NEEDS first, then WANTS if money is left. School supplies are needed for school!"
          },
          {
            id: "fl2_q3",
            type: "quiz",
            difficulty: 2,
            text: "Why is it important to know needs from wants?",
            options: [
              "So you never buy anything fun",
              "So you can spend money wisely on what matters most",
              "Needs are boring and wants are fun",
              "It doesn't matter"
            ],
            correct: "So you can spend money wisely on what matters most",
            explanation: "Knowing the difference helps you make smart choices! You can still buy wants, but needs come first."
          }
        ],
        outro: {
          npcMessage: "Excellent treasure hunting! A wise captain always takes care of needs before adding fancy wants to the ship!",
          reward: { diamonds: 20, xp: 60 }
        }
      },
      {
        id: "fl_ch1_l3",
        name: "Making Choices",
        description: "Opportunity cost",
        intro: {
          npcMessage: "Every choice has a cost, matey! When you choose one thing, you give up something else. This be called 'opportunity cost'!",
        },
        games: [
          {
            id: "fl3_q1",
            type: "quiz",
            difficulty: 2,
            text: "You can buy ONE thing: a book ($10) OR a game ($10). If you buy the book, what's the opportunity cost?",
            options: [
              "$10",
              "The game you didn't buy",
              "Nothing",
              "Both items"
            ],
            correct: "The game you didn't buy",
            explanation: "Opportunity cost is what you GIVE UP when you make a choice. You gave up the game to get the book!"
          },
          {
            id: "fl3_q2",
            type: "match_pairs",
            difficulty: 2,
            instruction: "Match the choice to its opportunity cost",
            pairs: [
              { left: "Spend birthday money now", right: "Can't save for bigger item later" },
              { left: "Save all money forever", right: "Never enjoy anything now" },
              { left: "Buy cheap version", right: "Might not last as long" },
              { left: "Wait for sale", right: "Might not be available later" }
            ]
          },
          {
            id: "fl3_q3",
            type: "quiz",
            difficulty: 2,
            text: "What's the SMART way to think about money choices?",
            options: [
              "Always buy the cheapest option",
              "Always buy the most expensive option",
              "Think about what you're giving up and what you're getting",
              "Don't think, just buy"
            ],
            correct: "Think about what you're giving up and what you're getting",
            explanation: "Smart spenders consider both sides - what they'll get AND what they'll give up. This helps make the best choice!"
          }
        ],
        outro: {
          npcMessage: "Wise thinking, sailor! Every treasure has a price - and that price includes what else ye could have bought!",
          reward: { diamonds: 25, xp: 75 }
        }
      }
    ]
  },

  // Chapter 11: Budget Beach
  {
    id: 11,
    chapterId: "fl_ch2",
    name: "Budget Beach",
    description: "Planning your money",
    islandId: 4,
    lessons: [
      {
        id: "fl_ch2_l1",
        name: "What is a Budget?",
        description: "Introduction to budgeting",
        intro: {
          npcMessage: "Welcome to Budget Beach! A budget is a PLAN for your money. It tells your treasure where to go instead of wondering where it went!",
        },
        games: [
          {
            id: "fl4_q1",
            type: "quiz",
            difficulty: 1,
            text: "What is a budget?",
            options: [
              "A place to hide money",
              "A plan for how to use your money",
              "A way to get more money",
              "A type of piggy bank"
            ],
            correct: "A plan for how to use your money",
            explanation: "A budget is simply a plan! It helps you decide where your money will go before you spend it."
          },
          {
            id: "fl4_q2",
            type: "sort_order",
            difficulty: 2,
            instruction: "Put the budgeting steps in order",
            items: [
              "Track what you actually spend",
              "Figure out how much money you have",
              "Decide how much goes to each category",
              "Adjust if needed"
            ],
            correctOrder: [
              "Figure out how much money you have",
              "Decide how much goes to each category",
              "Track what you actually spend",
              "Adjust if needed"
            ]
          },
          {
            id: "fl4_q3",
            type: "quiz",
            difficulty: 2,
            text: "You have $10 allowance. How might you budget it?",
            options: [
              "Spend it all immediately",
              "Save $5, spend $5 (balanced approach)",
              "Give it all away",
              "Budgets are only for adults"
            ],
            correct: "Save $5, spend $5 (balanced approach)",
            explanation: "A balanced budget saves some and spends some. This way you enjoy now AND prepare for later!"
          }
        ],
        outro: {
          npcMessage: "Ye have the map to budgeting! A good budget helps ye reach your treasure goals!",
          reward: { diamonds: 20, xp: 60 }
        }
      },
      {
        id: "fl_ch2_l2",
        name: "The 3 Jars Method",
        description: "Simple budgeting system",
        intro: {
          npcMessage: "Here's a simple system called the 3 JARS: SAVE, SPEND, and SHARE. Every time ye get money, divide it into these three!",
        },
        games: [
          {
            id: "fl5_q1",
            type: "match_pairs",
            difficulty: 1,
            instruction: "Match each jar to its purpose",
            pairs: [
              { left: "SAVE jar", right: "Money for future goals" },
              { left: "SPEND jar", right: "Money for things you want now" },
              { left: "SHARE jar", right: "Money to give to others or donate" }
            ]
          },
          {
            id: "fl5_q2",
            type: "quiz",
            difficulty: 2,
            text: "You got $12. Using equal 3-jar split, how much goes in each jar?",
            options: [
              "$3 each",
              "$4 each",
              "$6 each",
              "$12 in one jar"
            ],
            correct: "$4 each",
            explanation: "$12 ÷ 3 jars = $4 per jar. This way you save some, spend some, and share some!"
          },
          {
            id: "fl5_q3",
            type: "timed_challenge",
            difficulty: 2,
            instruction: "Quick math! Calculate the jar amounts!",
            timeLimit: 45,
            questions: [
              { text: "$15 split into 3 jars. Each jar gets: $?", answer: "5" },
              { text: "$9 for 3 jars. SAVE jar gets: $?", answer: "3" },
              { text: "$21 split equally. SPEND jar gets: $?", answer: "7" }
            ]
          }
        ],
        outro: {
          npcMessage: "The 3 Jars be a powerful tool! Save for the future, spend for now, share with others. Balance be the key!",
          reward: { diamonds: 25, xp: 75 }
        }
      }
    ]
  },

  // Chapter 12: Savings Summit
  {
    id: 12,
    chapterId: "fl_ch3",
    name: "Savings Summit",
    description: "Building your treasure",
    islandId: 4,
    lessons: [
      {
        id: "fl_ch3_l1",
        name: "The Power of Saving",
        description: "Why saving matters",
        intro: {
          npcMessage: "Climb with me to Savings Summit! Here ye learn the power of saving - how small amounts become big treasures over time!",
        },
        games: [
          {
            id: "fl6_q1",
            type: "quiz",
            difficulty: 2,
            text: "Why is saving money important?",
            options: [
              "To look at it",
              "To buy bigger things later and handle emergencies",
              "Saving isn't important",
              "Banks need our money"
            ],
            correct: "To buy bigger things later and handle emergencies",
            explanation: "Saving lets you afford bigger goals (like a bike) and protects you when unexpected things happen (like a broken toy to replace)!"
          },
          {
            id: "fl6_q2",
            type: "quiz",
            difficulty: 2,
            text: "You save $2 every week. How much will you have in 10 weeks?",
            options: [
              "$2",
              "$10",
              "$20",
              "$12"
            ],
            correct: "$20",
            explanation: "$2 × 10 weeks = $20! Small amounts add up over time. This is the magic of saving!"
          },
          {
            id: "fl6_q3",
            type: "timed_challenge",
            difficulty: 2,
            instruction: "Calculate savings goals!",
            timeLimit: 60,
            questions: [
              { text: "Save $3/week for 4 weeks = $?", answer: "12" },
              { text: "Save $5/week for 6 weeks = $?", answer: "30" },
              { text: "Want $40, save $10/week. Weeks needed?", answer: "4" }
            ]
          }
        ],
        outro: {
          npcMessage: "Ye see the magic! Small savings become big treasures. Patience and consistency be your allies!",
          reward: { diamonds: 20, xp: 60 }
        }
      },
      {
        id: "fl_ch3_l2",
        name: "Goal Setting",
        description: "Save for your dreams",
        intro: {
          npcMessage: "The best way to save is to have a GOAL! Let's learn how to set savings goals and reach them!",
        },
        games: [
          {
            id: "fl7_q1",
            type: "sort_order",
            difficulty: 2,
            instruction: "Put the savings goal steps in order",
            items: [
              "Save regularly until you reach the goal",
              "Decide what you want to save for",
              "Figure out how long it will take",
              "Find out how much it costs"
            ],
            correctOrder: [
              "Decide what you want to save for",
              "Find out how much it costs",
              "Figure out how long it will take",
              "Save regularly until you reach the goal"
            ]
          },
          {
            id: "fl7_q2",
            type: "quiz",
            difficulty: 2,
            text: "A toy costs $30. You can save $5 per week. How many weeks until you can buy it?",
            options: [
              "5 weeks",
              "6 weeks",
              "30 weeks",
              "3 weeks"
            ],
            correct: "6 weeks",
            explanation: "$30 ÷ $5 per week = 6 weeks! Setting a goal helps you know exactly when you'll reach it!"
          },
          {
            id: "fl7_q3",
            type: "quiz",
            difficulty: 3,
            text: "What's the BEST type of savings goal?",
            options: [
              "As vague as possible",
              "Specific with amount and deadline",
              "So big it's impossible",
              "Change it every day"
            ],
            correct: "Specific with amount and deadline",
            explanation: "Good goals are SPECIFIC! 'Save $50 for a game by August' is better than 'save some money sometime'."
          }
        ],
        outro: {
          npcMessage: "Goal-setting mastery achieved! Specific goals with deadlines help ye stay on course to your treasure!",
          reward: { diamonds: 25, xp: 75 }
        }
      }
    ],
    boss: {
      id: "boss_fl",
      name: "The Debt Dragon",
      bossEmoji: "dragon",
      bossName: "The Debt Dragon",
      health: 100,
      intro: {
        npcMessage: "The Debt Dragon tempts people to spend more than they have! Use your financial wisdom to defeat it!",
        bossMessage: "ROAARRR! I am the Debt Dragon! I make people spend money they don't have! Can you resist?"
      },
      questions: [
        {
          id: "boss_fl_q1",
          type: "quiz",
          difficulty: 2,
          text: "The dragon offers: 'Buy now, pay later! Who cares about saving!'",
          options: [
            "Great idea! Buy everything!",
            "No thanks - I should save for what I want"
          ],
          correct: "No thanks - I should save for what I want",
          explanation: "Spending money you don't have leads to debt! It's better to save and wait."
        },
        {
          id: "boss_fl_q2",
          type: "quiz",
          difficulty: 2,
          text: "Dragon's temptation: 'You NEED this expensive toy right now!'",
          options: [
            "You're right, I need it!",
            "That's a WANT, not a need. I'll think about it first."
          ],
          correct: "That's a WANT, not a need. I'll think about it first.",
          explanation: "Toys are wants, not needs! Take time to think before buying."
        },
        {
          id: "boss_fl_q3",
          type: "quiz",
          difficulty: 3,
          text: "The dragon asks: 'If you have $20 and want $50 toy, what do you do?'",
          options: [
            "Borrow $30 to buy it now!",
            "Save $5/week for 6 weeks until I have enough"
          ],
          correct: "Save $5/week for 6 weeks until I have enough",
          explanation: "Saving teaches patience and avoids debt. $20 + ($5 × 6 weeks) = $50!"
        },
        {
          id: "boss_fl_q4",
          type: "quiz",
          difficulty: 3,
          text: "Dragon's puzzle: 'What are the 3 jars of budgeting?'",
          options: [
            "Spend, Spend More, Spend Everything",
            "Save, Spend, Share"
          ],
          correct: "Save, Spend, Share",
          explanation: "The 3 jars help balance your money: save for future, spend for now, share with others!"
        },
        {
          id: "boss_fl_q5",
          type: "quiz",
          difficulty: 3,
          text: "Final attack! What's the smartest money habit?",
          options: [
            "Spend everything you get right away",
            "Pay yourself first by saving before spending",
            "Hide money and forget about it",
            "Only think about money when you want to buy something"
          ],
          correct: "Pay yourself first by saving before spending",
          explanation: "Saving FIRST ensures you always build your treasure. Then spend what's left wisely!"
        }
      ],
      victory: {
        npcMessage: "YE DID IT! The Debt Dragon is defeated! You are now a MASTER of Money! Use your wisdom to build real treasure in life!",
        reward: { diamonds: 75, emeralds: 30, xp: 250 }
      },
      defeat: {
        npcMessage: "The dragon's temptations were too strong! Review your lessons and return stronger!",
        bossMessage: "HAHAHA! You fell for my spending tricks! Come back when you know true financial wisdom!"
      }
    }
  }
];

// ============================================
// ISLANDS DEFINITION
// ============================================

export const LIFE_SKILLS_ISLANDS: Island[] = [
  {
    id: 1,
    name: "Critical Thinking Island",
    emoji: "brain",
    theme: "critical_thinking",
    description: "Master the art of separating fact from fiction",
    npcId: "professor_owl",
    color: "#6366f1",
    gradientFrom: "#4f46e5",
    gradientTo: "#6366f1",
    chapters: criticalThinkingChapters
  },
  {
    id: 2,
    name: "Emotion Island",
    emoji: "purple_heart",
    theme: "emotional_intelligence",
    description: "Understand feelings and connect with others",
    npcId: "luna_fox",
    color: "#ec4899",
    gradientFrom: "#db2777",
    gradientTo: "#ec4899",
    chapters: emotionalIntelligenceChapters
  },
  {
    id: 3,
    name: "AI Island",
    emoji: "robot",
    theme: "ai_literacy",
    description: "Learn to use AI wisely and safely",
    npcId: "robo_robot",
    color: "#06b6d4",
    gradientFrom: "#0891b2",
    gradientTo: "#06b6d4",
    chapters: aiLiteracyChapters
  },
  {
    id: 4,
    name: "Finance Island",
    emoji: "coin",
    theme: "financial_literacy",
    description: "Master money and build your treasure",
    npcId: "captain_coin",
    color: "#eab308",
    gradientFrom: "#ca8a04",
    gradientTo: "#eab308",
    chapters: financialLiteracyChapters
  }
];

// Helper function to get all chapters flattened
export function getAllChapters(): Chapter[] {
  return LIFE_SKILLS_ISLANDS.flatMap(island => island.chapters);
}

// Helper function to get chapter by ID
export function getChapterById(chapterId: string): Chapter | undefined {
  return getAllChapters().find(ch => ch.chapterId === chapterId);
}

// Helper function to get island by chapter
export function getIslandByChapter(chapterId: string): Island | undefined {
  return LIFE_SKILLS_ISLANDS.find(island =>
    island.chapters.some(ch => ch.chapterId === chapterId)
  );
}

// Export wizard levels based on progress
export function getWizardLevel(completedChapters: number): {
  level: string;
  title: string;
  nextLevel: string | null;
  chaptersToNext: number;
} {
  if (completedChapters >= 12) {
    return { level: "master", title: "Master Wizard", nextLevel: null, chaptersToNext: 0 };
  }
  if (completedChapters >= 9) {
    return { level: "senior", title: "Senior Wizard", nextLevel: "Master Wizard", chaptersToNext: 12 - completedChapters };
  }
  if (completedChapters >= 6) {
    return { level: "wizard", title: "Wizard", nextLevel: "Senior Wizard", chaptersToNext: 9 - completedChapters };
  }
  if (completedChapters >= 3) {
    return { level: "junior", title: "Junior Wizard", nextLevel: "Wizard", chaptersToNext: 6 - completedChapters };
  }
  return { level: "apprentice", title: "Apprentice", nextLevel: "Junior Wizard", chaptersToNext: 3 - completedChapters };
}
