import { generateInvestmentReport } from "../../lib/reportGenerator";


interface Props{
  result:any;
}



export function DownloadReportCard({result}:Props){



function download(){


  generateInvestmentReport(result);


}




return (


<div className="rounded-2xl bg-white p-6 shadow">


<h2 className="text-xl font-bold">

📄 Export Report

</h2>



<button

onClick={download}

className="mt-4 rounded-xl bg-blue-600 px-5 py-2 text-white"

>

Download AI Report PDF

</button>



</div>


);


}
