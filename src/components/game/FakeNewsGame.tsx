"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GameContainer,
  QuestionCard,
  HintBox,
  Feedback,
  LearningBox,
} from "./GameContainer";

interface FakeNewsGameProps {
  onExit: () => void;
  onComplete: (correct: number, mistakes: number) => void;
  onCorrectAnswer?: () => void;
  onWrongAnswer?: () => void;
}

type Difficulty = "easy" | "medium" | "hard";

interface Question {
  headline: string;
  source?: string;
  redFlags: string[];
  allFlags: string[];
  hint: string;
  explanation: string;
}

// EASY questions (ages 6-8) - obvious red flags
const EASY_QUESTIONS: Question[] = [
  {
    headline: "SHOCKING!!! Unicorns Found in Forest!!!",
    redFlags: ["ALL CAPS words", "Many exclamation marks", "Unbelievable claim"],
    allFlags: ["ALL CAPS words", "Many exclamation marks", "Unbelievable claim", "No date given"],
    hint: "Look at the CAPS and punctuation!",
    explanation: "Real news uses calm language. Too many !!! and ALL CAPS are signs of fake news trying to get attention.",
  },
  {
    headline: "AMAZING! Kid Finds $1 Million Under Bed!",
    redFlags: ["ALL CAPS words", "Too good to be true", "Many exclamation marks"],
    allFlags: ["ALL CAPS words", "Too good to be true", "Many exclamation marks", "No source named"],
    hint: "Is this story believable?",
    explanation: "If something sounds too amazing to be true, it probably isn't. Real news reports facts, not fairy tales.",
  },
  {
    headline: "Scientists Say Candy is Healthier Than Vegetables!!!",
    redFlags: ["No scientist names", "Goes against known facts", "Many exclamation marks"],
    allFlags: ["No scientist names", "Goes against known facts", "Many exclamation marks", "Too good to be true"],
    hint: "Does this match what you know about health?",
    explanation: "Real science articles name the scientists and their research. This headline goes against what we know about nutrition.",
  },
  {
    headline: "BREAKING: Dogs Learn to Talk to Humans!",
    redFlags: ["Impossible claim", "No proof mentioned", "ALL CAPS words"],
    allFlags: ["Impossible claim", "No proof mentioned", "ALL CAPS words", "No date given"],
    hint: "Can this really happen?",
    explanation: "Dogs can't speak human languages. Fake news often claims impossible things to get clicks.",
  },
  {
    headline: "Your Friend WON'T BELIEVE This Simple Trick!!!",
    redFlags: ["Clickbait language", "Many exclamation marks", "Vague claims"],
    allFlags: ["Clickbait language", "Many exclamation marks", "Vague claims", "No real information"],
    hint: "What is this 'trick' exactly?",
    explanation: "Phrases like 'won't believe' and 'simple trick' are clickbait - they try to make you click without telling you anything real.",
  },
  {
    headline: "ALERT! Homework Cancelled Forever Starting Tomorrow!!!",
    redFlags: ["Too good to be true", "No source named", "Many exclamation marks"],
    allFlags: ["Too good to be true", "No source named", "Many exclamation marks", "No date given"],
    hint: "Would your school really do this?",
    explanation: "This sounds like a dream, not news! Real announcements come from your school, not random headlines.",
  },
  {
    headline: "Chocolate Discovered on the Moon by NASA!!!",
    redFlags: ["Impossible claim", "No NASA link", "Ridiculous story"],
    allFlags: ["Impossible claim", "No NASA link", "Ridiculous story", "Many exclamation marks"],
    hint: "Can chocolate exist on the moon?",
    explanation: "There's no chocolate on the moon! Fake news uses famous names like NASA to seem believable.",
  },
  {
    headline: "EVERYONE Is Doing This New Dance - You MUST See It!",
    redFlags: ["Pressure words (MUST)", "Vague claims", "ALL CAPS words"],
    allFlags: ["Pressure words (MUST)", "Vague claims", "ALL CAPS words", "No real information"],
    hint: "Is 'everyone' really doing it?",
    explanation: "Words like 'MUST' and 'EVERYONE' pressure you to click. Real news doesn't use pressure tactics.",
  },
  {
    headline: "Magic Pill Makes You Super Smart Overnight!!!",
    redFlags: ["Too good to be true", "No science backing", "Many exclamation marks"],
    allFlags: ["Too good to be true", "No science backing", "Many exclamation marks", "Impossible claim"],
    hint: "Can a pill really do that?",
    explanation: "There's no magic pill for being smart. Learning takes time and effort. Fake products make impossible promises.",
  },
  {
    headline: "URGENT! Share This Before It Gets Deleted!!!",
    redFlags: ["Creates urgency", "Pressure to share", "Many exclamation marks"],
    allFlags: ["Creates urgency", "Pressure to share", "Many exclamation marks", "No real content"],
    hint: "Why would they want you to share it?",
    explanation: "Fake news creates fake urgency. Real important news doesn't beg you to share it before 'it's deleted'.",
  },
];

