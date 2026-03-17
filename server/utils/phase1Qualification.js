const Participant = require("../models/Participant");

const TOP_QUALIFIED_COUNT = 64;

async function computePhase1Qualification(logPrefix = "Phase 1") {
  // Rank by score desc, then earlier submission first.
  const submitted = await Participant.find({ phase1Submitted: true })
    .sort({ phase1Score: -1, submittedAt: 1, _id: 1 })
    .select("_id usn name phase1Score submittedAt")
    .lean();

  const ranked = submitted.map((participant, index) => ({
    ...participant,
    rank: index + 1,
    qualified: index < TOP_QUALIFIED_COUNT,
  }));

  const qualifiedIds = ranked.slice(0, TOP_QUALIFIED_COUNT).map((p) => p._id);

  // Reset everyone first, then mark only top 64 as qualified.
  await Participant.updateMany(
    {},
    {
      phase1Qualified: false,
      phase2Active: false,
      phase2Eliminated: true,
      phase2Wins: 0,
      phase2TotalScore: 0,
      phase3Qualified: false,
    },
  );

  if (qualifiedIds.length > 0) {
    await Participant.updateMany(
      { _id: { $in: qualifiedIds } },
      {
        phase1Qualified: true,
        phase2Active: true,
        phase2Eliminated: false,
        phase2Wins: 0,
        phase2TotalScore: 0,
        phase3Qualified: false,
      },
    );
  }

  console.log(
    `${logPrefix}: qualification computed — qualified ${qualifiedIds.length}/${submitted.length}`,
  );

  return {
    qualifiedCount: qualifiedIds.length,
    submittedCount: submitted.length,
    ranked,
  };
}

module.exports = {
  TOP_QUALIFIED_COUNT,
  computePhase1Qualification,
};
