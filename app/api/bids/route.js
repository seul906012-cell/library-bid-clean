import { NextResponse } from "next/server";
import xml2js from "xml2js";

export const dynamic = "force-dynamic";

export async function GET() {

  const SERVICE_KEY = process.env.SERVICE_KEY;

  const today = new Date();
  const start = new Date();
  start.setDate(today.getDate() - 30);

  const fmt = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2,"0");
    const day = String(d.getDate()).padStart(2,"0");
    return `${y}${m}${day}`;
  };

  const baseUrl =
    `https://apis.data.go.kr/1230000/ad/BidPublicInfoService/getBidPblancListInfoServcPPSSrch`
    + `?ServiceKey=${SERVICE_KEY}`
    + `&numOfRows=100&pageNo=1`
    + `&inqryDiv=1`
    + `&inqryBgnDt=${fmt(start)}`
    + `&inqryEndDt=${fmt(today)}`;

  const codes = [
    "1371029", // 국립중앙도서관
    "9720000"  // 국회도서관
  ];

  let allItems = [];

  for (const code of codes) {

    const res = await fetch(`${baseUrl}&dminsttCd=${code}`);
    const xml = await res.text();

    const parser = new xml2js.Parser({ explicitArray:false });
    const json = await parser.parseStringPromise(xml);

    const items = json?.response?.body?.items?.item;

    if(items){
      if(Array.isArray(items)){
        allItems.push(...items);
      } else {
        allItems.push(items);
      }
    }

  }

  return NextResponse.json(allItems);

}
