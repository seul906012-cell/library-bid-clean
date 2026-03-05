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

  // 날짜 설정: 최근 2개월간의 데이터
  // API 제한 때문에 7일 단위로 나눠서 조회
  const today = new Date();
  const twoMonthsAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);
  
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  };
  
  // 7일 단위로 날짜 구간 생성
  const dateRanges = [];
  let currentStart = new Date(twoMonthsAgo);
  
  while (currentStart < today) {
    const currentEnd = new Date(currentStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    // 마지막 구간은 오늘까지
    const endDate = currentEnd > today ? today : currentEnd;
    
    dateRanges.push({
      start: `${formatDate(currentStart)}0000`,
      end: `${formatDate(endDate)}2359`
    });
    
    currentStart = new Date(currentEnd.getTime() + 1000); // 다음 구간 시작 (1초 후)
  }
  
  console.log(`Date ranges created: ${dateRanges.length} periods`);

  // 기관코드
  const nationalLibraryCode = "1371029"; // 문화체육관광부 국립중앙도서관
  const assemblyLibraryCode = "9720000"; // 국회 국회도서관
  
  // 키워드 목록
  const keywords = [
    "도서관",
    "기록물",
    "DB",
    "DB구축",
    "디지털",
    "디지털화",
  ];

  /* 1. 국립중앙도서관 공고 조회 (모든 날짜 구간에서) */
  console.log(`Fetching national library bids...`);
  const nationalItems = [];
  for (const range of dateRanges) {
    const nationalQuery = `inqryDiv=1&inqryBgnDt=${range.start}&inqryEndDt=${range.end}&dminsttCd=${nationalLibraryCode}&numOfRows=200&pageNo=1&ServiceKey=${SERVICE_KEY}`;
    const nationalUrl = `${baseUrl}/${operation}?${nationalQuery}`;
    const items = await fetchData(nationalUrl);
    nationalItems.push(...items);
  }
  console.log(`Total national library items: ${nationalItems.length}`);
  
  // 중복 제거
  const nationalMap = new Map();
  const national = [];
  nationalItems.forEach((item) => {
    if (!nationalMap.has(item.bidNtceNo)) {
      nationalMap.set(item.bidNtceNo, true);
      national.push(item);
    }
  });
  console.log(`Unique national library items: ${national.length}`);

  /* 2. 국회도서관 공고 조회 (모든 날짜 구간에서) */
  console.log(`Fetching assembly library bids...`);
  const assemblyItems = [];
  for (const range of dateRanges) {
    const assemblyQuery = `inqryDiv=1&inqryBgnDt=${range.start}&inqryEndDt=${range.end}&dminsttCd=${assemblyLibraryCode}&numOfRows=200&pageNo=1&ServiceKey=${SERVICE_KEY}`;
    const assemblyUrl = `${baseUrl}/${operation}?${assemblyQuery}`;
    const items = await fetchData(assemblyUrl);
    assemblyItems.push(...items);
  }
  console.log(`Total assembly library items: ${assemblyItems.length}`);
  
  // 중복 제거
  const assemblyMap = new Map();
  const assembly = [];
  assemblyItems.forEach((item) => {
    if (!assemblyMap.has(item.bidNtceNo)) {
      assemblyMap.set(item.bidNtceNo, true);
      assembly.push(item);
    }
  });
  console.log(`Unique assembly library items: ${assembly.length}`);

  /* 3. 키워드로 공고 조회 (모든 날짜 구간에서) */
  console.log(`Fetching keyword bids...`);
  const keywordItems = [];
  for (const kw of keywords) {
    for (const range of dateRanges) {
      const kwQuery = `inqryDiv=1&inqryBgnDt=${range.start}&inqryEndDt=${range.end}&bidNtceNm=${encodeURIComponent(kw)}&numOfRows=200&pageNo=1&ServiceKey=${SERVICE_KEY}`;
      const kwUrl = `${baseUrl}/${operation}?${kwQuery}`;
      const items = await fetchData(kwUrl);
      keywordItems.push(...items);
    }
    console.log(`Keyword "${kw}" processed`);
  }

  // 키워드 검색 결과에서 중복 제거
  const keywordMap = new Map();
  const keyword = [];
  keywordItems.forEach((item) => {
    if (!keywordMap.has(item.bidNtceNo)) {
      keywordMap.set(item.bidNtceNo, true);
      keyword.push(item);
    }
  });
  console.log(`Total unique keyword items: ${keyword.length}`);

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
      nationalCount: national.length,
      assemblyCount: assembly.length,
      keywordCount: keyword.length,
      totalItems: all.length,
      timestamp: new Date().toISOString(),
    },
  });
}
