"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  GameContainer,
  QuestionCard,
  OptionButton,
  HintBox,
  Feedback,
  LearningBox,
} from "@/components/game/GameContainer";
import { cn } from "@/lib/utils";

interface PracticeQuestion {
  text: string;
  type: "multiple_choice" | "fill_blank" | "true_false";
  options?: string[];
  correct: string;
  explanation: string;
  hint: string;
}

interface PracticeModeScreenProps {
  playerId: Id<"players"> | null;
  onBack: () => void;
}

// Topic Card Component
function TopicCard({
  topic,
  onStart,
  isGenerating,
}: {
  topic: { _id: string; topic: string; subject: string; accuracy: number; lastPracticed: string; totalAttempts: number };
  onStart: () => void;
  isGenerating: boolean;
}) {
  const getAccuracyColor = (accuracy: number) => {
    if (accuracy < 30) return { bg: "from-[#5A1A1A] to-[#3A0A0A]", border: "#FF4444", text: "#FF6666", glow: "rgba(255,68,68,0.3)" };
    if (accuracy < 60) return { bg: "from-[#5A4A1A] to-[#3A2A0A]", border: "#FFAA00", text: "#FFCC44", glow: "rgba(255,170,0,0.3)" };
    return { bg: "from-[#1A5A2A] to-[#0A3A1A]", border: "#44FF66", text: "#66FF88", glow: "rgba(68,255,102,0.3)" };
  };

  const colors = getAccuracyColor(topic.accuracy);

  const getTimeSince = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  const getDifficultyIcon = (accuracy: number) => {
    if (accuracy < 30) return "🔴";
    if (accuracy < 60) return "🟡";
    return "🟢";
  };

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="relative overflow-hidden"
    >
      <div
        className={cn(
          "bg-gradient-to-b border-4 p-4",
          colors.bg
        )}
        style={{
          borderColor: colors.border,
          boxShadow: `
            0 0 15px ${colors.glow},
            inset 3px 3px 0 rgba(255,255,255,0.1),
            inset -3px -3px 0 rgba(0,0,0,0.3),
            4px 4px 0 rgba(0,0,0,0.4)
          `,
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getDifficultyIcon(topic.accuracy)}</span>
            <div>
              <h3 className="font-pixel text-[0.7em] text-white capitalize">
                {topic.topic.replace(/_/g, " ")}
              </h3>
              <p className="text-[0.8em] text-white/60">{topic.subject}</p>
            </div>
          </div>
          <div className="text-right">
            <div
              className="font-pixel text-[1.2em]"
              style={{ color: colors.text }}
            >
              {topic.accuracy}%
            </div>
            <p className="text-[0.7em] text-white/50">{topic.totalAttempts} tries</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div
            className="h-3 bg-black/40 overflow-hidden"
            style={{ border: `2px solid ${colors.border}40` }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${topic.accuracy}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full"
              style={{ backgroundColor: colors.border }}
            />
          </div>
        </div>

        {/* Last practiced */}
        <div className="flex justify-between items-center mb-3">
          <span className="text-[0.8em] text-white/50">
            Last: {getTimeSince(topic.lastPracticed)}
          </span>
          <span className="text-[0.8em] text-white/50">
            {topic.accuracy < 30 ? "Needs work!" : topic.accuracy < 60 ? "Keep going!" : "Almost there!"}
          </span>
        </div>

        {/* Start button */}
        <Button
          variant="primary"
          size="lg"
          onClick={onStart}
          disabled={isGenerating}
          className="w-full justify-center"
        >
          {isGenerating ? (
            <>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                ⚙️
              </motion.span>
              {" "}Generating...
            </>
          ) : (
            <>⚔️ START PRACTICE</>
          )}
        </Button>
      </div>
    </motion.div>
  );
}

// Empty State Component
function EmptyState() {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="text-center py-12"
    >
      <div
        className="bg-gradient-to-b from-[#1A5A2A] to-[#0A3A1A] border-4 border-[#17D049] p-8 mx-auto max-w-md"
        style={{
          boxShadow: `
            0 0 30px rgba(23,208,73,0.3),
            inset 0 0 40px rgba(23,208,73,0.1),
            6px 6px 0 rgba(0,0,0,0.4)
          `,
        }}
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-6xl mb-4"
        >
          🏆
        </motion.div>
        <h2 className="font-pixel text-[0.9em] text-[#50FF7F] mb-3">
          AMAZING! NO WEAK TOPICS!
        </h2>
        <p className="text-[#C8FFC8] text-[1.1em]">
          Keep up the great work! Complete more homework to find areas to improve.
        </p>
        <motion.div
          className="flex justify-center gap-2 mt-4"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <span>⭐</span>
          <span>⭐</span>
          <span>⭐</span>
        </motion.div>
      </div>
    </motion.div>
  );
}

