import { NextResponse } from "next/server";
import xml2js from "xml2js";

export const dynamic = "force-dynamic";

export async function GET(){

  const SERVICE_KEY = process.env.SERVICE_KEY;

  const today = new Date();

  const format = (d)=>{
    const y=d.getFullYear();
    const m=String(d.getMonth()+1).padStart(2,"0");
    const day=String(d.getDate()).padStart(2,"0");
    return `${y}${m}${day}`;
  };

  const parser = new xml2js.Parser({ explicitArray:false });

  let all = [];

  for(let i=0;i<3;i++){

    const end = new Date();
    end.setDate(today.getDate() - (i*20));

    const start = new Date();
    start.setDate(today.getDate() - (i*20+20));

    const url =
    "https://apis.data.go.kr/1230000/ad/BidPublicInfoService/getBidPblancListInfoServcPPSSrch"
    + "?ServiceKey="+SERVICE_KEY
    + "&numOfRows=200&pageNo=1"
    + "&inqryDiv=1"
    + "&inqryBgnDt="+format(start)
    + "&inqryEndDt="+format(end);

    const res = await fetch(url);
    const xml = await res.text();

    const json = await parser.parseStringPromise(xml);

    let items = json?.response?.body?.items?.item || [];

    if(!Array.isArray(items)) items=[items];

    all = all.concat(items);
  }

  return NextResponse.json(all);
}
