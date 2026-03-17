import React from 'react';

const QuestionCard = ({ question, index, selectedOption, onSelectOption, disabled = false, isLocked = false }) => {
  if (!question) return null;

  // Determine the option text — handle both string arrays and {id, text} objects
  const getOptionText = (opt) => {
    if (typeof opt === 'string') return opt;
    if (opt && typeof opt === 'object' && opt.text !== undefined) return opt.text;
    return String(opt);
  };

  const getOptionId = (opt, idx) => {
    if (opt && typeof opt === 'object' && opt.id !== undefined) return opt.id;
    return idx;
  };

  return (
    <div className={`card-clash w-full animate-fade-in ${isLocked ? 'ring-2 ring-clash-green/50' : ''}`}>
      <div className="flex items-center justify-between mb-6 border-b-2 border-clash-wood pb-4">
        <h3 className="text-2xl font-clash text-clash-gold">
          Question {index + 1}
        </h3>
        {isLocked && (
          <span className="text-clash-green font-bold text-sm uppercase tracking-widest flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Locked
          </span>
        )}
      </div>
      
      <p className="text-xl text-white font-medium mb-8 leading-relaxed whitespace-pre-wrap">
        {question.text}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {question.options.map((opt, i) => {
          const optId = getOptionId(opt, i);
          const optText = getOptionText(opt);
          const isSelected = selectedOption === optId;
          const isDisabled = disabled || isLocked;
          
          return (
            <button
              key={i}
              className={`
                text-left p-4 rounded-lg font-semibold text-lg border-x-4 border-b-4 
                transition-all duration-200
                ${isSelected 
                  ? isLocked
                    ? 'bg-clash-green/80 border-green-900 shadow-none translate-y-1 text-white'
                    : 'bg-clash-elixir border-purple-900 shadow-none translate-y-1 text-white'
                  : 'bg-[#e5e5e5] border-gray-400 text-clash-dark hover:bg-white pb-5 shadow-[0_4px_0_0_#9ca3af]'}
                ${isDisabled && !isSelected ? 'opacity-50 cursor-not-allowed hover:bg-[#e5e5e5] hover:pb-4' : ''}
              `}
              onClick={() => !isDisabled && onSelectOption(optId)}
              disabled={isDisabled}
            >
              <span className={`inline-block w-8 h-8 rounded-full text-center leading-8 mr-3 ${
                isSelected 
                  ? isLocked 
                    ? 'bg-white text-clash-green' 
                    : 'bg-white text-clash-elixir' 
                  : 'bg-gray-300 text-gray-700'
              }`}>
                {String.fromCharCode(65 + i)}
              </span>
              {optText}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionCard;
