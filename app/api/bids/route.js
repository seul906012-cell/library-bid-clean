import { NextResponse } from "next/server";
import xml2js from "xml2js";

export const dynamic = "force-dynamic";

export async function GET() {

  const SERVICE_KEY = process.env.SERVICE_KEY;

  // 올바른 엔드포인트 (공공데이터포털에서 확인)
  const baseUrl = "https://apis.data.go.kr/1230000/ad/BidPublicInfoService";
  
  // 용역 검색용 operation (목록 조회)
  const operation = "getBidPblancListInfoServcPPSSrch";   // 용역 검색

  const parser = new xml2js.Parser({ explicitArray: false });

  async function fetchData(url) {
    try {
      const res = await fetch(url);
      const xml = await res.text();

      // 디버깅: API 응답 확인
      console.log("API Response Status:", res.status);
      console.log("API Response (first 200 chars):", xml.substring(0, 200));

      // XML이 아닐 경우 (Unexpected errors 등)
      if (!xml || !xml.includes("<response")) {
        console.error("Invalid XML response");
        return [];
      }

      const json = await parser.parseStringPromise(xml);

      let items = json?.response?.body?.items?.item || [];

      if (!Array.isArray(items)) items = [items];

      return items;
    } catch (err) {
      console.error("fetchData error:", err);
      return [];
    }
  }

  // 디버깅: SERVICE_KEY 확인
  console.log("SERVICE_KEY exists:", !!SERVICE_KEY);
  console.log("SERVICE_KEY length:", SERVICE_KEY?.length || 0);

  // 날짜 설정: 최근 7일간의 데이터 (API 제한 때문에 긴 기간은 에러 발생)
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  };
  
  const inqryBgnDt = `${formatDate(weekAgo)}0000`;
  const inqryEndDt = `${formatDate(today)}2359`;

  // SERVICE_KEY를 URL 인코딩하지 않음 (문서에서 확인)
  const query = `inqryDiv=1&inqryBgnDt=${inqryBgnDt}&inqryEndDt=${inqryEndDt}&numOfRows=200&pageNo=1&ServiceKey=${SERVICE_KEY}`;

  /* 용역 업무구분에서 데이터 가져오기 */
  
  const url = `${baseUrl}/${operation}?${query}`;
  console.log(`Fetching from: ${operation}`);
  console.log(`Date range: ${inqryBgnDt} ~ ${inqryEndDt}`);
  const items = await fetchData(url);
  
  console.log("Total items fetched:", items.length);

  /* 기관 필터 */

  const national = items.filter(
    (i) => (i.dminsttNm || "").includes("국립중앙도서관")
  );

  const assembly = items.filter(
    (i) => (i.dminsttNm || "").includes("국회도서관")
  );

  /* 키워드 필터 */

  const keywords = [
    "도서관",
    "기록물",
    "DB",
    "DB구축",
    "디지털",
    "디지털화",
  ];

  const keyword = items.filter((i) =>
    keywords.some((k) => (i.bidNtceNm || "").includes(k))
  );

  /* 전체 합치기 */

  const map = new Map();
  const all = [];

  [...national, ...assembly, ...keyword].forEach((item) => {
    if (!map.has(item.bidNtceNo)) {
      map.set(item.bidNtceNo, true);
      all.push(item);
    }
  });

  return NextResponse.json({
    national,
    assembly,
    keyword,
    all,
    debug: {
      hasServiceKey: !!SERVICE_KEY,
      totalItems: items.length,
      timestamp: new Date().toISOString(),
    },
  });
}
