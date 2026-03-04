import { NextResponse } from "next/server";
import xml2js from "xml2js";

export const dynamic = "force-dynamic";

export async function GET() {

  const SERVICE_KEY = process.env.SERVICE_KEY;

  const base =
    "https://apis.data.go.kr/1230000/ad/BidPublicInfoService/getBidPblancListInfoServcPPSSrch"
    + "?ServiceKey=" + SERVICE_KEY
    + "&numOfRows=100&pageNo=1"
    + "&inqryDiv=1";

  const codes = [
    "1371029", // 국립중앙도서관
    "9720000"  // 국회도서관
  ];

  let result = [];

  const parser = new xml2js.Parser({ explicitArray:false });

  for(const code of codes){

    const url = `${base}&dminsttCd=${code}`;

    const res = await fetch(url);
    const xml = await res.text();

    const json = await parser.parseStringPromise(xml);

    let items = json?.response?.body?.items?.item;

    if(items){

      if(!Array.isArray(items)) items = [items];

      result.push(...items);

    }

  }

  return NextResponse.json(result);

}
