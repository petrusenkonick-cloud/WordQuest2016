"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";

interface ProfileSetupScreenProps {
  playerId: Id<"players"> | null;
  onComplete: () => void;
  onSkip?: () => void;
}

type SetupStep = "age" | "grade" | "language" | "competition";

export function ProfileSetupScreen({
  playerId,
  onComplete,
  onSkip,
}: ProfileSetupScreenProps) {
  const [step, setStep] = useState<SetupStep>("age");
  const [birthYear, setBirthYear] = useState<number | null>(null);
  const [gradeLevel, setGradeLevel] = useState<number | null>(null);
  const [nativeLanguage, setNativeLanguage] = useState<string | null>(null);
  const [competitionOptIn, setCompetitionOptIn] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const completeProfile = useMutation(api.profile.completeProfileSetup);

  const currentYear = new Date().getFullYear();

  // Generate years for age selection (ages 5-16)
  const years = Array.from({ length: 12 }, (_, i) => currentYear - 5 - i);

  const grades = [
    { level: 1, label: "1st Grade", emoji: "1️⃣" },
    { level: 2, label: "2nd Grade", emoji: "2️⃣" },
    { level: 3, label: "3rd Grade", emoji: "3️⃣" },
    { level: 4, label: "4th Grade", emoji: "4️⃣" },
    { level: 5, label: "5th Grade", emoji: "5️⃣" },
    { level: 6, label: "6th Grade", emoji: "6️⃣" },
    { level: 7, label: "7th Grade", emoji: "7️⃣" },
    { level: 8, label: "8th Grade", emoji: "8️⃣" },
    { level: 9, label: "9th Grade", emoji: "9️⃣" },
    { level: 10, label: "10th Grade", emoji: "🔟" },
    { level: 11, label: "11th Grade", emoji: "1️⃣1️⃣" },
  ];

  const languages = [
    { code: "ru", name: "Russian", emoji: "🇷🇺", native: "Русский" },
    { code: "uk", name: "Ukrainian", emoji: "🇺🇦", native: "Українська" },
    { code: "en", name: "English", emoji: "🇬🇧", native: "English" },
  ];

  const steps: SetupStep[] = ["age", "grade", "language", "competition"];
  const currentStepIndex = steps.indexOf(step);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const nextStep = () => {
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  const handleSubmit = async () => {
    if (!playerId || !birthYear || !gradeLevel || !nativeLanguage) return;

    setIsSubmitting(true);
    try {
      await completeProfile({
        playerId,
        birthYear,
        gradeLevel,
        nativeLanguage,
        competitionOptIn,
      });
      onComplete();
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case "age":
        return birthYear !== null;
      case "grade":
        return gradeLevel !== null;
      case "language":
        return nativeLanguage !== null;
      case "competition":
        return true;
      default:
        return false;
    }
  };

  const getAgeFromYear = (year: number) => currentYear - year;

  return (
    <div
      className="screen active"
      style={{
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <h1 style={{ margin: 0, fontSize: "1.8em" }}>
          🧙‍♂️ Welcome, Young Wizard!
        </h1>
        <p style={{ color: "#AAA", fontSize: "0.9em", marginTop: "8px" }}>
          Let&apos;s set up your magical profile
        </p>
      </div>

      {/* Progress Bar */}
      <div
        style={{
          background: "rgba(255,255,255,0.1)",
          borderRadius: "10px",
          height: "8px",
          marginBottom: "30px",
          overflow: "hidden",
        }}
      >
        <motion.div
          style={{
            height: "100%",
            background: "linear-gradient(90deg, #8B5CF6, #EC4899)",
            borderRadius: "10px",
          }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Step Content */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <AnimatePresence mode="wait">
          {step === "age" && (
            <StepContainer key="age">
              <StepTitle>How old are you?</StepTitle>
              <StepDescription>
                Select your birth year to find the best learning content for you
              </StepDescription>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "10px",
                  marginTop: "20px",
                }}
              >
                {years.map((year) => {
                  const age = getAgeFromYear(year);
                  return (
                    <SelectCard
                      key={year}
                      selected={birthYear === year}
                      onClick={() => setBirthYear(year)}
                    >
                      <span style={{ fontSize: "1.5em", fontWeight: "bold" }}>
                        {age}
                      </span>
                      <span style={{ fontSize: "0.75em", color: "#888" }}>
                        years old
                      </span>
                    </SelectCard>
                  );
                })}
              </div>
            </StepContainer>
          )}

          {step === "grade" && (
            <StepContainer key="grade">
              <StepTitle>What grade are you in?</StepTitle>
              <StepDescription>
                This helps us match you with the right difficulty level
              </StepDescription>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "10px",
                  marginTop: "20px",
                }}
              >
                {grades.map((grade) => (
                  <SelectCard
                    key={grade.level}
                    selected={gradeLevel === grade.level}
                    onClick={() => setGradeLevel(grade.level)}
                  >
                    <span style={{ fontSize: "2em" }}>{grade.emoji}</span>
                    <span style={{ fontSize: "0.75em" }}>{grade.label}</span>
                  </SelectCard>
                ))}
              </div>
            </StepContainer>
          )}

          {step === "language" && (
            <StepContainer key="language">
              <StepTitle>What&apos;s your native language?</StepTitle>
              <StepDescription>
                We&apos;ll use this to provide explanations in your language
              </StepDescription>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  marginTop: "20px",
                }}
              >
                {languages.map((lang) => (
                  <SelectCard
                    key={lang.code}
                    selected={nativeLanguage === lang.code}
                    onClick={() => setNativeLanguage(lang.code)}
                    horizontal
                  >
                    <span style={{ fontSize: "2.5em" }}>{lang.emoji}</span>
                    <div>
                      <div style={{ fontWeight: "bold", fontSize: "1.1em" }}>
                        {lang.native}
                      </div>
                      <div style={{ color: "#888", fontSize: "0.85em" }}>
                        {lang.name}
                      </div>
                    </div>
                  </SelectCard>
                ))}
              </div>
            </StepContainer>
          )}

          {step === "competition" && (
            <StepContainer key="competition">
              <StepTitle>Join the Competition?</StepTitle>
              <StepDescription>
                Compete with other wizards on the leaderboard!
              </StepDescription>

              <div style={{ marginTop: "30px" }}>
                {/* Competition Card */}
                <div
                  onClick={() => setCompetitionOptIn(!competitionOptIn)}
                  style={{
                    background: competitionOptIn
                      ? "linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(236, 72, 153, 0.3))"
                      : "rgba(0,0,0,0.3)",
                    borderRadius: "16px",
                    padding: "25px",
                    border: `2px solid ${competitionOptIn ? "#8B5CF6" : "#333"}`,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "2.5em",
                          marginBottom: "10px",
                        }}
                      >
                        🏆
                      </div>
                      <div
                        style={{
                          fontWeight: "bold",
                          fontSize: "1.2em",
                          marginBottom: "8px",
                        }}
                      >
                        Enable Competition Mode
                      </div>
                      <div style={{ color: "#888", fontSize: "0.9em" }}>
                        Your scores will appear on leaderboards with an
                        anonymous wizard name
                      </div>
                    </div>
                    <div
                      style={{
                        width: "50px",
                        height: "28px",
                        borderRadius: "14px",
                        background: competitionOptIn ? "#8B5CF6" : "#555",
                        position: "relative",
                        transition: "background 0.2s ease",
                        flexShrink: 0,
                        marginLeft: "15px",
                      }}
                    >
                      <div
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "12px",
                          background: "#fff",
                          position: "absolute",
                          top: "2px",
                          left: competitionOptIn ? "24px" : "2px",
                          transition: "left 0.2s ease",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Benefits List */}
                <div style={{ marginTop: "25px" }}>
                  <h4 style={{ color: "#AAA", marginBottom: "12px" }}>
                    What you get:
                  </h4>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    {[
                      {
                        emoji: "📊",
                        text: "See your rank among other wizards",
                      },
                      {
                        emoji: "🎯",
                        text: "Fair scoring - compete with all ages!",
                      },
                      {
                        emoji: "💎",
                        text: "Win daily & weekly rewards",
                      },
                      {
                        emoji: "🔒",
                        text: "Your real name stays private",
                      },
                    ].map((item, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "10px",
                          background: "rgba(255,255,255,0.05)",
                          borderRadius: "10px",
                        }}
                      >
                        <span style={{ fontSize: "1.3em" }}>{item.emoji}</span>
                        <span style={{ color: "#CCC" }}>{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </StepContainer>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginTop: "20px",
        }}
      >
        {currentStepIndex > 0 && (
          <button
            className="btn"
            onClick={prevStep}
            style={{
              flex: 1,
              padding: "15px",
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "12px",
            }}
          >
            ← Back
          </button>
        )}

        {onSkip && currentStepIndex === 0 && (
          <button
            className="btn"
            onClick={onSkip}
            style={{
              padding: "15px 25px",
              background: "transparent",
              color: "#888",
            }}
          >
            Skip for now
          </button>
        )}

        {step === "competition" ? (
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{
              flex: 2,
              padding: "15px",
              background: "linear-gradient(135deg, #8B5CF6, #EC4899)",
              borderRadius: "12px",
              fontWeight: "bold",
              fontSize: "1.1em",
            }}
          >
            {isSubmitting ? "🔄 Setting up..." : "🚀 Start Learning!"}
          </button>
        ) : (
          <button
            className="btn btn-primary"
            onClick={nextStep}
            disabled={!canProceed()}
            style={{
              flex: 2,
              padding: "15px",
              background: canProceed()
                ? "linear-gradient(135deg, #8B5CF6, #EC4899)"
                : "rgba(255,255,255,0.1)",
              borderRadius: "12px",
              fontWeight: "bold",
              opacity: canProceed() ? 1 : 0.5,
            }}
          >
            Next →
          </button>
        )}
      </div>

      {/* Step Indicator */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "8px",
          marginTop: "15px",
        }}
      >
        {steps.map((s, i) => (
          <div
            key={s}
            style={{
              width: i === currentStepIndex ? "24px" : "8px",
              height: "8px",
              borderRadius: "4px",
              background:
                i <= currentStepIndex
                  ? "linear-gradient(90deg, #8B5CF6, #EC4899)"
                  : "rgba(255,255,255,0.2)",
              transition: "all 0.3s ease",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Helper Components

function StepContainer({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

function StepTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: "1.4em",
        marginBottom: "8px",
        textAlign: "center",
      }}
    >
      {children}
    </h2>
  );
}

function StepDescription({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        color: "#888",
        textAlign: "center",
        fontSize: "0.9em",
        marginBottom: "0",
      }}
    >
      {children}
    </p>
  );
}

function SelectCard({
  children,
  selected,
  onClick,
  horizontal = false,
}: {
  children: React.ReactNode;
  selected: boolean;
  onClick: () => void;
  horizontal?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: horizontal ? "row" : "column",
        alignItems: "center",
        justifyContent: horizontal ? "flex-start" : "center",
        gap: horizontal ? "15px" : "5px",
        padding: horizontal ? "18px 20px" : "15px",
        background: selected
          ? "linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(236, 72, 153, 0.2))"
          : "rgba(255,255,255,0.05)",
        borderRadius: "12px",
        border: `2px solid ${selected ? "#8B5CF6" : "rgba(255,255,255,0.1)"}`,
        cursor: "pointer",
        transition: "all 0.2s ease",
        textAlign: horizontal ? "left" : "center",
      }}
    >
      {children}
    </motion.div>
  );
}
