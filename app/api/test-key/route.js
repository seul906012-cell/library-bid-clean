import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const SERVICE_KEY = process.env.SERVICE_KEY;

  const testUrl = `https://apis.data.go.kr/1230000/BidPublicInfoService/getBidPblancListInfoServc?serviceKey=${SERVICE_KEY}&numOfRows=10&pageNo=1`;

  try {
    const res = await fetch(testUrl);
    const xml = await res.text();

    return NextResponse.json({
      status: res.status,
      statusText: res.statusText,
      hasServiceKey: !!SERVICE_KEY,
      serviceKeyLength: SERVICE_KEY?.length || 0,
      // SERVICE_KEY의 앞 10자와 뒤 10자만 표시 (보안)
      serviceKeyPreview: SERVICE_KEY
        ? `${SERVICE_KEY.substring(0, 10)}...${SERVICE_KEY.substring(SERVICE_KEY.length - 10)}`
        : "NOT_SET",
      responsePreview: xml.substring(0, 1000),
      responseLength: xml.length,
      containsResponse: xml.includes("<response"),
      containsError: xml.includes("ERROR"),
      url: testUrl.replace(SERVICE_KEY, "***HIDDEN***"),
    });
  } catch (error) {
    return NextResponse.json({
      error: error.message,
      hasServiceKey: !!SERVICE_KEY,
    });
  }
}
