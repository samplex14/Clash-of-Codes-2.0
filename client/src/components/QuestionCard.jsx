import React from 'react';

const QuestionCard = ({ question, index, selectedOption, onSelectOption, disabled = false }) => {
  if (!question) return null;

  return (
    <div className="card-clash w-full animate-fade-in">
      <h3 className="text-2xl font-clash text-clash-gold mb-6 border-b-2 border-clash-wood pb-4">
        Question {index + 1}
      </h3>
      
      <p className="text-xl text-white font-medium mb-8 leading-relaxed whitespace-pre-wrap">
        {question.text}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {question.options.map((opt, i) => {
          const isSelected = selectedOption === i;
          
          return (
            <button
              key={i}
              className={`
                text-left p-4 rounded-lg font-semibold text-lg border-x-4 border-b-4 
                transition-all duration-200
                ${isSelected 
                  ? 'bg-clash-elixir border-purple-900 shadow-none translate-y-1 text-white' 
                  : 'bg-[#e5e5e5] border-gray-400 text-clash-dark hover:bg-white pb-5 shadow-[0_4px_0_0_#9ca3af]'}
                ${disabled && !isSelected ? 'opacity-50 cursor-not-allowed hover:bg-[#e5e5e5] hover:pb-4' : ''}
              `}
              onClick={() => onSelectOption(i)}
              disabled={disabled}
            >
              <span className={`inline-block w-8 h-8 rounded-full text-center leading-8 mr-3 ${isSelected ? 'bg-white text-clash-elixir' : 'bg-gray-300 text-gray-700'}`}>
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionCard;
