import { useLanguage } from "@/context/languageContext";

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export function useQuizBank(): QuizQuestion[] {
  const { t } = useLanguage();

  return [
    {
      id: "q1",
      question: t("quiz_q1"),
      options: [t("quiz_q1_o1"), t("quiz_q1_o2"), t("quiz_q1_o3")],
      correctIndex: 1,
      explanation: t("quiz_q1_e"),
    },
    {
      id: "q2",
      question: t("quiz_q2"),
      options: [t("quiz_q2_o1"), t("quiz_q2_o2"), t("quiz_q2_o3")],
      correctIndex: 1,
      explanation: t("quiz_q2_e"),
    },
    {
      id: "q3",
      question: t("quiz_q3"),
      options: [t("quiz_q3_o1"), t("quiz_q3_o2"), t("quiz_q3_o3")],
      correctIndex: 1,
      explanation: t("quiz_q3_e"),
    },
    {
      id: "q4",
      question: t("quiz_q4"),
      options: [t("quiz_q4_o1"), t("quiz_q4_o2"), t("quiz_q4_o3")],
      correctIndex: 1,
      explanation: t("quiz_q4_e"),
    },
    {
      id: "q5",
      question: t("quiz_q5"),
      options: [t("quiz_q5_o1"), t("quiz_q5_o2"), t("quiz_q5_o3")],
      correctIndex: 1,
      explanation: t("quiz_q5_e"),
    },
    {
      id: "q6",
      question: t("quiz_q6"),
      options: [t("quiz_q6_o1"), t("quiz_q6_o2"), t("quiz_q6_o3")],
      correctIndex: 2,
      explanation: t("quiz_q6_e"),
    },
    {
      id: "q7",
      question: t("quiz_q7"),
      options: [t("quiz_q7_o1"), t("quiz_q7_o2"), t("quiz_q7_o3")],
      correctIndex: 1,
      explanation: t("quiz_q7_e"),
    },
    {
      id: "q8",
      question: t("quiz_q8"),
      options: [t("quiz_q8_o1"), t("quiz_q8_o2"), t("quiz_q8_o3")],
      correctIndex: 2,
      explanation: t("quiz_q8_e"),
    },
    {
      id: "q9",
      question: t("quiz_q9"),
      options: [t("quiz_q9_o1"), t("quiz_q9_o2"), t("quiz_q9_o3")],
      correctIndex: 0,
      explanation: t("quiz_q9_e"),
    },
    {
      id: "q10",
      question: t("quiz_q10"),
      options: [t("quiz_q10_o1"), t("quiz_q10_o2"), t("quiz_q10_o3")],
      correctIndex: 0,
      explanation: t("quiz_q10_e"),
    },
    {
      id: "q11",
      question: t("quiz_q11"),
      options: [t("quiz_q11_o1"), t("quiz_q11_o2"), t("quiz_q11_o3")],
      correctIndex: 2,
      explanation: t("quiz_q11_e"),
    },
    {
      id: "q12",
      question: t("quiz_q12"),
      options: [t("quiz_q12_o1"), t("quiz_q12_o2"), t("quiz_q12_o3")],
      correctIndex: 2,
      explanation: t("quiz_q12_e"),
    },
    {
      id: "q13",
      question: t("quiz_q13"),
      options: [t("quiz_q13_o1"), t("quiz_q13_o2"), t("quiz_q13_o3")],
      correctIndex: 2,
      explanation: t("quiz_q13_e"),
    },
    {
      id: "q14",
      question: t("quiz_q14"),
      options: [t("quiz_q14_o1"), t("quiz_q14_o2"), t("quiz_q14_o3")],
      correctIndex: 1,
      explanation: t("quiz_q14_e"),
    },
    {
      id: "q15",
      question: t("quiz_q15"),
      options: [t("quiz_q15_o1"), t("quiz_q15_o2"), t("quiz_q15_o3")],
      correctIndex: 0,
      explanation: t("quiz_q15_e"),
    },
    {
      id: "q16",
      question: t("quiz_q16"),
      options: [t("quiz_q16_o1"), t("quiz_q16_o2"), t("quiz_q16_o3")],
      correctIndex: 1,
      explanation: t("quiz_q16_e"),
    },
    {
      id: "q17",
      question: t("quiz_q17"),
      options: [t("quiz_q17_o1"), t("quiz_q17_o2"), t("quiz_q17_o3")],
      correctIndex: 1,
      explanation: t("quiz_q17_e"),
    },
    {
      id: "q18",
      question: t("quiz_q18"),
      options: [t("quiz_q18_o1"), t("quiz_q18_o2"), t("quiz_q18_o3")],
      correctIndex: 1,
      explanation: t("quiz_q18_e"),
    },
    {
      id: "q19",
      question: t("quiz_q19"),
      options: [t("quiz_q19_o1"), t("quiz_q19_o2"), t("quiz_q19_o3")],
      correctIndex: 1,
      explanation: t("quiz_q19_e"),
    },
    {
      id: "q20",
      question: t("quiz_q20"),
      options: [t("quiz_q20_o1"), t("quiz_q20_o2"), t("quiz_q20_o3")],
      correctIndex: 1,
      explanation: t("quiz_q20_e"),
    },
    {
      id: "q21",
      question: t("quiz_q21"),
      options: [t("quiz_q21_o1"), t("quiz_q21_o2"), t("quiz_q21_o3")],
      correctIndex: 2,
      explanation: t("quiz_q21_e"),
    },
    {
      id: "q22",
      question: t("quiz_q22"),
      options: [t("quiz_q22_o1"), t("quiz_q22_o2"), t("quiz_q22_o3")],
      correctIndex: 2,
      explanation: t("quiz_q22_e"),
    },
    {
      id: "q23",
      question: t("quiz_q23"),
      options: [t("quiz_q23_o1"), t("quiz_q23_o2"), t("quiz_q23_o3")],
      correctIndex: 2,
      explanation: t("quiz_q23_e"),
    },
    {
      id: "q24",
      question: t("quiz_q24"),
      options: [t("quiz_q24_o1"), t("quiz_q24_o2"), t("quiz_q24_o3")],
      correctIndex: 1,
      explanation: t("quiz_q24_e"),
    },
    {
      id: "q25",
      question: t("quiz_q25"),
      options: [t("quiz_q25_o1"), t("quiz_q25_o2"), t("quiz_q25_o3")],
      correctIndex: 2,
      explanation: t("quiz_q25_e"),
    },
  ];
}
