import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(){

const SERVICE_KEY = process.env.SERVICE_KEY;

const base =
"https://apis.data.go.kr/1230000/ad/BidPublicInfoService/getBidPblancListInfoServc";

function format(d){
const y=d.getFullYear();
const m=String(d.getMonth()+1).padStart(2,"0");
const day=String(d.getDate()).padStart(2,"0");
return `${y}${m}${day}`;
}

const today = new Date();
const start = new Date();
start.setDate(today.getDate()-60);

const url =
`${base}?ServiceKey=${SERVICE_KEY}
&numOfRows=10
&pageNo=1
&inqryDiv=1
&inqryBgnDt=${format(start)}
&inqryEndDt=${format(today)}`
.replace(/\n/g,"");

try{

const res = await fetch(url);

const xml = await res.text();

return new NextResponse(xml,{
headers:{
"Content-Type":"text/xml"
}
});

}catch(err){

return NextResponse.json({
error:String(err)
});

}

}
