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

  const url =
    `https://apis.data.go.kr/1230000/ad/BidPublicInfoService/getBidPblancListInfoServcPPSSrch` +
    `?ServiceKey=${SERVICE_KEY}` +
    `&numOfRows=100&pageNo=1` +
    `&inqryDiv=1` +
    `&inqryBgnDt=${fmt(start)}` +
    `&inqryEndDt=${fmt(today)}`;

  const res = await fetch(url);
  const xml = await res.text();

  const parser = new xml2js.Parser({ explicitArray:false });
  const json = await parser.parseStringPromise(xml);

  let items = [];

  if (
    json &&
    json.response &&
    json.response.body &&
    json.response.body.items &&
    json.response.body.items.item
  ) {
    items = json.response.body.items.item;

    if (!Array.isArray(items)) {
      items = [items];
    }
  }

  return NextResponse.json(items);

}
