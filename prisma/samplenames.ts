export interface SampleOpponent {
  usn: string;
  name: string;
  year: string;
  track: string;
  phase1Score: number;
  qualified: boolean;
  isMapped: boolean;
  mappedTo: string | null;
  mappedAt: Date | null;
  submittedAt: Date | null;
}

export const SAMPLE_OPPONENTS: SampleOpponent[] = [
  { usn: "", name: "Arjun Sharma", year: "1st", track: "CSE", phase1Score: 0, qualified: false, isMapped: false, mappedTo: null, mappedAt: null, submittedAt: null },
  { usn: "", name: "Priya Nair", year: "1st", track: "CSE", phase1Score: 0, qualified: false, isMapped: false, mappedTo: null, mappedAt: null, submittedAt: null },
  { usn: "", name: "Rohit Verma", year: "1st", track: "CSE", phase1Score: 0, qualified: false, isMapped: false, mappedTo: null, mappedAt: null, submittedAt: null },
  { usn: "", name: "Sneha Reddy", year: "1st", track: "CSE", phase1Score: 0, qualified: false, isMapped: false, mappedTo: null, mappedAt: null, submittedAt: null },
  { usn: "", name: "Karan Mehta", year: "1st", track: "CSE", phase1Score: 0, qualified: false, isMapped: false, mappedTo: null, mappedAt: null, submittedAt: null },
  { usn: "", name: "Divya Krishnan", year: "1st", track: "CSE", phase1Score: 0, qualified: false, isMapped: false, mappedTo: null, mappedAt: null, submittedAt: null },
  { usn: "", name: "Aditya Rao", year: "1st", track: "CSE", phase1Score: 0, qualified: false, isMapped: false, mappedTo: null, mappedAt: null, submittedAt: null },
  { usn: "", name: "Meera Iyer", year: "2nd", track: "CSE", phase1Score: 0, qualified: false, isMapped: false, mappedTo: null, mappedAt: null, submittedAt: null },
  { usn: "", name: "Vikram Singh", year: "2nd", track: "CSE", phase1Score: 0, qualified: false, isMapped: false, mappedTo: null, mappedAt: null, submittedAt: null },
  { usn: "", name: "Ananya Bhat", year: "2nd", track: "CSE", phase1Score: 0, qualified: false, isMapped: false, mappedTo: null, mappedAt: null, submittedAt: null },
  { usn: "", name: "Suresh Kumar", year: "2nd", track: "CSE", phase1Score: 0, qualified: false, isMapped: false, mappedTo: null, mappedAt: null, submittedAt: null },
  { usn: "", name: "Lakshmi Prasad", year: "2nd", track: "CSE", phase1Score: 0, qualified: false, isMapped: false, mappedTo: null, mappedAt: null, submittedAt: null },
  { usn: "", name: "Nikhil Joshi", year: "2nd", track: "CSE", phase1Score: 0, qualified: false, isMapped: false, mappedTo: null, mappedAt: null, submittedAt: null },
  { usn: "", name: "Pooja Hegde", year: "2nd", track: "CSE", phase1Score: 0, qualified: false, isMapped: false, mappedTo: null, mappedAt: null, submittedAt: null },
  { usn: "", name: "Rahul Gowda", year: "2nd", track: "CSE", phase1Score: 0, qualified: false, isMapped: false, mappedTo: null, mappedAt: null, submittedAt: null }
];
