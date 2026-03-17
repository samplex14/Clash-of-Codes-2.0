import React from "react";

interface Option {
  id: string;
  text: string;
}

interface QuestionPayload {
  questionId: string;
  text: string;
  options: Option[];
}

interface QuestionCardProps {
  question: QuestionPayload;
  index: number;
  selectedOption?: string;
  onSelectOption: (optionId: string) => void;
  disabled?: boolean;
  isLocked?: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  index,
  selectedOption,
  onSelectOption,
  disabled = false,
  isLocked = false
}) => {
  return (
    <div className={`card-clash w-full animate-fade-in ${isLocked ? "ring-2 ring-clash-green/50" : ""}`}>
      <div className="flex items-center justify-between mb-6 border-b-2 border-clash-wood pb-4">
        <h3 className="text-2xl font-clash text-clash-gold">Question {index + 1}</h3>
        {isLocked && <span className="text-clash-green font-bold text-sm uppercase tracking-widest">Locked</span>}
      </div>

      <p className="text-xl text-white font-medium mb-8 leading-relaxed whitespace-pre-wrap">{question.text}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {question.options.map((option, optionIndex) => {
          const isSelected = selectedOption === option.id;
          const isDisabled = disabled || isLocked;

          return (
            <button
              type="button"
              key={option.id}
              className={`text-left p-4 rounded-lg font-semibold text-lg border-x-4 border-b-4 transition-all duration-200 ${
                isSelected
                  ? isLocked
                    ? "bg-clash-green/80 border-green-900 shadow-none translate-y-1 text-white"
                    : "bg-clash-elixir border-purple-900 shadow-none translate-y-1 text-white"
                  : "bg-[#e5e5e5] border-gray-400 text-clash-dark hover:bg-white pb-5 shadow-[0_4px_0_0_#9ca3af]"
              } ${isDisabled && !isSelected ? "opacity-50 cursor-not-allowed hover:bg-[#e5e5e5] hover:pb-4" : ""}`}
              onClick={() => {
                if (!isDisabled) {
                  onSelectOption(option.id);
                }
              }}
              disabled={isDisabled}
            >
              <span
                className={`inline-block w-8 h-8 rounded-full text-center leading-8 mr-3 ${
                  isSelected
                    ? isLocked
                      ? "bg-white text-clash-green"
                      : "bg-white text-clash-elixir"
                    : "bg-gray-300 text-gray-700"
                }`}
              >
                {String.fromCharCode(65 + optionIndex)}
              </span>
              {option.text}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionCard;