// MEDIUM questions (ages 9-11) - subtle red flags
const MEDIUM_QUESTIONS: Question[] = [
  {
    headline: "Study Shows Video Games Make Kids Smarter",
    source: "by Anonymous, GamerNews.fake",
    redFlags: ["Anonymous author", "Suspicious website (.fake)", "No study details"],
    allFlags: ["Anonymous author", "Suspicious website (.fake)", "No study details", "Biased source name"],
    hint: "Who wrote this and where?",
    explanation: "Real studies name the researchers and universities. 'Anonymous' and weird website names are red flags.",
  },
  {
    headline: "New Research: Screen Time Actually Improves Sleep",
    source: "PhoneCompany.com",
    redFlags: ["Goes against science", "Biased source (phone company)", "No researcher named"],
    allFlags: ["Goes against science", "Biased source (phone company)", "No researcher named", "Vague claim"],
    hint: "Who would benefit from this claim?",
    explanation: "A phone company saying screens are good for sleep? That's biased! They want you to use your phone more.",
  },
  {
    headline: "SHOCKING Discovery Scientists Don't Want You to Know",
    redFlags: ["Conspiracy hint", "Emotional language", "No specifics given"],
    allFlags: ["Conspiracy hint", "Emotional language", "No specifics given", "Clickbait title"],
    hint: "Why would scientists hide things?",
    explanation: "Scientists share discoveries - that's their job! 'They don't want you to know' is conspiracy thinking.",
  },
  {
    headline: "This One Food Cures All Diseases, According to Expert",
    redFlags: ["Absolute claim (all)", "Single unnamed 'expert'", "Too good to be true"],
    allFlags: ["Absolute claim (all)", "Single unnamed 'expert'", "Too good to be true", "No evidence mentioned"],
    hint: "Can ONE food cure EVERYTHING?",
    explanation: "No single food cures all diseases. Words like 'all' and unnamed 'experts' are warning signs.",
  },
  {
    headline: "Breaking: Famous Celebrity Says Earth is Flat",
    source: "Posted 2 hours ago",
    redFlags: ["Celebrity not scientist", "No quote or proof", "Contradicts science"],
    allFlags: ["Celebrity not scientist", "No quote or proof", "Contradicts science", "Unnamed celebrity"],
    hint: "Is a celebrity an expert on Earth's shape?",
    explanation: "Celebrities aren't scientists. Just because someone is famous doesn't mean they know about science.",
  },
  {
    headline: "97% of Parents Are Making This Mistake!",
    source: "ParentingBlog",
    redFlags: ["Made-up statistic", "Shaming language", "No source for number"],
    allFlags: ["Made-up statistic", "Shaming language", "No source for number", "Clickbait percentage"],
    hint: "Where does 97% come from?",
    explanation: "Random percentages without sources are often made up. Real statistics tell you where the number came from.",
  },
  {
    headline: "Local Mom Discovers Weight Loss Secret Doctors Hate",
    redFlags: ["Doctors hate trick", "Unnamed 'mom'", "Classic scam format"],
    allFlags: ["Doctors hate trick", "Unnamed 'mom'", "Classic scam format", "No medical backing"],
    hint: "Why would doctors hate helping people?",
    explanation: "This is a classic scam format! Doctors don't 'hate' health tips - they share them. 'One simple trick' is always fake.",
  },
  {
    headline: "JUST IN: Major Event Happening Right Now in [Your City]",
    redFlags: ["Generic location [Your City]", "Creates false urgency", "Personalized to trick you"],
    allFlags: ["Generic location [Your City]", "Creates false urgency", "Personalized to trick you", "Vague 'major event'"],
    hint: "How does it know your city?",
    explanation: "Fake news uses [Your City] to seem local. Real news names the actual place.",
  },
  {
    headline: "Scientists Baffled by New Discovery That Changes Everything",
    redFlags: ["Vague claim", "Scientists 'baffled' trope", "No details given"],
    allFlags: ["Vague claim", "Scientists 'baffled' trope", "No details given", "Exaggerated impact"],
    hint: "What exactly was discovered?",
    explanation: "Real science articles explain the discovery. 'Scientists baffled' without details is clickbait.",
  },
  {
    headline: "Warning: This Common Food is Secretly Dangerous!",
    source: "HealthScareDaily",
    redFlags: ["Fear-based headline", "No specific food named", "Suspicious source name"],
    allFlags: ["Fear-based headline", "No specific food named", "Suspicious source name", "No evidence cited"],
    hint: "What food? What danger?",
    explanation: "Scaring people with vague warnings gets clicks. Real health news is specific and cites studies.",
  },
];

