import { NextResponse } from "next/server";
import xml2js from "xml2js";

export const dynamic = "force-dynamic";

export async function GET() {

  const SERVICE_KEY = process.env.SERVICE_KEY;

  const url =
    `https://apis.data.go.kr/1230000/BidPublicInfoService/getBidPblancListInfoServc` +
    `?ServiceKey=${SERVICE_KEY}` +
    `&numOfRows=100&pageNo=1`;

  const res = await fetch(url);
  const xml = await res.text();

  const parser = new xml2js.Parser({ explicitArray:false });
  const json = await parser.parseStringPromise(xml);

  let items = [];

  if (json?.response?.body?.items?.item) {
    items = json.response.body.items.item;
    if (!Array.isArray(items)) items = [items];
  }

  return NextResponse.json(items);
}
