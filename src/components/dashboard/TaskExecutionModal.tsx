import React, { useState } from 'react';
import { X, CheckCircle2, Star, Clock, Award, ShieldCheck, ArrowRight, Loader2, Sparkles, Building2, Smartphone, Sprout, Briefcase, CalendarCheck } from 'lucide-react';
import type { TaskItem } from '../../types/index.ts';

interface TaskExecutionModalProps {
  task: TaskItem;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (taskId: string, rewardUSDT: number, rewardAethel: number) => void;
}

export const TaskExecutionModal: React.FC<TaskExecutionModalProps> = ({
  task,
  isOpen,
  onClose,
  onComplete,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [selectedSurveyOption, setSelectedSurveyOption] = useState<string>('opt-1');
  const [candidateScore, setCandidateScore] = useState<string>('advance');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    // Simulate validation & blockchain ledger recording delay
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      onComplete(task.id, task.rewardUSDT, task.rewardAethel);
    }, 900);
  };

  const getCategoryIcon = () => {
    switch (task.category) {
      case 'Rate Apps':
        return <Smartphone className="w-5 h-5 text-teal-500" />;
      case 'Business & Hotel Recommendations':
        return <Building2 className="w-5 h-5 text-teal-500" />;
      case 'Agriculture Surveys':
        return <Sprout className="w-5 h-5 text-teal-500" />;
      case 'Remote Job Applications':
        return <Briefcase className="w-5 h-5 text-teal-500" />;
      case 'Daily Check-in':
        return <CalendarCheck className="w-5 h-5 text-teal-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 transition-all max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/50 border border-teal-200/50 dark:border-teal-800/50 shrink-0">
              {getCategoryIcon()}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider block truncate">
                {task.category}
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                {task.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Success Screen */}
          {isSuccess ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center ring-8 ring-teal-500/10">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                  Verification Passed
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Task completed (demo)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Your verification response has been logged and the rewards have been credited directly to your balance.
                </p>
              </div>

              {/* Reward Badge */}
              <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/60 max-w-sm mx-auto flex flex-col sm:flex-row items-center justify-around gap-3 font-mono tabular-nums">
                <div className="text-center">
                  <div className="text-xs text-slate-500 dark:text-slate-400">USDT Credited</div>
                  <div className="text-lg font-bold text-teal-600 dark:text-teal-400">
                    +${task.rewardUSDT.toFixed(2)}
                  </div>
                </div>
                <div className="h-px w-16 sm:h-8 sm:w-px bg-teal-200 dark:bg-teal-800" />
                <div className="text-center">
                  <div className="text-xs text-slate-500 dark:text-slate-400">AETHEL Bonus</div>
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    +{task.rewardAethel} AETHEL
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="w-full min-h-[44px] max-w-sm py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm transition-all shadow-md shadow-teal-600/20"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Task Summary Banner */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Est: {task.estimatedTime}</span>
                  </div>
                  <span className="text-slate-300 dark:text-slate-700">·</span>
                  <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                    <Award className="w-3.5 h-3.5" />
                    <span>Level: {task.difficulty}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 font-mono tabular-nums font-semibold text-teal-600 dark:text-teal-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>+${task.rewardUSDT.toFixed(2)} USDT</span>
                  <span className="text-slate-400">/</span>
                  <span className="text-emerald-500">+{task.rewardAethel} AETHEL</span>
                </div>
              </div>

              {/* Instructions List */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Verification Requirements:
                </span>
                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  {task.instructions.map((ins, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-[10px] flex items-center justify-center font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span>{ins}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Form by Category */}
              {task.category === 'Rate Apps' && (
                <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Overall User Experience Rating:
                    </label>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(star)}
                          className="min-w-[44px] min-h-[44px] flex items-center justify-center p-1 text-slate-300 dark:text-slate-600 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`w-6 h-6 ${(hoverRating || rating) >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-mono text-slate-500 ml-1">
                        {rating} of 5 Stars
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Observed Highlights:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {['Instant Biometrics', 'Low Latency', 'Clean Dark Mode', 'Intuitive Slippage', 'Clear Gas Estimates'].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`min-h-[38px] text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                            selectedTags.includes(tag)
                              ? 'bg-teal-50 dark:bg-teal-950 border-teal-500 text-teal-700 dark:text-teal-300 font-medium'
                              : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Brief Quality Feedback (Simulated):
                    </label>
                    <textarea
                      rows={2}
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="e.g. Order execution confirmed smoothly within 250ms, dark mode contrast passes AA standards."
                      className="w-full min-h-[44px] text-base sm:text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>
              )}

              {task.category === 'Business & Hotel Recommendations' && (
                <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Business Traveler Amenities Checklist:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {['Gigabit Fiber WiFi (Verified)', 'Ergonomic Standing Desk', 'Soundproof Conference Pod', '24/7 Security Access'].map((amenity) => (
                        <label key={amenity} className="min-h-[44px] flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 cursor-pointer">
                          <input type="checkbox" defaultChecked className="rounded text-teal-600 focus:ring-teal-500 shrink-0" />
                          <span className="text-slate-700 dark:text-slate-300 text-xs">{amenity}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Corporate Recommendation Score:
                    </label>
                    <select
                      value={candidateScore}
                      onChange={(e) => setCandidateScore(e.target.value)}
                      className="w-full min-h-[44px] text-base sm:text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="advance">Tier 1 - Highly Recommended for Executive Travel</option>
                      <option value="medium">Tier 2 - Meets Standard Corporate Guidelines</option>
                      <option value="pass">Tier 3 - Adequate with Minor Adjustments</option>
                    </select>
                  </div>
                </div>
              )}

              {task.category === 'Agriculture Surveys' && (
                <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="p-3 rounded-xl bg-teal-50/50 dark:bg-teal-950/30 border border-teal-200/50 dark:border-teal-900/50 text-xs text-slate-600 dark:text-slate-400">
                    <p className="font-medium text-slate-800 dark:text-slate-200 mb-1">
                      Sensor Telemetry Snapshot #AG-492:
                    </p>
                    <p>Root-zone moisture: 34.2% · Soil pH: 6.4 · Ambient Solar Irradiance: 840 W/m²</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Recommended Irrigation Modulation:
                    </label>
                    <div className="space-y-2 text-xs">
                      {[
                        { id: 'opt-1', label: 'Maintain standard nocturnal drip cycle (Target root hydration optimal)' },
                        { id: 'opt-2', label: 'Trigger 15% pulse aeration boost to prevent salt crystallization' },
                        { id: 'opt-3', label: 'Reduce daylight irrigation to prevent evaporative thermal loss' },
                      ].map((opt) => (
                        <label
                          key={opt.id}
                          className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                            selectedSurveyOption === opt.id
                              ? 'bg-teal-50/70 dark:bg-teal-950/40 border-teal-500 text-slate-900 dark:text-white'
                              : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="survey-opt"
                            checked={selectedSurveyOption === opt.id}
                            onChange={() => setSelectedSurveyOption(opt.id)}
                            className="mt-0.5 text-teal-600 focus:ring-teal-500"
                          />
                          <span>{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {task.category === 'Remote Job Applications' && (
                <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Technical Assessment Rubric:
                    </label>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                        <span className="text-slate-700 dark:text-slate-300">Methodology & Mathematical Rigor</span>
                        <span className="font-mono text-teal-600 dark:text-teal-400 font-semibold">9.4 / 10</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                        <span className="text-slate-700 dark:text-slate-300">Risk Mitigation & Execution Invariants</span>
                        <span className="font-mono text-teal-600 dark:text-teal-400 font-semibold">9.8 / 10</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Panel Hiring Recommendation:
                    </label>
                    <select
                      value={candidateScore}
                      onChange={(e) => setCandidateScore(e.target.value)}
                      className="w-full min-h-[44px] text-base sm:text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="advance">Strong Advance - Proceed to Technical Deep Dive</option>
                      <option value="hold">Secondary Review by Lead Portfolio Manager</option>
                      <option value="archive">Archive in Talent Pipeline</option>
                    </select>
                  </div>
                </div>
              )}

              {task.category === 'Daily Check-in' && (
                <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-center py-2">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                    <CalendarCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Consecutive Login Streak: Day 6
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-1">
                      Claim today's check-in to boost your mining multiplier and earn instant USDT + AETHEL rewards.
                    </p>
                  </div>
                </div>
              )}

              {/* Submit Action */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm transition-all shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying & Recording Reward...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Verification & Claim Reward</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
