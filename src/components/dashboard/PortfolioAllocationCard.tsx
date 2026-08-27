import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { AllocationItem } from "../../types";
import { useLanguage } from "@/context/languageContext";


interface Props {
  allocation: AllocationItem[];
}


export function PortfolioAllocationCard({
  allocation,
}: Props) {

  const { t } = useLanguage();


  return (

    <div className="rounded-2xl bg-white p-6 shadow">

      <h2 className="mb-5 text-xl font-bold">
        {t("portfolio_allocation_title_short", "הקצאת תיק מומלצת 📊")}
      </h2>


      <div className="h-72">

        <ResponsiveContainer width="100%" height="100%">

          <PieChart>

            <Pie

              data={allocation}

              dataKey="value"

              nameKey="name"

              cx="50%"

              cy="50%"

              outerRadius={90}

              label

            >

              {allocation.map((item, index) => (

                <Cell

                  key={index}

                  fill={item.color}

                />

              ))}


            </Pie>


            <Tooltip />

          </PieChart>


        </ResponsiveContainer>


      </div>



      <div className="mt-5 space-y-3">{allocation.map((item) => (

          <div

            key={item.name}

            className="flex justify-between rounded-xl bg-gray-50 p-3"

          >

            <span>

              {item.name}

            </span>


            <span className="font-bold">

              {item.value}%

            </span>


          </div>


        ))}


      </div>


    </div>

  );
}