// HARD questions (ages 12+) - complex media literacy
const HARD_QUESTIONS: Question[] = [
  {
    headline: "New Study Links Social Media Use to Teen Depression",
    source: "Institute for Family Values, funded by TV industry",
    redFlags: ["Biased funding source", "Correlation vs causation", "Conflict of interest"],
    allFlags: ["Biased funding source", "Correlation vs causation", "Conflict of interest", "Loaded language"],
    hint: "Who paid for this study?",
    explanation: "A TV industry-funded study against social media has a conflict of interest. They want you watching TV instead!",
  },
  {
    headline: "AI Will Replace 80% of Jobs by 2030, Report Claims",
    source: "FutureTech Magazine",
    redFlags: ["Specific prediction (80%)", "Short timeline", "No methodology shown"],
    allFlags: ["Specific prediction (80%)", "Short timeline", "No methodology shown", "Sensationalist claim"],
    hint: "How did they calculate 80%?",
    explanation: "Precise predictions about the future are usually guesses. Real reports explain their methods and uncertainties.",
  },
  {
    headline: "Experts Agree: New Policy Will Solve Climate Change",
    source: "Political Action Committee Newsletter",
    redFlags: ["Unnamed 'experts'", "Oversimplified solution", "Political source bias"],
    allFlags: ["Unnamed 'experts'", "Oversimplified solution", "Political source bias", "No dissenting views"],
    hint: "Which experts? All of them?",
    explanation: "Climate change is complex - no single policy 'solves' it. Political groups often oversimplify for their agenda.",
  },
  {
    headline: "Controversial Figure Actually Right About X, Data Shows",
    source: "Article shares only supporting data",
    redFlags: ["Cherry-picked data", "One-sided presentation", "Emotional framing"],
    allFlags: ["Cherry-picked data", "One-sided presentation", "Emotional framing", "Missing context"],
    hint: "Is all the data shown?",
    explanation: "Showing only data that supports one view is called 'cherry-picking'. Fair reporting shows multiple perspectives.",
  },
  {
    headline: "Leaked Documents Reveal Government Secret Project",
    source: "Anonymous source, unverified documents",
    redFlags: ["Unverified documents", "Anonymous source", "No independent confirmation"],
    allFlags: ["Unverified documents", "Anonymous source", "No independent confirmation", "Sensationalist framing"],
    hint: "How do we know these documents are real?",
    explanation: "Real investigative journalism verifies documents and seeks confirmation. 'Leaked' without verification could be fabricated.",
  },
  {
    headline: "New Poll Shows Candidate Leading by 20 Points",
    source: "Poll conducted by candidate's campaign",
    redFlags: ["Self-funded poll", "Sample size not mentioned", "Methodology hidden"],
    allFlags: ["Self-funded poll", "Sample size not mentioned", "Methodology hidden", "Possible biased questions"],
    hint: "Who conducted the poll?",
    explanation: "Polls paid for by campaigns often use biased questions or selective sampling. Independent polls are more reliable.",
  },
  {
    headline: "Scientists Prove Correlation Between X and Y",
    source: "Single study, not peer-reviewed",
    redFlags: ["Single study claim", "Not peer-reviewed", "Correlation ≠ causation"],
    allFlags: ["Single study claim", "Not peer-reviewed", "Correlation ≠ causation", "Overstated findings"],
    hint: "One study proves something?",
    explanation: "Science requires multiple studies and peer review. One study shows correlation, not proof. Results must be replicated.",
  },
  {
    headline: "Fact Check: Claim is Mostly True (with important caveats)",
    source: "Fact-check only addresses part of claim",
    redFlags: ["Partial fact-check", "Important caveats buried", "Misleading rating"],
    allFlags: ["Partial fact-check", "Important caveats buried", "Misleading rating", "Incomplete analysis"],
    hint: "What are the 'important caveats'?",
    explanation: "Even fact-checks can be misleading if they ignore important parts of a claim. Read the full analysis, not just the rating.",
  },
  {
    headline: "Breaking: Old Tweet Resurfaces, Proves Person's True Views",
    source: "Tweet from 10 years ago, no context",
    redFlags: ["Out of context", "Old statement", "People change views", "Missing current position"],
    allFlags: ["Out of context", "Old statement", "People change views", "Missing current position"],
    hint: "Is a 10-year-old tweet proof of current views?",
    explanation: "People grow and change. A decade-old tweet without context doesn't prove current beliefs. Look for recent statements.",
  },
  {
    headline: "Investigation Reveals Company Knew About Risks",
    source: "Report by competitor company",
    redFlags: ["Competitor bias", "Financial motivation", "No independent verification"],
    allFlags: ["Competitor bias", "Financial motivation", "No independent verification", "Possible business attack"],
    hint: "Who benefits from this report?",
    explanation: "Reports from competitors may be true but need independent verification. They have financial reasons to harm rivals.",
  },
];

