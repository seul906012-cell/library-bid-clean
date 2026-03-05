import { NextResponse } from "next/server";
import xml2js from "xml2js";

export const dynamic = "force-dynamic";

export async function GET() {

  const SERVICE_KEY = process.env.SERVICE_KEY;

  const base =
    "https://apis.data.go.kr/1230000/BidPublicInfoService/getBidPblancListInfoServc";

  const parser = new xml2js.Parser({ explicitArray: false });

  async function fetchData(url) {
    try {
      const res = await fetch(url);
      const xml = await res.text();

      // 디버깅: API 응답 확인
      console.log("API Response Status:", res.status);
      console.log("API Response (first 500 chars):", xml.substring(0, 500));

      // XML이 아닐 경우 (Unexpected errors 등)
      if (!xml || !xml.includes("<response")) {
        console.error("Invalid XML response");
        return [];
      }

      const json = await parser.parseStringPromise(xml);

      // 디버깅: 파싱된 JSON 구조 확인
      console.log("Parsed JSON structure:", JSON.stringify(json).substring(0, 500));

      let items = json?.response?.body?.items?.item || [];

      if (!Array.isArray(items)) items = [items];

      console.log("Items count:", items.length);

      return items;
    } catch (err) {
      console.error("fetchData error:", err);
      return [];
    }
  }

  // 디버깅: SERVICE_KEY 확인
  console.log("SERVICE_KEY exists:", !!SERVICE_KEY);
  console.log("SERVICE_KEY length:", SERVICE_KEY?.length || 0);

  // SERVICE_KEY를 URL 인코딩 (특수문자가 있을 경우 필수)
  const encodedKey = encodeURIComponent(SERVICE_KEY);
  const query = `serviceKey=${encodedKey}&numOfRows=200&pageNo=1`;

  /* 전체 목록 가져오기 */

  const items = await fetchData(`${base}?${query}`);

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
