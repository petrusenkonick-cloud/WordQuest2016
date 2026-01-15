"use client";

interface DailyRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDay: number;
  claimed: boolean;
  onClaim: () => void;
}

const REWARDS = ["💎", "🟢", "💎", "🪙", "💎", "🟢", "🏆"];

export function DailyRewardModal({
  isOpen,
  onClose,
  currentDay,
  claimed,
  onClaim,
}: DailyRewardModalProps) {
  if (!isOpen) return null;

  return (
    <div className={`modal-overlay ${isOpen ? "active" : ""}`} onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>🎁 DAILY REWARDS</h2>
        <p style={{ color: "#AAA", marginBottom: "12px" }}>
          Login daily for better rewards!
        </p>

        <div className="daily-days">
          {REWARDS.map((reward, i) => {
            const day = i + 1;
            const isClaimed = day < currentDay;
            const isCurrent = day === currentDay && !claimed;

            return (
              <div
                key={day}
                className={`daily-day ${isClaimed ? "claimed" : ""} ${isCurrent ? "current" : ""}`}
              >
                <div className="day-num">D{day}</div>
                <div className="day-reward">{reward}</div>
              </div>
            );
          })}
        </div>

        <button className="btn btn-gold" onClick={claimed ? onClose : onClaim}>
          {claimed ? "CLAIMED!" : "CLAIM!"}
        </button>
      </div>
    </div>
  );
}