const QUESTIONS: Record<Difficulty, Question[]> = {
  easy: EASY_QUESTIONS,
  medium: MEDIUM_QUESTIONS,
  hard: HARD_QUESTIONS,
};

const DIFFICULTY_CONFIG = {
  easy: { label: "EASY", age: "6-8", color: "#4ade80", selectCount: 2 },
  medium: { label: "MEDIUM", age: "9-11", color: "#fbbf24", selectCount: 3 },
  hard: { label: "HARD", age: "12+", color: "#f87171", selectCount: 3 },
};

// Magnifying glass component for detective theme
function MagnifyingGlass({ isAnimating }: { isAnimating: boolean }) {
  return (
    <motion.div
      className="relative"
      animate={isAnimating ? {
        rotate: [0, -10, 10, -10, 0],
        scale: [1, 1.1, 1]
      } : {}}
      transition={{ duration: 0.5 }}
    >
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        {/* Glass circle */}
        <motion.circle
          cx="26"
          cy="26"
          r="18"
          stroke="#fbbf24"
          strokeWidth="4"
          fill="rgba(251, 191, 36, 0.1)"
          animate={isAnimating ? {
            fill: ["rgba(251, 191, 36, 0.1)", "rgba(251, 191, 36, 0.3)", "rgba(251, 191, 36, 0.1)"]
          } : {}}
          transition={{ duration: 0.5 }}
        />
        {/* Handle */}
        <rect
          x="40"
          y="38"
          width="18"
          height="8"
          rx="2"
          fill="#92400e"
          transform="rotate(45 40 38)"
        />
        {/* Shine */}
        <ellipse
          cx="20"
          cy="20"
          rx="4"
          ry="6"
          fill="rgba(255,255,255,0.4)"
          transform="rotate(-30 20 20)"
        />
      </svg>
    </motion.div>
  );
}

