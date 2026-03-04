import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SERVICE_KEY = process.env.SERVICE_KEY;

function getToday() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export async function GET() {
  try {
    const today = getToday();

    const url =
      "https://apis.data.go.kr/1230000/BidPublicInfoService/getBidPblancListInfoServc" +
      `?serviceKey=${SERVICE_KEY}` +
      "&numOfRows=10" +
      "&pageNo=1" +
      "&inqryDiv=2" +                  // 등록일 기준 조회
      `&registDtBgn=20240101` +
      `&registDtEnd=${today}`;

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
