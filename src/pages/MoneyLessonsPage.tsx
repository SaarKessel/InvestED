import { useLanguage } from "@/context/languageContext";
import { CalibrationLesson } from "@/components/lessons/CalibrationLesson";
import { FilingsCompareLesson } from "@/components/lessons/FilingsCompareLesson";
import { MoneyWeightedLesson } from "@/components/lessons/MoneyWeightedLesson";
import { RentBuyLab } from "@/components/lessons/RentBuyLab";

/** Five short lessons. Each is math or official filings with the learner's own numbers; none gives advice. */
export default function MoneyLessonsPage() {
  const { language } = useLanguage();
  const he = language === "he";
  return <div className="space-y-4 p-4"><MoneyWeightedLesson he={he} /><RentBuyLab he={he} /><CalibrationLesson he={he} /><FilingsCompareLesson he={he} /></div>;
}
