import { NextResponse } from "next/server";
import { parseStringPromise } from "xml2js";

export const dynamic = "force-dynamic";

const SERVICE_KEY = process.env.SERVICE_KEY;

export async function GET() {
  try {
    const url =
      "https://apis.data.go.kr/1230000/BidPublicInfoService/getBidPblancListInfoServcPPSSrch" +
      `?serviceKey=${SERVICE_KEY}` +
      "&numOfRows=10" +
      "&pageNo=1";

    const response = await fetch(url);
    const xml = await response.text();

    const json = await parseStringPromise(xml, {
      explicitArray: false
    });

    const items =
      json?.response?.body?.items?.item || [];

    return NextResponse.json(items);
  } catch (err) {
    return NextResponse.json({ error: err.message });
  }
}
