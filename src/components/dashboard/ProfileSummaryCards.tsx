import { motion } from "framer-motion";

interface Props {
  investor: {
    type: string;
    reason: string;
  };

  riskDescription: {
    band: string;
    volatility: string;
    psychology: string;
  };

  horizon: string;
}


export function ProfileSummaryCards({
  investor,
  riskDescription,
  horizon
}: Props) {


  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">


      <motion.div
        whileHover={{ scale: 1.02 }}
        className="rounded-xl bg-gray-50 p-4"
      >

        <p className="text-sm text-gray-500">
          סוג משקיע
        </p>

        <h3 className="mt-2 text-xl font-bold">
          {investor.type}
        </h3>

        <p className="mt-2 text-sm text-gray-600">
          {investor.reason}
        </p>

      </motion.div>



      <motion.div
        whileHover={{ scale: 1.02 }}
        className="rounded-xl bg-gray-50 p-4"
      >

        <p className="text-sm text-gray-500">
          רמת סיכון
        </p>

        <h3 className="mt-2 text-xl font-bold">
          {riskDescription.band}
        </h3>

        <p className="mt-2 text-sm text-gray-600">
          {riskDescription.volatility}
        </p>

      </motion.div>



      <motion.div
        whileHover={{ scale: 1.02 }}
        className="rounded-xl bg-gray-50 p-4"
      >

        <p className="text-sm text-gray-500">
          אופק השקעה
        </p>

        <h3 className="mt-2 text-xl font-bold">
          {horizon}
        </h3>

        <p className="mt-2 text-sm text-gray-600">
          זמן הוא מנוע הצמיחה המרכזי.
        </p>

      </motion.div>


    </div>
  );
}
