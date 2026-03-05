import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const SERVICE_KEY = process.env.SERVICE_KEY;

  // 두 가지 방법 모두 테스트
  const encodedKey = encodeURIComponent(SERVICE_KEY);
  
  // 테스트 1: 원본 키 그대로 사용
  const testUrl1 = `https://apis.data.go.kr/1230000/BidPublicInfoService/getBidPblancListInfoServc?serviceKey=${SERVICE_KEY}&numOfRows=10&pageNo=1`;
  
  // 테스트 2: 인코딩된 키 사용
  const testUrl2 = `https://apis.data.go.kr/1230000/BidPublicInfoService/getBidPblancListInfoServc?serviceKey=${encodedKey}&numOfRows=10&pageNo=1`;

  try {
    // 테스트 1: 원본 키
    const res1 = await fetch(testUrl1);
    const xml1 = await res1.text();
    
    // 테스트 2: 인코딩된 키
    const res2 = await fetch(testUrl2);
    const xml2 = await res2.text();

    return NextResponse.json({
      test1_raw_key: {
        status: res1.status,
        statusText: res1.statusText,
        responsePreview: xml1.substring(0, 500),
        containsResponse: xml1.includes("<response"),
        containsItems: xml1.includes("<item>"),
        containsError: xml1.toLowerCase().includes("error"),
      },
      test2_encoded_key: {
        status: res2.status,
        statusText: res2.statusText,
        responsePreview: xml2.substring(0, 500),
        containsResponse: xml2.includes("<response"),
        containsItems: xml2.includes("<item>"),
        containsError: xml2.toLowerCase().includes("error"),
      },
      serviceKeyInfo: {
        hasServiceKey: !!SERVICE_KEY,
        length: SERVICE_KEY?.length || 0,
        preview: SERVICE_KEY
          ? `${SERVICE_KEY.substring(0, 10)}...${SERVICE_KEY.substring(SERVICE_KEY.length - 10)}`
          : "NOT_SET",
      },
    });
  } catch (error) {
    return NextResponse.json({
      error: error.message,
      hasServiceKey: !!SERVICE_KEY,
    });
  }
}
