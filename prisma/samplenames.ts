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
  { usn: "1RV23CS011", name: "Arjun Sharma", year: "1st", track: "CSE", phase1Score: 0, qualified: false, isMapped: false, mappedTo: null, mappedAt: null, submittedAt: null },
  { usn: "1RV23CS042", name: "Priya Nair", year: "1st", track: "CSE", phase1Score: 0, qualified: false, isMapped: false, mappedTo: null, mappedAt: null, submittedAt: null },
  { usn: "1RV23CS067", name: "Rohit Verma", year: "1st", track: "CSE", phase1Score: 0, qualified: false, isMapped: false, mappedTo: null, mappedAt: null, submittedAt: null },
  { usn: "1RV23CS089", name: "Sneha Reddy", year: "1st", track: "CSE", phase1Score: 0, qualified: false, isMapped: false, mappedTo: null, mappedAt: null, submittedAt: null },
  { usn: "1RV23CS103", name: "Karan Mehta", year: "1st", track: "CSE", phase1Score: 0, qualified: false, isMapped: false, mappedTo: null, mappedAt: null, submittedAt: null },
  { usn: "1RV23CS124", name: "Divya Krishnan", year: "1st", track: "CSE", phase1Score: 0, qualified: false, isMapped: false, mappedTo: null, mappedAt: null, submittedAt: null },
  { usn: "1RV23CS138", name: "Aditya Rao", year: "1st", track: "CSE", phase1Score: 0, qualified: false, isMapped: false, mappedTo: null, mappedAt: null, submittedAt: null },
  { usn: "1RV22CS021", name: "Meera Iyer", year: "2nd", track: "CSE", phase1Score: 0, qualified: false, isMapped: false, mappedTo: null, mappedAt: null, submittedAt: null },
  { usn: "1RV22CS044", name: "Vikram Singh", year: "2nd", track: "CSE", phase1Score: 0, qualified: false, isMapped: false, mappedTo: null, mappedAt: null, submittedAt: null },
  { usn: "1RV22CS073", name: "Ananya Bhat", year: "2nd", track: "CSE", phase1Score: 0, qualified: false, isMapped: false, mappedTo: null, mappedAt: null, submittedAt: null },
  { usn: "1RV22CS108", name: "Suresh Kumar", year: "2nd", track: "CSE", phase1Score: 0, qualified: false, isMapped: false, mappedTo: null, mappedAt: null, submittedAt: null },
  { usn: "1RV22CS129", name: "Lakshmi Prasad", year: "2nd", track: "CSE", phase1Score: 0, qualified: false, isMapped: false, mappedTo: null, mappedAt: null, submittedAt: null },
  { usn: "1RV22CS156", name: "Nikhil Joshi", year: "2nd", track: "CSE", phase1Score: 0, qualified: false, isMapped: false, mappedTo: null, mappedAt: null, submittedAt: null },
  { usn: "1RV22CS187", name: "Pooja Hegde", year: "2nd", track: "CSE", phase1Score: 0, qualified: false, isMapped: false, mappedTo: null, mappedAt: null, submittedAt: null },
  { usn: "1RV22CS214", name: "Rahul Gowda", year: "2nd", track: "CSE", phase1Score: 0, qualified: false, isMapped: false, mappedTo: null, mappedAt: null, submittedAt: null }
];
