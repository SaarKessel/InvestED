import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RTooltip,
} from "recharts";

import { useLanguage } from "@/context/languageContext";



interface CandleDatum {

  date:string;

  open?:number;

  high?:number;

  low?:number;

  close?:number;

  price:number;

}




interface CandleShapeProps {

  x?:number;

  y?:number;

  width?:number;

  height?:number;

  payload?: CandleDatum;

}




const UP_COLOR =
"#22c55e";


const DOWN_COLOR =
"#ef4444";







function CandleShape(
props:CandleShapeProps
){


const {

x=0,

y=0,

width=0,

height=0,

payload

}=props;






if(
!payload ||
payload.open == null ||
payload.close == null ||
payload.high == null ||
payload.low == null
){

return null;

}




const {

open,

close,

high,

low

}=payload;







const isUp =
close >= open;



const color =
isUp
?
UP_COLOR
:
DOWN_COLOR;






const bodyTop =
Math.min(
y,
y + height
);



const bodyHeight =
Math.max(
Math.abs(height),
1
);



const centerX =
x + width / 2;




const priceRange =
Math.abs(
close - open
);



const pixelsPerUnit =
priceRange > 0
?
bodyHeight / priceRange
:
0;




const wickTop =

pixelsPerUnit > 0

?

bodyTop -
(high - Math.max(open,close))
*
pixelsPerUnit

:

bodyTop - 5;




const wickBottom =

pixelsPerUnit > 0

?

bodyTop +
bodyHeight +
(Math.min(open,close)-low)
*
pixelsPerUnit

:

bodyTop +
bodyHeight +
5;




return (

<g>


<line

x1={centerX}

x2={centerX}

y1={wickTop}

y2={wickBottom}

stroke={color}

strokeWidth={1.2}

/>



<rect

x={x}

y={bodyTop}

width={Math.max(width,2)}

height={bodyHeight}

fill={color}

rx={1}

/>


</g>


);




}








export function CandlestickChart(
{
data
}:{
data:CandleDatum[]
}
){

  const { t } = useLanguage();




if(
!data.length
){

return null;

}




const chartData =

data.map(item=>(


{

...item,


bodyRange:

item.open != null &&
item.close != null

?

[
Math.min(
item.open,
item.close
),

Math.max(
item.open,
item.close
)

]

:

[0,0]


}




));




return (

<ResponsiveContainer

width="100%"

height="100%"

>


<ComposedChart

data={chartData}

margin={{
top:5,
right:5,
bottom:0,
left:0
}}

>



<XAxis

dataKey="date"

hide

/>



<YAxis

hide

domain={[
"dataMin - 1",
"dataMax + 1"
]}

/>





<Line

dataKey="high"

stroke="none"

dot={false}

activeDot={false}

isAnimationActive={false}

/>




<Line

dataKey="low"

stroke="none"

dot={false}

activeDot={false}

isAnimationActive={false}

/>





<RTooltip

content={({active,payload})=>{


if(
!active ||
!payload?.length
){

return null;

}




const candle =
payload[0].payload as CandleDatum;




return (

<div className="
rounded-xl border border-border
bg-card px-3 py-2 text-[11px]
shadow-lg
">

<p className="mb-1 font-bold">

{candle.date}

</p>


<p>
{t("candle_open", "פתיחה:")}
${candle.open?.toFixed(2)}
</p>


<p>
{t("candle_close", "סגירה:")}
${candle.close?.toFixed(2)}
</p>


<p>
{t("candle_high", "גבוה:")}
${candle.high?.toFixed(2)}
</p>


<p>
{t("candle_low", "נמוך:")}
${candle.low?.toFixed(2)}
</p>



</div>


);

}}



/>



<Bar

dataKey="bodyRange"

shape={
<CandleShape />
}

isAnimationActive={false}

/>





</ComposedChart>


</ResponsiveContainer>



);


}
