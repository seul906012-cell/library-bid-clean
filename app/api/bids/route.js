import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SERVICE_KEY = process.env.SERVICE_KEY;

export async function GET() {
  try {
    const url =
      "https://apis.data.go.kr/1230000/ad/BidPublicInfoService/getBidPblancListInfoServc" +
      `?serviceKey=${SERVICE_KEY}` +
      "&numOfRows=10" +
      "&pageNo=1" +
      "&type=xml";

    const response = await fetch(url);
    const text = await response.text();

    return NextResponse.json({
      url,
      raw: text
    });
  } catch (err) {
    return NextResponse.json({ error: err.message });
  }
}
