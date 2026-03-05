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

      // XML이 아닐 경우 (Unexpected errors 등)
      if (!xml || !xml.includes("<response")) {
        return [];
      }

      const json = await parser.parseStringPromise(xml);

      let items = json?.response?.body?.items?.item || [];

      if (!Array.isArray(items)) items = [items];

      return items;
    } catch (err) {
      return [];
    }
  }

  const query = `serviceKey=${SERVICE_KEY}&numOfRows=200&pageNo=1`;

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
  });
}