// Newspaper/headline visual
function HeadlineVisual({ headline, source }: { headline: string; source?: string }) {
  return (
    <motion.div
      className="relative p-6 rounded-lg"
      style={{
        background: "#fef3c7",
        border: "4px solid #92400e",
        boxShadow: "4px 4px 0 rgba(0,0,0,0.3)",
      }}
      initial={{ rotateX: 90, opacity: 0 }}
      animate={{ rotateX: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Newspaper header */}
      <div className="text-center border-b-2 border-amber-700 pb-2 mb-3">
        <div className="text-xs text-amber-700 tracking-widest">📰 DAILY NEWS 📰</div>
      </div>

      {/* Headline */}
      <h3 className="text-lg font-bold text-gray-900 text-center leading-tight mb-2">
        {headline}
      </h3>

      {/* Source if available */}
      {source && (
        <div className="text-xs text-amber-700 text-center italic">
          {source}
        </div>
      )}

      {/* Paper texture lines */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="border-b border-amber-900"
            style={{ marginTop: `${12 + i * 12}%` }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// Red flag button component
function FlagButton({
  flag,
  isSelected,
  isCorrect,
  showResult,
  onClick
}: {
  flag: string;
  isSelected: boolean;
  isCorrect: boolean;
  showResult: boolean;
  onClick: () => void;
}) {
  const getBackground = () => {
    if (showResult) {
      if (isCorrect && isSelected) return "linear-gradient(180deg, #22c55e, #16a34a)";
      if (isCorrect && !isSelected) return "linear-gradient(180deg, #fbbf24, #d97706)"; // Missed
      if (!isCorrect && isSelected) return "linear-gradient(180deg, #ef4444, #dc2626)";
      return "linear-gradient(180deg, #78716c, #57534e)";
    }
    if (isSelected) return "linear-gradient(180deg, #ef4444, #dc2626)";
    return "linear-gradient(180deg, #78716c, #57534e)";
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={showResult}
      className="relative px-4 py-3 rounded-lg text-left"
      style={{
        background: getBackground(),
        border: isSelected ? "3px solid #fef08a" : "3px solid #44403c",
        boxShadow: isSelected ? "0 0 10px rgba(239, 68, 68, 0.5)" : "2px 2px 0 rgba(0,0,0,0.5)",
      }}
      whileHover={!showResult ? { scale: 1.02 } : {}}
      whileTap={!showResult ? { scale: 0.98 } : {}}
    >
      <div className="flex items-center gap-2">
        <span className="text-2xl">
          {showResult ? (
            isCorrect ? (isSelected ? "✅" : "🚩") : (isSelected ? "❌" : "")
          ) : (
            isSelected ? "🚩" : "⬜"
          )}
        </span>
        <span className="text-white font-medium text-sm">{flag}</span>
      </div>
    </motion.button>
  );
}

// Difficulty selector
function DifficultySelector({ onSelect, onExit }: { onSelect: (d: Difficulty) => void; onExit: () => void }) {
  return (
    <div
      className="bg-gradient-to-b from-[#4A3728] via-[#3A2A1A] to-[#2A1A0A] border-6 border-[#5D4030] p-4 min-h-[400px]"
      style={{
        boxShadow: "inset 4px 4px 0 rgba(255,255,255,0.15), inset -4px -4px 0 rgba(0,0,0,0.4), 8px 8px 0 rgba(0,0,0,0.5)",
      }}
    >
      <div className="flex justify-end mb-4">
        <motion.button
          onClick={onExit}
          className="px-4 py-2 rounded-lg font-bold text-amber-100"
          style={{
            background: "linear-gradient(180deg, #78716c, #57534e)",
            border: "3px solid #44403c",
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ← EXIT
        </motion.button>
      </div>
      <motion.div
        className="flex flex-col items-center justify-center gap-6 py-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4 mb-4">
          <MagnifyingGlass isAnimating={false} />
          <div>
            <h2 className="text-3xl font-bold text-amber-100 drop-shadow-lg">
              🕵️ FAKE NEWS DETECTOR
            </h2>
            <p className="text-amber-200/80 text-sm">Find the red flags!</p>
          </div>
        </div>

        <p className="text-amber-100 text-center mb-4">
          Choose your detective level:
        </p>

        <div className="flex flex-col gap-4 w-full max-w-xs">
          {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((diff) => (
            <motion.button
              key={diff}
              onClick={() => onSelect(diff)}
              className="px-6 py-4 rounded-xl font-bold text-white relative overflow-hidden"
              style={{
                background: `linear-gradient(180deg, ${DIFFICULTY_CONFIG[diff].color}, ${DIFFICULTY_CONFIG[diff].color}dd)`,
                border: "4px solid rgba(0,0,0,0.3)",
                boxShadow: "0 4px 0 rgba(0,0,0,0.5)",
              }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95, y: 2 }}
            >
              <span className="text-lg">{DIFFICULTY_CONFIG[diff].label}</span>
              <span className="block text-sm opacity-80">
                Ages {DIFFICULTY_CONFIG[diff].age}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export function FakeNewsGame({ onExit, onComplete, onCorrectAnswer, onWrongAnswer }: FakeNewsGameProps) {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedFlags, setSelectedFlags] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState({ correct: 0, mistakes: 0 });
  const [isChecking, setIsChecking] = useState(false);

  if (!difficulty) {
    return <DifficultySelector onSelect={setDifficulty} onExit={onExit} />;
  }

  const questions = QUESTIONS[difficulty];
  const currentQuestion = questions[currentIndex];
  const config = DIFFICULTY_CONFIG[difficulty];
  const requiredFlags = config.selectCount;

  const toggleFlag = (flag: string) => {
    if (showResult) return;

    setSelectedFlags((prev) => {
      if (prev.includes(flag)) {
        return prev.filter((f) => f !== flag);
      }
      return [...prev, flag];
    });
  };

  const checkAnswer = () => {
    if (selectedFlags.length === 0) return;

    setIsChecking(true);
    setShowResult(true);

    // Check how many correct flags were selected
    const correctSelected = selectedFlags.filter(f => currentQuestion.redFlags.includes(f)).length;
    const wrongSelected = selectedFlags.filter(f => !currentQuestion.redFlags.includes(f)).length;

    // Score: majority of selections should be correct red flags
    const isCorrect = correctSelected >= Math.ceil(requiredFlags / 2) && wrongSelected <= 1;

    if (isCorrect) {
      setFeedback("correct");
      setScore((prev) => ({ ...prev, correct: prev.correct + 1 }));
      onCorrectAnswer?.();
    } else {
      setFeedback("wrong");
      setScore((prev) => ({ ...prev, mistakes: prev.mistakes + 1 }));
      onWrongAnswer?.();
    }

    // Show explanation after delay
    setTimeout(() => {
      setShowExplanation(true);
      setIsChecking(false);
    }, 1500);
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedFlags([]);
      setShowResult(false);
      setFeedback(null);
      setShowHint(false);
      setShowExplanation(false);
    } else {
      onComplete(score.correct, score.mistakes);
    }
  };

  return (
    <GameContainer
      title={`FAKE NEWS: ${config.label}`}
      icon="🕵️"
      currentQuestion={currentIndex}
      totalQuestions={questions.length}
      onExit={onExit}
    >
      {/* Header with magnifying glass */}
      <div className="flex items-center justify-center mb-4">
        <MagnifyingGlass isAnimating={isChecking} />
      </div>

      {/* Score bar */}
      <div className="flex gap-4 mb-4 text-sm">
        <div className="flex items-center gap-1 text-green-400">
          ✅ {score.correct}
        </div>
        <div className="flex items-center gap-1 text-red-400">
          ❌ {score.mistakes}
        </div>
      </div>

      {/* Headline to analyze */}
      <QuestionCard
        questionNumber={currentIndex + 1}
        totalQuestions={questions.length}
        label="HEADLINE"
      >
        <p className="text-amber-200/80 text-sm mb-3 text-center">
          🔍 Find the RED FLAGS in this headline:
        </p>
        <HeadlineVisual
          headline={currentQuestion.headline}
          source={currentQuestion.source}
        />
      </QuestionCard>

      {/* Hint */}
      <HintBox
        hint={currentQuestion.hint}
        visible={showHint && !showResult}
      />

      {/* Instructions */}
      <p className="text-amber-200/80 text-sm text-center my-3">
        Select {requiredFlags}+ red flags that make this suspicious:
      </p>

      {/* Flag options */}
      <div className="grid grid-cols-1 gap-2 mb-4">
        {currentQuestion.allFlags.map((flag) => (
          <FlagButton
            key={flag}
            flag={flag}
            isSelected={selectedFlags.includes(flag)}
            isCorrect={currentQuestion.redFlags.includes(flag)}
            showResult={showResult}
            onClick={() => toggleFlag(flag)}
          />
        ))}
      </div>

      {/* Feedback */}
      <Feedback
        type={feedback === "correct" ? "success" : "error"}
        title={feedback === "correct" ? "Great Detective Work!" : "Keep Practicing!"}
        message={feedback === "correct"
          ? "🕵️ You spotted the red flags!"
          : "🔍 Check the explanation to learn more."}
        visible={feedback !== null}
      />

      {/* Explanation */}
      {showExplanation && (
        <LearningBox title="📚 Why these are red flags:">
          <p className="mt-1">{currentQuestion.explanation}</p>
          <div className="mt-2 text-xs text-green-300">
            Real red flags: {currentQuestion.redFlags.join(", ")}
          </div>
        </LearningBox>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 mt-4">
        {!showResult ? (
          <>
            <motion.button
              onClick={() => setShowHint(true)}
              disabled={showHint}
              className="flex-1 py-3 rounded-lg font-bold"
              style={{
                background: showHint
                  ? "rgba(120, 113, 108, 0.5)"
                  : "linear-gradient(180deg, #a855f7, #7c3aed)",
                opacity: showHint ? 0.5 : 1,
              }}
              whileHover={!showHint ? { scale: 1.02 } : {}}
              whileTap={!showHint ? { scale: 0.98 } : {}}
            >
              💡 Hint
            </motion.button>
            <motion.button
              onClick={checkAnswer}
              disabled={selectedFlags.length === 0}
              className="flex-1 py-3 rounded-lg font-bold text-white"
              style={{
                background: selectedFlags.length === 0
                  ? "rgba(120, 113, 108, 0.5)"
                  : "linear-gradient(180deg, #22c55e, #16a34a)",
                opacity: selectedFlags.length === 0 ? 0.5 : 1,
              }}
              whileHover={selectedFlags.length > 0 ? { scale: 1.02 } : {}}
              whileTap={selectedFlags.length > 0 ? { scale: 0.98 } : {}}
            >
              🔍 Check ({selectedFlags.length} selected)
            </motion.button>
          </>
        ) : showExplanation && (
          <motion.button
            onClick={nextQuestion}
            className="w-full py-3 rounded-lg font-bold text-white"
            style={{
              background: "linear-gradient(180deg, #3b82f6, #2563eb)",
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {currentIndex < questions.length - 1 ? "Next Headline →" : "🏆 See Results"}
          </motion.button>
        )}
      </div>
    </GameContainer>
  );
}
