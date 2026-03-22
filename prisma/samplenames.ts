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
  { usn: "1SI25CS011", name: "Arjun Sharma", year: "1st", track: "CSE", phase1Score: 0, qualified: false, isMapped: false, mappedTo: null, mappedAt: null, submittedAt: null },
  { usn: "1SI25CS042", name: "Priya Nair", year: "1st", track: "CSE", phase1Score: 0, qualified: false, isMapped: false, mappedTo: null, mappedAt: null, submittedAt: null },
  { usn: "1SI25CS067", name: "Rohit Verma", year: "1st", track: "CSE", phase1Score: 0, qualified: false, isMapped: false, mappedTo: null, mappedAt: null, submittedAt: null },
  { usn: "1SI25CS089", name: "Sneha Reddy", year: "1st", track: "CSE", phase1Score: 0, qualified: false, isMapped: false, mappedTo: null, mappedAt: null, submittedAt: null },
  { usn: "1SI25C103", name: "Karan Mehta", year: "1st", track: "CSE", phase1Score: 0, qualified: false, isMapped: false, mappedTo: null, mappedAt: null, submittedAt: null },
  { usn: "1SI25CS124", name: "Divya Krishnan", year: "1st", track: "CSE", phase1Score: 0, qualified: false, isMapped: false, mappedTo: null, mappedAt: null, submittedAt: null },
  { usn: "1SI25CS138", name: "Aditya Rao", year: "1st", track: "CSE", phase1Score: 0, qualified: false, isMapped: false, mappedTo: null, mappedAt: null, submittedAt: null },
  { usn: "1SI24CS021", name: "Meera Iyer", year: "2nd", track: "CSE", phase1Score: 0, qualified: false, isMapped: false, mappedTo: null, mappedAt: null, submittedAt: null },
  { usn: "1SI24CS044", name: "Vikram Singh", year: "2nd", track: "CSE", phase1Score: 0, qualified: false, isMapped: false, mappedTo: null, mappedAt: null, submittedAt: null },
  { usn: "1SI24CS073", name: "Ananya Bhat", year: "2nd", track: "CSE", phase1Score: 0, qualified: false, isMapped: false, mappedTo: null, mappedAt: null, submittedAt: null },
  { usn: "1SI24IS108", name: "Suresh Kumar", year: "2nd", track: "CSE", phase1Score: 0, qualified: false, isMapped: false, mappedTo: null, mappedAt: null, submittedAt: null },
  { usn: "1SI24CS129", name: "Lakshmi Prasad", year: "2nd", track: "CSE", phase1Score: 0, qualified: false, isMapped: false, mappedTo: null, mappedAt: null, submittedAt: null },
  { usn: "1SI24CS156", name: "Nikhil Joshi", year: "2nd", track: "CSE", phase1Score: 0, qualified: false, isMapped: false, mappedTo: null, mappedAt: null, submittedAt: null },
  { usn: "1SI24CI18", name: "Pooja Hegde", year: "2nd", track: "CSE", phase1Score: 0, qualified: false, isMapped: false, mappedTo: null, mappedAt: null, submittedAt: null },
  { usn: "1SI24AD21", name: "Rahul Gowda", year: "2nd", track: "CSE", phase1Score: 0, qualified: false, isMapped: false, mappedTo: null, mappedAt: null, submittedAt: null }
];
