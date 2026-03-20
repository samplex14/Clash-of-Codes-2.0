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
    <div className="w-full relative mx-auto my-4 font-clash">
      {/* Main Parchment Container */}
      <div 
        className="relative bg-[#f5e6cc] border-[6px] border-[#eebc5d] rounded-xl p-4 md:p-8 shadow-[0_10px_0_0_rgba(0,0,0,0.3)]"
        style={{
          boxShadow: '0 8px 0 #c29138, 0 15px 20px rgba(0,0,0,0.4)',
        }}
      >
        {/* Inner Border/Decor (Optional subtle border inside) */}
        <div className="absolute inset-2 border-2 border-[#dabba8] rounded-lg pointer-events-none opacity-50"></div>

        {/* Card Header */}
        <div className="relative mb-6 pb-4 border-b-2 border-[#d3bca0]">
          <h3 
            className="text-2xl md:text-3xl font-clash text-[#ffcc00] tracking-wider drop-shadow-md"
            style={{ 
              textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
              WebkitTextStroke: '1px #000'
            }}
          >
            Question {index + 1}
          </h3>
        </div>

        {/* Question Text */}
        <div className="relative z-10 mb-8 min-h-[80px]">
          <p className="text-lg md:text-2xl text-[#2b1d12] leading-snug drop-shadow-sm tracking-wide">
            {question.text}
          </p>
        </div>

        {/* Options Grid */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4">
          {question.options.map((option, optionIndex) => {
            const isSelected = selectedOption === option.id;
            const isDisabled = disabled || isLocked;
            const letter = String.fromCharCode(65 + optionIndex);

            return (
              <button
                type="button"
                key={option.id}
                onClick={() => !isDisabled && onSelectOption(option.id)}
                disabled={isDisabled}
                className={`relative group flex items-center p-3 md:p-4 rounded-xl transition-all duration-150 active:scale-[0.98]
                  border-b-4 
                  ${isSelected
                    ? isLocked
                      ? "bg-[#8ce066] border-[#5da53e] text-[#1a400e]" // Locked/Confirmed (Green)
                      : "bg-[#d0f0ff] border-[#6b9bb5] text-[#0d3c55]" // Selected (Blue-ish)
                    : "bg-[#ead5b5] border-[#c0a078] text-[#3f2617] hover:bg-[#f3e3ca] hover:border-[#d4b58b]" // Default (Tan)
                  }
                  ${isDisabled && !isSelected ? "opacity-60 cursor-not-allowed filter grayscale-[0.3]" : "shadow-sm"}
                `}
              >
                {/* Letter Box */}
                <div 
                  className={`flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-md flex items-center justify-center font-clash text-sm md:text-lg mr-4 border-b-2
                    ${isSelected
                      ? "bg-white/50 border-black/10"
                      : "bg-[#dcb98a] border-[#b08d55] text-[#2b1d12]"
                    }
                  `}
                >
                  {letter}
                </div>
                
                {/* Option Text */}
                <span className="text-base md:text-xl text-left leading-tight tracking-wide">
                  {option.text}
                </span>
                
                {/* Selection Indicator (Checkmark) if locked */}
                {isSelected && isLocked && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-800">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;
