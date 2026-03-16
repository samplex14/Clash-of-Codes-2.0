const Match = require("../models/Match");
const Participant = require("../models/Participant");
const Question = require("../models/Question");

/**
 * Fisher-Yates shuffle (in place)
 */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generate matches for a given track and round.
 * - Fetches active, uneliminated players in the track
 * - Shuffles and pairs them
 * - Assigns random Phase 2 questions to each match
 * - Returns created match documents
 */
async function generateMatches(track, round) {
  const players = await Participant.find({
    track,
    phase2Active: true,
    phase2Eliminated: false,
  });

  if (players.length < 2) {
    throw new Error(`Not enough players in ${track} (found ${players.length})`);
  }
  if (players.length % 2 !== 0) {
    throw new Error(
      `Odd number of players in ${track} (${players.length}). Admin must resolve.`,
    );
  }

  // Shuffle players randomly
  shuffle(players);

  // Get Phase 2 questions (random set per round)
  const QUESTIONS_PER_MATCH = 10;
  const allQuestions = await Question.find({ phase: 2 });
  if (allQuestions.length < QUESTIONS_PER_MATCH) {
    throw new Error(
      `Not enough Phase 2 questions (${allQuestions.length}). Need at least ${QUESTIONS_PER_MATCH}.`,
    );
  }

  const matches = [];
  for (let i = 0; i < players.length; i += 2) {
    // Pick random questions for this match
    const shuffledQuestions = shuffle([...allQuestions]);
    const matchQuestions = shuffledQuestions
      .slice(0, QUESTIONS_PER_MATCH)
      .map((q) => q._id);

    const match = await Match.create({
      round,
      track,
      player1: players[i]._id,
      player2: players[i + 1]._id,
      questions: matchQuestions,
      status: "pending",
    });

    matches.push(match);
  }

  return matches;
}

module.exports = { generateMatches, shuffle };