// Practice Game Component
function PracticeGame({
  questions,
  topic,
  onComplete,
  onExit,
}: {
  questions: PracticeQuestion[];
  topic: string;
  onComplete: (correct: number, total: number) => void;
  onExit: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [correct, setCorrect] = useState(0);

  const currentQ = questions[currentIndex];
  const isCorrect = selectedAnswer?.toLowerCase().trim() === currentQ.correct.toLowerCase().trim();

  const handleAnswer = (answer: string) => {
    if (showFeedback) return;
    setSelectedAnswer(answer);
    setShowFeedback(true);

    if (answer.toLowerCase().trim() === currentQ.correct.toLowerCase().trim()) {
      setCorrect((c) => c + 1);
    }

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex((i) => i + 1);
        setSelectedAnswer(null);
        setTextAnswer("");
        setShowFeedback(false);
        setShowHint(false);
      } else {
        onComplete(correct + (answer.toLowerCase().trim() === currentQ.correct.toLowerCase().trim() ? 1 : 0), questions.length);
      }
    }, 2500);
  };

  const getButtonState = (option: string) => {
    if (!selectedAnswer) return "default";
    if (option.toLowerCase().trim() === currentQ.correct.toLowerCase().trim()) return "correct";
    if (option === selectedAnswer) return "incorrect";
    return "default";
  };

  return (
    <GameContainer
      title={`PRACTICE: ${topic.toUpperCase()}`}
      icon="🎯"
      currentQuestion={currentIndex}
      totalQuestions={questions.length}
      onExit={onExit}
      theme="cave"
    >
      {/* Score */}
      <div className="flex justify-center mb-4">
        <div className="bg-black/30 px-4 py-2 border-2 border-[#17D049]/50">
          <span className="font-pixel text-[0.6em] text-[#50FF7F]">
            SCORE: {correct}/{currentIndex + (showFeedback ? 1 : 0)}
          </span>
        </div>
      </div>

      {/* Question */}
      <QuestionCard
        questionNumber={currentIndex + 1}
        totalQuestions={questions.length}
        label="QUESTION"
      >
        {currentQ.text}
      </QuestionCard>

      {/* Answer Options */}
      {currentQ.type === "fill_blank" ? (
        <div className="my-4">
          <div className="flex gap-3">
            <Input
              variant="game"
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              placeholder="Type your answer..."
              disabled={showFeedback}
              onKeyDown={(e) => e.key === "Enter" && textAnswer.trim() && handleAnswer(textAnswer)}
              className="flex-1"
            />
            <Button
              variant="primary"
              onClick={() => textAnswer.trim() && handleAnswer(textAnswer)}
              disabled={showFeedback || !textAnswer.trim()}
            >
              ✓ CHECK
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
          {currentQ.options?.map((option) => (
            <OptionButton
              key={option}
              onClick={() => handleAnswer(option)}
              state={getButtonState(option)}
              disabled={showFeedback}
            >
              {option}
            </OptionButton>
          ))}
        </div>
      )}

      {/* Hint Button */}
      {!showHint && !showFeedback && currentQ.hint && (
        <div className="text-center mb-4">
          <Button variant="gold" onClick={() => setShowHint(true)}>
            💡 SHOW HINT
          </Button>
        </div>
      )}

      {/* Hint Box */}
      <HintBox hint={currentQ.hint} visible={showHint && !showFeedback} />

      {/* Feedback */}
      <Feedback
        type={isCorrect ? "success" : "error"}
        title={isCorrect ? "💎 CORRECT!" : "💥 NOT QUITE!"}
        message={isCorrect ? "Great job!" : `The answer was: ${currentQ.correct}`}
        visible={showFeedback}
      />

      {/* Explanation after feedback */}
      <AnimatePresence>
        {showFeedback && currentQ.explanation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <LearningBox title="📚 EXPLANATION:">
              {currentQ.explanation}
            </LearningBox>
          </motion.div>
        )}
      </AnimatePresence>
    </GameContainer>
  );
}

