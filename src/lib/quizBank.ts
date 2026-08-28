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
  ];
}
