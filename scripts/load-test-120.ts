import { db } from "../lib/db";

type YearInput = 1 | 2;

type ParticipantSeed = {
  usn: string;
  name: string;
  year: YearInput;
};

type QuestionItem = {
  questionId: string;
  text: string;
  options: Array<{ id: string; text: string }>;
};

type LeaderboardParticipant = {
  rank: number;
  usn: string;
  qualified: boolean;
};

type LeaderboardResponse = {
  visible: boolean;
  participants: LeaderboardParticipant[];
  totalEligible: number;
};

type TournamentStatusResponse = {
  submitted: number;
  total: number;
  allDone: boolean;
  leaderboardVisible: boolean;
};

const BASE_URL = (process.env.LOAD_TEST_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const TOTAL_PARTICIPANTS = Math.max(2, Number(process.env.LOAD_TEST_COUNT ?? "120"));
const REQUEST_TIMEOUT_MS = Math.max(1000, Number(process.env.LOAD_TEST_TIMEOUT_MS ?? "15000"));
const REGISTRATION_CONCURRENCY = Math.max(1, Number(process.env.LOAD_TEST_REG_CONCURRENCY ?? "20"));
const SUBMISSION_CONCURRENCY = Math.max(1, Number(process.env.LOAD_TEST_SUBMIT_CONCURRENCY ?? "20"));
const POLL_INTERVAL_MS = Math.max(250, Number(process.env.LOAD_TEST_POLL_MS ?? "1500"));
const POLL_ATTEMPTS = Math.max(1, Number(process.env.LOAD_TEST_POLL_ATTEMPTS ?? "60"));

const runTag = `LT${Date.now().toString(36).toUpperCase()}`;

const abortableFetch = async (path: string, init?: RequestInit): Promise<Response> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(`${BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        ...(init?.headers ?? {})
      }
    });
  } finally {
    clearTimeout(timeout);
  }
};

const ensureOk = async <T>(response: Response, context: string): Promise<T> => {
  if (!response.ok) {
    const bodyText = await response.text();
    throw new Error(`${context} failed: ${response.status} ${response.statusText} | ${bodyText}`);
  }
  return (await response.json()) as T;
};

const pad = (num: number, width: number): string => String(num).padStart(width, "0");

const buildParticipants = (count: number): ParticipantSeed[] => {
  const firstYearCount = Math.floor(count / 2);
  const secondYearCount = count - firstYearCount;

  const participants: ParticipantSeed[] = [];

  for (let index = 1; index <= firstYearCount; index += 1) {
    const usn = `${runTag}1${pad(index, 3)}`;
    participants.push({
      usn,
      name: `LoadTest1_${index}`,
      year: 1
    });
  }

  for (let index = 1; index <= secondYearCount; index += 1) {
    const usn = `${runTag}2${pad(index, 3)}`;
    participants.push({
      usn,
      name: `LoadTest2_${index}`,
      year: 2
    });
  }

  return participants;
};

const chunk = <T>(items: T[], size: number): T[][] => {
  const output: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    output.push(items.slice(i, i + size));
  }
  return output;
};

const randomChoice = <T>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

const registerParticipants = async (participants: ParticipantSeed[]): Promise<void> => {
  for (const group of chunk(participants, REGISTRATION_CONCURRENCY)) {
    await Promise.all(
      group.map(async (participant) => {
        const response = await abortableFetch("/api/participants/register", {
          method: "POST",
          body: JSON.stringify(participant)
        });

        await ensureOk(response, `register ${participant.usn}`);
      })
    );
  }
};

const runMatchmaking = async (participants: ParticipantSeed[]): Promise<void> => {
  for (const participant of participants) {
    const response = await abortableFetch("/api/matchmaking", {
      method: "POST",
      body: JSON.stringify({ usn: participant.usn })
    });

    await ensureOk(response, `matchmaking ${participant.usn}`);
  }
};

const startTournament = async (): Promise<void> => {
  const response = await abortableFetch("/api/tournament/start", {
    method: "POST",
    body: JSON.stringify({})
  });
  await ensureOk(response, "tournament start");
};

const fetchQuestions = async (usn: string): Promise<QuestionItem[]> => {
  const response = await abortableFetch(`/api/phase1/questions?usn=${encodeURIComponent(usn)}`, {
    method: "GET"
  });

  const body = await ensureOk<{ questions?: QuestionItem[] }>(response, `questions ${usn}`);
  if (!Array.isArray(body.questions) || body.questions.length === 0) {
    throw new Error(`questions ${usn} failed: no questions returned`);
  }

  return body.questions;
};

const submitAnswers = async (usn: string, questions: QuestionItem[]): Promise<void> => {
  const answers: Record<string, string> = {};

  questions.forEach((question) => {
    if (question.options.length === 0) {
      return;
    }
    answers[question.questionId] = randomChoice(question.options).id;
  });

  const response = await abortableFetch("/api/phase1/submit", {
    method: "POST",
    body: JSON.stringify({ usn, answers })
  });

  await ensureOk(response, `submit ${usn}`);
};

const submitAllParticipants = async (participants: ParticipantSeed[]): Promise<void> => {
  for (const group of chunk(participants, SUBMISSION_CONCURRENCY)) {
    await Promise.all(
      group.map(async (participant) => {
        const questions = await fetchQuestions(participant.usn);
        await submitAnswers(participant.usn, questions);
      })
    );
  }
};

const waitForLeaderboardVisible = async (): Promise<TournamentStatusResponse> => {
  let latest: TournamentStatusResponse | null = null;

  for (let attempt = 1; attempt <= POLL_ATTEMPTS; attempt += 1) {
    const response = await abortableFetch("/api/tournament/status", { method: "GET" });
    const body = await ensureOk<TournamentStatusResponse>(response, "tournament status");
    latest = body;

    if (body.leaderboardVisible && body.allDone) {
      return body;
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error(
    `Leaderboard did not become visible after polling. Last status: ${JSON.stringify(latest)}`
  );
};

const fetchLeaderboard = async (path: string): Promise<LeaderboardResponse> => {
  const response = await abortableFetch(path, { method: "GET" });
  return ensureOk<LeaderboardResponse>(response, `leaderboard ${path}`);
};

const verifyQualifiedCounts = async (
  firstYearEligible: number,
  secondYearEligible: number
): Promise<void> => {
  const [firstLeaderboard, secondLeaderboard] = await Promise.all([
    fetchLeaderboard("/api/leaderboard1?limit=200"),
    fetchLeaderboard("/api/leaderboard?year=2nd&limit=200")
  ]);

  const firstQualifiedFromApi = firstLeaderboard.participants.filter((participant) => participant.qualified).length;
  const secondQualifiedFromApi = secondLeaderboard.participants.filter((participant) => participant.qualified).length;

  const expectedFirst = Math.min(16, firstYearEligible);
  const expectedSecond = Math.min(16, secondYearEligible);

  if (firstQualifiedFromApi !== expectedFirst) {
    throw new Error(
      `1st year qualified mismatch (API). expected=${expectedFirst}, actual=${firstQualifiedFromApi}`
    );
  }

  if (secondQualifiedFromApi !== expectedSecond) {
    throw new Error(
      `2nd year qualified mismatch (API). expected=${expectedSecond}, actual=${secondQualifiedFromApi}`
    );
  }

  const [firstDbQualified, secondDbQualified] = await Promise.all([
    db.participant.count({
      where: {
        isMapped: true,
        track: "1st_year",
        qualified: true,
        usn: { startsWith: runTag }
      }
    }),
    db.participant.count({
      where: {
        isMapped: true,
        track: "2nd_year",
        qualified: true,
        usn: { startsWith: runTag }
      }
    })
  ]);

  if (firstDbQualified !== expectedFirst) {
    throw new Error(
      `1st year qualified mismatch (DB). expected=${expectedFirst}, actual=${firstDbQualified}`
    );
  }

  if (secondDbQualified !== expectedSecond) {
    throw new Error(
      `2nd year qualified mismatch (DB). expected=${expectedSecond}, actual=${secondDbQualified}`
    );
  }
};

const cleanupRunParticipants = async (): Promise<void> => {
  await db.participantSession.deleteMany({
    where: {
      usn: {
        startsWith: runTag
      }
    }
  });

  await db.participant.deleteMany({
    where: {
      usn: {
        startsWith: runTag
      }
    }
  });
};

const printSummary = (status: TournamentStatusResponse, count: number): void => {
  console.log("\nLoad test completed successfully.");
  console.log(`Run tag: ${runTag}`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Participants: ${count}`);
  console.log(`Tournament status: submitted=${status.submitted}, total=${status.total}, leaderboardVisible=${status.leaderboardVisible}`);
  console.log("Verified: Top 16 qualified per year in API and DB for this run tag.");
  console.log("Note: test participants are retained. To clean up manually, delete records with this run tag.");
};

const main = async (): Promise<void> => {
  const participants = buildParticipants(TOTAL_PARTICIPANTS);
  const firstYearEligible = participants.filter((participant) => participant.year === 1).length;
  const secondYearEligible = participants.filter((participant) => participant.year === 2).length;

  console.log(`Starting load test for ${participants.length} participants against ${BASE_URL}`);
  console.log(`Run tag: ${runTag}`);

  // Ensure retries in the same process do not conflict with an interrupted run using the same tag.
  await cleanupRunParticipants();

  await registerParticipants(participants);
  console.log("Registration completed.");

  await runMatchmaking(participants);
  console.log("Matchmaking completed.");

  await startTournament();
  console.log("Tournament started.");

  await submitAllParticipants(participants);
  console.log("Submissions completed.");

  const status = await waitForLeaderboardVisible();
  console.log("Leaderboard is visible.");

  await verifyQualifiedCounts(firstYearEligible, secondYearEligible);

  printSummary(status, participants.length);
};

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error("\nLoad test failed:", message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