// Results Component
function PracticeResults({
  correct,
  total,
  topic,
  onBack,
  onRetry,
}: {
  correct: number;
  total: number;
  topic: string;
  onBack: () => void;
  onRetry: () => void;
}) {
  const percentage = Math.round((correct / total) * 100);
  const isPassing = percentage >= 70;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="p-6"
    >
      <div
        className={cn(
          "bg-gradient-to-b border-6 p-8 text-center",
          isPassing
            ? "from-[#1A5A2A] to-[#0A3A1A] border-[#17D049]"
            : "from-[#5A4A1A] to-[#3A2A0A] border-[#FFAA00]"
        )}
        style={{
          boxShadow: isPassing
            ? "0 0 40px rgba(23,208,73,0.4), inset 0 0 50px rgba(23,208,73,0.15)"
            : "0 0 40px rgba(255,170,0,0.4), inset 0 0 50px rgba(255,170,0,0.15)",
        }}
      >
        {/* Trophy/Icon */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: isPassing ? [0, 5, -5, 0] : [0, -3, 3, 0],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-7xl mb-4"
        >
          {isPassing ? "🏆" : "📈"}
        </motion.div>

        {/* Title */}
        <h2
          className={cn(
            "font-pixel text-[1em] mb-2",
            isPassing ? "text-[#50FF7F]" : "text-[#FFCC44]"
          )}
        >
          {isPassing ? "PRACTICE COMPLETE!" : "KEEP PRACTICING!"}
        </h2>

        {/* Topic */}
        <p className="text-white/70 text-[1.1em] mb-4 capitalize">
          {topic.replace(/_/g, " ")}
        </p>

        {/* Score */}
        <div className="bg-black/30 p-4 mb-6 border-2 border-white/20">
          <div className="font-pixel text-[2em] text-white mb-1">
            {correct}/{total}
          </div>
          <div
            className={cn(
              "text-[1.2em] font-bold",
              isPassing ? "text-[#50FF7F]" : "text-[#FFCC44]"
            )}
          >
            {percentage}%
          </div>
        </div>

        {/* Stars */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3].map((star) => (
            <motion.span
              key={star}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: star * 0.2 }}
              className={cn(
                "text-4xl",
                percentage >= star * 33 ? "opacity-100" : "opacity-30"
              )}
            >
              ⭐
            </motion.span>
          ))}
        </div>

        {/* Message */}
        <p className="text-white/80 text-[1.1em] mb-6">
          {isPassing
            ? "Great job! Your errors are being resolved."
            : "Don't give up! Practice makes perfect."}
        </p>

        {/* Buttons */}
        <div className="flex gap-3 justify-center flex-wrap">
          <Button variant="stone" onClick={onBack}>
            ← BACK TO TOPICS
          </Button>
          {!isPassing && (
            <Button variant="primary" onClick={onRetry}>
              🔄 TRY AGAIN
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function PracticeModeScreen({ playerId, onBack }: PracticeModeScreenProps) {
  const [selectedTopic, setSelectedTopic] = useState<{
    _id: string;
    topic: string;
    subject: string;
    accuracy: number;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [gameState, setGameState] = useState<"topics" | "playing" | "results">("topics");
  const [results, setResults] = useState({ correct: 0, total: 0 });

  // Fetch weak topics from Convex
  const weakTopics = useQuery(
    api.learning.getWeakTopics,
    playerId ? { playerId } : "skip"
  );

  // Generate practice questions for selected topic
  const generatePractice = async (topic: { _id: string; topic: string; subject: string; accuracy: number }) => {
    setSelectedTopic(topic);
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.topic,
          subject: topic.subject,
          difficulty: topic.accuracy < 30 ? "easy" : topic.accuracy < 60 ? "medium" : "hard",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions);
        setGameState("playing");
      } else {
        setError("Failed to generate practice questions. Try again!");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleComplete = (correct: number, total: number) => {
    setResults({ correct, total });
    setGameState("results");
  };

  const handleRetry = () => {
    if (selectedTopic) {
      generatePractice(selectedTopic);
    }
  };

  const handleBackToTopics = () => {
    setGameState("topics");
    setQuestions([]);
    setSelectedTopic(null);
  };

  // Playing state
  if (gameState === "playing" && questions.length > 0 && selectedTopic) {
    return (
      <PracticeGame
        questions={questions}
        topic={selectedTopic.topic}
        onComplete={handleComplete}
        onExit={handleBackToTopics}
      />
    );
  }

  // Results state
  if (gameState === "results" && selectedTopic) {
    return (
      <PracticeResults
        correct={results.correct}
        total={results.total}
        topic={selectedTopic.topic}
        onBack={handleBackToTopics}
        onRetry={handleRetry}
      />
    );
  }

  // Topics list state
  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center gap-4 mb-6"
      >
        <Button variant="stone" onClick={onBack}>
          ← BACK
        </Button>
        <div>
          <h1 className="font-pixel text-[0.9em] text-white flex items-center gap-2">
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🎯
            </motion.span>
            PRACTICE ARENA
          </h1>
          <p className="text-white/60 text-[0.9em]">
            Master your weak topics
          </p>
        </div>
      </motion.div>

      {/* Loading */}
      {!weakTopics && (
        <div className="text-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="text-5xl mb-4"
          >
            ⚙️
          </motion.div>
          <p className="text-white/60">Loading topics...</p>
        </div>
      )}

      {/* Empty state */}
      {weakTopics && weakTopics.length === 0 && <EmptyState />}

      {/* Topics list */}
      {weakTopics && weakTopics.length > 0 && (
        <>
          {/* Info banner */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="bg-gradient-to-r from-[#5A4A1A]/50 to-transparent border-l-4 border-[#FFAA00] p-4 mb-6"
          >
            <p className="text-[#FFCC44] text-[0.95em]">
              ⚠️ These topics need more practice (accuracy below 60%)
            </p>
          </motion.div>

          {/* Topics grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {weakTopics.map((topic, index) => (
              <motion.div
                key={topic._id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <TopicCard
                  topic={topic}
                  onStart={() => generatePractice(topic)}
                  isGenerating={isGenerating && selectedTopic?._id === topic._id}
                />
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gradient-to-b from-[#5A1A1A] to-[#3A0A0A] border-4 border-[#FF4444] p-4 text-center mt-4"
            style={{
              boxShadow: "0 0 20px rgba(255,68,68,0.3)",
            }}
          >
            <span className="text-2xl mr-2">❌</span>
            <span className="text-[#FF6666]">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tips section */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <LearningBox title="💡 PRACTICE TIPS:">
          <ul className="list-disc list-inside space-y-1 text-[0.95em]">
            <li>Practice a little every day for best results</li>
            <li>Use hints when you&apos;re stuck - it&apos;s okay!</li>
            <li>Read explanations to understand mistakes</li>
            <li>Accuracy matters more than speed</li>
          </ul>
        </LearningBox>
      </motion.div>
    </div>
  );
}
