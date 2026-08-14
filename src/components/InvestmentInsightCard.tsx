interface InvestmentInsightCardProps {

  finalBalance: number;

  totalContributed: number;

  growth: number;

  years: number;

  assetLabel: string;

  annualReturnPct: number;

  monthlyContribution: number;

  goal?: string;

}

export function InvestmentInsightCard({

  finalBalance,

  totalContributed,

  growth,

  years,

  assetLabel,

  annualReturnPct,

  monthlyContribution,

  goal: _goal

}: InvestmentInsightCardProps) {


  const growthPercentage =

    finalBalance > 0

      ?

      Math.round(
        growth /
        finalBalance *
        100
      )

      :

      0;


  const contributionPercentage =

    finalBalance > 0

      ?

      Math.round(
        totalContributed /
        finalBalance *
        100
      )

      :

      0;


  // -------------------------------------------------------------------------
  // Horizon Insight
  // -------------------------------------------------------------------------

  let insight = "";

  let icon = "";


  if (years >= 15) {

    insight =
      `אופק השקעה ארוך של ${years} שנים מאפשר לריבית דריבית להשפיע בצורה משמעותית על צמיחת ההון, אך חשוב עדיין להתאים את רמת הסיכון למטרת ההשקעה.`;

    icon =
      "🚀";

  }

  else if (years >= 5) {

    insight =
      `אופק השקעה בינוני של ${years} שנים מאפשר לשוק ההון לעבוד לטובת המשקיע לאורך זמן, תוך התחשבות בתנודתיות וברמת הסיכון.`;

    icon =
      "📈";

  }

  else {

    insight =
      "בטווח קצר יותר, לתנודתיות השוק יכולה להיות השפעה משמעותית ולכן חשוב להתאים את רמת הסיכון לאופק ההשקעה.";

    icon =
      "⚠️";

  }


  // -------------------------------------------------------------------------
  // Investment Multiple
  // -------------------------------------------------------------------------

  const investmentMultiple =

    totalContributed > 0

      ?

      finalBalance /
      totalContributed

      :

      0;


  return (

    <div
      className="
        bg-card
        border
        border-border
        rounded-3xl
        p-6
        shadow-soft
      "
    >

      <h2
        className="
          text-2xl
          font-bold
          mb-6
        "
      >
        AI Simulation
      </h2>


      <h3
        className="
          text-xl
          font-bold
          mb-2
        "
      >
        ניתוח חכם של תרחיש ההשקעה שלך
      </h3>


      <p
        className="
          text-slate-400
          mb-6
        "
      >
        המערכת ניתחה את הנתונים והמחישה כיצד זמן,
        תשואה והפקדות משפיעים על התוצאה.
      </p>


      {/* -------------------------------------------------------------------
          Main Metrics
      -------------------------------------------------------------------- */}

      <div
        className="
          grid
          md:grid-cols-3
          gap-5
          mb-6
        "
      >

        <div
          className="
            bg-[#050B16]
            border
            border-[#1E3A5F]
            rounded-2xl
            p-5
          "
        >

          <p
            className="
              text-sm
              text-slate-400
              mb-2
            "
          >
            נכס שנבחר
          </p>


          <p
            className="
              text-xl
              font-bold
              text-white
            "
          >
            {assetLabel}
          </p>


          <p
            className="
              mt-2
              text-slate-400
            "
          >
            תשואה שנתית משוערת:

            {" "}

            <span
              className="
                text-white
                font-bold
              "
            >
              {annualReturnPct}%
            </span>

          </p>

        </div>


        <div
          className="
            bg-[#050B16]
            border
            border-[#1E3A5F]
            rounded-2xl
            p-5
          "
        >

          <p
            className="
              text-sm
              text-slate-400
              mb-2
            "
          >
            סה״כ השקעה
          </p>


          <p
            className="
              text-2xl
              font-bold
              text-white
            "
          >
            {new Intl.NumberFormat(
              "he-IL",
              {
                style: "currency",
                currency: "ILS",
                maximumFractionDigits: 0
              }
            ).format(totalContributed)}
          </p>


          <p
            className="
              mt-2
              text-slate-400
            "
          >
            הפקדה חודשית:

            {" "}

            <span
              className="
                text-white
                font-bold
              "
            >
              {new Intl.NumberFormat(
                "he-IL",
                {
                  style: "currency",
                  currency: "ILS",
                  maximumFractionDigits: 0
                }
              ).format(monthlyContribution)}
            </span>

          </p>

        </div>


        <div
          className="
            bg-[#050B16]
            border
            border-[#1E3A5F]
            rounded-2xl
            p-5
          "
        >

          <p
            className="
              text-sm
              text-slate-400
              mb-2
            "
          >
            שווי סופי
          </p>


          <p
            className="
              text-2xl
              font-bold
              text-emerald-400
            "
          >
            {new Intl.NumberFormat(
              "he-IL",
              {
                style: "currency",
                currency: "ILS",
                maximumFractionDigits: 0
              }
            ).format(finalBalance)}
          </p>


          <p
            className="
              mt-2
              text-slate-400
            "
          >
            מכפיל השקעה:

            {" "}

            <span
              className="
                text-white
                font-bold
              "
            >
              x{investmentMultiple.toFixed(1)}
            </span>

          </p>

        </div>

      </div>


      {/* -------------------------------------------------------------------
          Horizon
      -------------------------------------------------------------------- */}

      <div
        className="
          bg-[#050B16]
          border
          border-[#1E3A5F]
          rounded-2xl
          p-5
          mb-6
        "
      >

        <p
          className="
            text-slate-300
            leading-7
          "
        >
          {icon} {insight}
        </p>

      </div>


      {/* -------------------------------------------------------------------
          Growth Breakdown
      -------------------------------------------------------------------- */}

      <div
        className="
          mb-6
        "
      >

        <h3
          className="
            text-lg
            font-bold
            mb-4
          "
        >
          💰 מתוך השווי הסופי:
        </h3>


        <div
          className="
            grid
            md:grid-cols-2
            gap-4
          "
        >

          <div
            className="
              bg-[#050B16]
              border
              border-[#1E3A5F]
              rounded-2xl
              p-5
            "
          >

            <p
              className="
                text-slate-400
                mb-2
              "
            >
              📈 צמיחת ההשקעה
            </p>


            <p
              className="
                text-2xl
                font-bold
                text-emerald-400
              "
            >
              {growthPercentage}%
            </p>

          </div>


          <div
            className="
              bg-[#050B16]
              border
              border-[#1E3A5F]
              rounded-2xl
              p-5
            "
          >

            <p
              className="
                text-slate-400
                mb-2
              "
            >
              💰 כסף שהופקד
            </p>


            <p
              className="
                text-2xl
                font-bold
                text-white
              "
            >
              {contributionPercentage}%
            </p>

          </div>

        </div>


        <p
          className="
            mt-4
            text-slate-300
            leading-7
          "
        >
          כ־{growthPercentage}% מהשווי הסופי נוצר מצמיחת ההשקעה,
          וכ־{contributionPercentage}% הגיעו מהכסף שהופקד.
        </p>

      </div>


      {/* -------------------------------------------------------------------
          Monthly Contribution
      -------------------------------------------------------------------- */}

      <div
        className="
          border-t
          border-[#1E3A5F]
          pt-5
        "
      >

        <p
          className="
            text-slate-400
          "
        >
          📌 הפקדה חודשית
        </p>


        <p
          className="
            mt-1
            text-xl
            font-bold
            text-white
          "
        >
          {new Intl.NumberFormat(
            "he-IL",
            {
              style: "currency",
              currency: "ILS",
              maximumFractionDigits: 0
            }
          ).format(monthlyContribution)}

          {" "}בחודש
        </p>

      </div>

    </div>

  );

}
