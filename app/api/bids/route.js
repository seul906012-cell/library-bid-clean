import { NextResponse } from "next/server";
import xml2js from "xml2js";

export const dynamic = "force-dynamic";

export async function GET(request) {

  const SERVICE_KEY = process.env.SERVICE_KEY;
  
  // URL 파라미터에서 기간 가져오기 (기본값: 30일)
  const { searchParams } = new URL(request.url);
  const periodDays = parseInt(searchParams.get('days')) || 30;

  // 올바른 엔드포인트 (공공데이터포털에서 확인)
  const baseUrl = "https://apis.data.go.kr/1230000/ad/BidPublicInfoService";
  const preSpecUrl = "https://apis.data.go.kr/1230000/ao/HrcspSsstndrdInfoService";  // 사전규격정보서비스
  
  // 용역 검색용 operation (목록 조회)
  const operation = "getBidPblancListInfoServcPPSSrch";   // 용역 검색
  const preSpecOperationByKeyword = "getPublicPrcureThngInfoServcPPSSrch";  // 사전규격 키워드 조회
  const preSpecOperationByInstitution = "getInsttAcctoThngListInfoServc";  // 사전규격 기관별 조회

  const parser = new xml2js.Parser({ explicitArray: false });

  async function fetchData(url) {
    try {
      const res = await fetch(url);
      const xml = await res.text();

      // 디버깅: API 응답 확인
      console.log("API Response Status:", res.status);
      console.log("API Response (first 200 chars):", xml.substring(0, 200));
      console.log("API URL (first 100 chars):", url.substring(0, 100));

      // Unauthorized 체크 (사전규격 API 승인 대기)
      if (xml.includes("Unauthorized") || xml.includes("unauthorized")) {
        console.error("⚠️  API Unauthorized - waiting for activation. URL:", url.substring(0, 150));
        return [];
      }

      // API 트래픽 한도 초과 체크
      if (xml.includes("API token quota exceeded") || xml.includes("quota exceeded")) {
        console.error("⚠️  API token quota exceeded!");
        return { error: "QUOTA_EXCEEDED" };
      }

      // XML이 아닐 경우 (Unexpected errors 등)
      if (!xml || !xml.includes("<response")) {
        console.error("Invalid XML response. Status:", res.status, "Response:", xml.substring(0, 300));
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
  console.log("SERVICE_KEY last 4 chars:", SERVICE_KEY ? `...${SERVICE_KEY.slice(-4)}` : "MISSING");
  console.log("Requested period (days):", periodDays);

  // 날짜 설정: 요청된 기간의 데이터
  // API 트래픽 제한을 고려하여 14일 단위로 나눠서 조회
  const today = new Date();
  const startDate = new Date(today.getTime() - periodDays * 24 * 60 * 60 * 1000);
  
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  };
  
  // 14일 단위로 날짜 구간 생성 (요청 수 절반으로 감소)
  const dateRanges = [];
  let currentStart = new Date(startDate);
  
  while (currentStart < today) {
    const currentEnd = new Date(currentStart.getTime() + 14 * 24 * 60 * 60 * 1000);
    // 마지막 구간은 오늘까지
    const endDate = currentEnd > today ? today : currentEnd;
    
    dateRanges.push({
      start: `${formatDate(currentStart)}0000`,
      end: `${formatDate(endDate)}2359`
    });
    
    currentStart = new Date(currentEnd.getTime() + 1000); // 다음 구간 시작 (1초 후)
  }
  
  console.log(`Date ranges created: ${dateRanges.length} periods (14-day intervals)`);

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
    "메타",
    "아카이브",
  ];

  /* 병렬 처리로 속도 개선 */
  console.log(`⏳ Starting parallel fetch for ${dateRanges.length} date ranges...`);
  const startTime = Date.now();

  // 1. 국립중앙도서관 공고 조회 (모든 날짜 구간 병렬)
  console.log(`📘 [1/3] Fetching National Library...`);
  const nationalPromises = dateRanges.map(range => {
    const nationalQuery = `inqryDiv=1&inqryBgnDt=${range.start}&inqryEndDt=${range.end}&dminsttCd=${nationalLibraryCode}&numOfRows=200&pageNo=1&ServiceKey=${SERVICE_KEY}`;
    const nationalUrl = `${baseUrl}/${operation}?${nationalQuery}`;
    return fetchData(nationalUrl);
  });

  // 2. 국회도서관 공고 조회 (모든 날짜 구간 병렬)
  console.log(`🏛️  [2/3] Fetching Assembly Library...`);
  const assemblyPromises = dateRanges.map(range => {
    const assemblyQuery = `inqryDiv=1&inqryBgnDt=${range.start}&inqryEndDt=${range.end}&dminsttCd=${assemblyLibraryCode}&numOfRows=200&pageNo=1&ServiceKey=${SERVICE_KEY}`;
    const assemblyUrl = `${baseUrl}/${operation}?${assemblyQuery}`;
    return fetchData(assemblyUrl);
  });

  // 3. 키워드로 공고 조회 (모든 키워드 × 날짜 구간 병렬)
  console.log(`🔍 [3/6] Fetching Keywords (${keywords.length} keywords)...`);
  const keywordPromises = keywords.flatMap(kw =>
    dateRanges.map(range => {
      const kwQuery = `inqryDiv=1&inqryBgnDt=${range.start}&inqryEndDt=${range.end}&bidNtceNm=${encodeURIComponent(kw)}&numOfRows=200&pageNo=1&ServiceKey=${SERVICE_KEY}`;
      const kwUrl = `${baseUrl}/${operation}?${kwQuery}`;
      return fetchData(kwUrl);
    })
  );

  // 4. 국립중앙도서관 사전규격 조회 (모든 날짜 구간 병렬)
  console.log(`📘 [4/6] Fetching National Library Pre-Specifications...`);
  const nationalPreSpecPromises = dateRanges.map(range => {
    const preSpecQuery = `inqryDiv=1&inqryBgnDt=${range.start}&inqryEndDt=${range.end}&rlDminsttNm=${encodeURIComponent("문화체육관광부 국립중앙도서관")}&numOfRows=200&pageNo=1&ServiceKey=${SERVICE_KEY}`;
    const preSpecUrl_inst = `${preSpecUrl}/${preSpecOperationByInstitution}?${preSpecQuery}`;
    console.log(`🔗 Pre-spec URL (sample): ${preSpecUrl_inst.substring(0, 150)}...`);
    return fetchData(preSpecUrl_inst);
  });

  // 5. 국회도서관 사전규격 조회 (모든 날짜 구간 병렬)
  console.log(`🏛️  [5/6] Fetching Assembly Library Pre-Specifications...`);
  const assemblyPreSpecPromises = dateRanges.map(range => {
    const preSpecQuery = `inqryDiv=1&inqryBgnDt=${range.start}&inqryEndDt=${range.end}&rlDminsttNm=${encodeURIComponent("국회 국회도서관")}&numOfRows=200&pageNo=1&ServiceKey=${SERVICE_KEY}`;
    const preSpecUrl_inst = `${preSpecUrl}/${preSpecOperationByInstitution}?${preSpecQuery}`;
    return fetchData(preSpecUrl_inst);
  });

  // 6. 키워드로 사전규격 조회 (모든 키워드 × 날짜 구간 병렬)
  console.log(`📋 [6/6] Fetching Keyword Pre-Specifications (${keywords.length} keywords)...`);
  const keywordPreSpecPromises = keywords.flatMap(kw =>
    dateRanges.map(range => {
      const preSpecQuery = `inqryDiv=1&inqryBgnDt=${range.start}&inqryEndDt=${range.end}&prdctClsfcNoNm=${encodeURIComponent(kw)}&numOfRows=200&pageNo=1&ServiceKey=${SERVICE_KEY}`;
      const preSpecQueryUrl = `${preSpecUrl}/${preSpecOperationByKeyword}?${preSpecQuery}`;
      return fetchData(preSpecQueryUrl);
    })
  );

  // 모든 요청 병렬 실행
  const totalRequests = nationalPromises.length + assemblyPromises.length + keywordPromises.length 
    + nationalPreSpecPromises.length + assemblyPreSpecPromises.length + keywordPreSpecPromises.length;
  console.log(`🚀 Executing ${totalRequests} API requests in parallel...`);
  
  const [nationalResults, assemblyResults, keywordResults, nationalPreSpecResults, assemblyPreSpecResults, keywordPreSpecResults] = await Promise.all([
    Promise.all(nationalPromises),
    Promise.all(assemblyPromises),
    Promise.all(keywordPromises),
    Promise.all(nationalPreSpecPromises),
    Promise.all(assemblyPreSpecPromises),
    Promise.all(keywordPreSpecPromises)
  ]);

  const fetchTime = Date.now() - startTime;
  console.log(`✅ All fetches completed in ${fetchTime}ms (${(fetchTime/1000).toFixed(1)}s)`);

  // API 트래픽 한도 초과 체크
  const hasQuotaError = [...nationalResults, ...assemblyResults, ...keywordResults, 
    ...nationalPreSpecResults, ...assemblyPreSpecResults, ...keywordPreSpecResults]
    .flat()
    .some(item => item && item.error === "QUOTA_EXCEEDED");

  if (hasQuotaError) {
    console.error("❌ API Quota Exceeded - returning error response");
    return NextResponse.json({
      error: "QUOTA_EXCEEDED",
      message: "API 일일 트래픽 한도를 초과했습니다. 내일 다시 시도해주세요.",
      national: [],
      assembly: [],
      keyword: [],
      all: [],
      debug: {
        hasServiceKey: !!SERVICE_KEY,
        nationalCount: 0,
        assemblyCount: 0,
        keywordCount: 0,
        totalItems: 0,
        fetchTimeMs: fetchTime,
        dateRanges: dateRanges.length,
        timestamp: new Date().toISOString(),
        quotaExceeded: true
      }
    }, { status: 503 });
  }

  // 결과 병합 및 중복 제거
  console.log(`📊 Processing results...`);
  const nationalItems = nationalResults.flat().filter(item => item && !item.error);
  const nationalMap = new Map();
  const national = [];
  nationalItems.forEach((item) => {
    if (!nationalMap.has(item.bidNtceNo)) {
      nationalMap.set(item.bidNtceNo, true);
      national.push(item);
    }
  });
  console.log(`National library: ${nationalItems.length} total, ${national.length} unique`);

  const assemblyItems = assemblyResults.flat().filter(item => item && !item.error);
  const assemblyMap = new Map();
  const assembly = [];
  assemblyItems.forEach((item) => {
    if (!assemblyMap.has(item.bidNtceNo)) {
      assemblyMap.set(item.bidNtceNo, true);
      assembly.push(item);
    }
  });
  console.log(`Assembly library: ${assemblyItems.length} total, ${assembly.length} unique`);

  const keywordItems = keywordResults.flat().filter(item => item && !item.error);

  // 키워드 검색 결과에서 중복 제거
  const keywordMap = new Map();
  const keyword = [];
  keywordItems.forEach((item) => {
    if (!keywordMap.has(item.bidNtceNo)) {
      keywordMap.set(item.bidNtceNo, true);
      keyword.push(item);
    }
  });
  console.log(`Keywords: ${keywordItems.length} total, ${keyword.length} unique`);

  // 사전규격 결과 처리 (국립중앙도서관 + 국회도서관 + 키워드)
  const nationalPreSpecItems = nationalPreSpecResults.flat().filter(item => item && !item.error);
  const assemblyPreSpecItems = assemblyPreSpecResults.flat().filter(item => item && !item.error);
  const keywordPreSpecItems = keywordPreSpecResults.flat().filter(item => item && !item.error);
  
  console.log(`🔍 Pre-spec raw results: National ${nationalPreSpecResults.flat().length} (filtered: ${nationalPreSpecItems.length}), Assembly ${assemblyPreSpecResults.flat().length} (filtered: ${assemblyPreSpecItems.length}), Keywords ${keywordPreSpecResults.flat().length} (filtered: ${keywordPreSpecItems.length})`);
  
  const preSpecMap = new Map();
  const preSpec = [];
  
  [...nationalPreSpecItems, ...assemblyPreSpecItems, ...keywordPreSpecItems].forEach((item) => {
    // 사전규격은 bfSpecRgstNo를 고유 ID로 사용
    const uniqueId = item.bfSpecRgstNo || item.stdNo || item.untyStdNo || item.stdNtceNo;
    if (uniqueId && !preSpecMap.has(uniqueId)) {
      preSpecMap.set(uniqueId, true);
      
      // 사전규격 공고 상세 페이지 URL 생성
      // 입찰공고와 동일한 /link/ 패턴 사용
      if (item.bfSpecRgstNo) {
        item.bidNtceUrl = `https://www.g2b.go.kr/link/PRCA001_04/single/?bfSpecRgstNo=${item.bfSpecRgstNo}`;
      }
      
      preSpec.push(item);
    }
  });
  
  const preSpecBeforeFilter = preSpec.length;
  
  // 🔍 중복 제거: 입찰공고에 사전규격번호가 있으면 해당 사전규격 제외
  // (입찰공고 = 사전규격의 다음 단계이므로, 입찰공고만 표시)
  const filteredPreSpec = preSpec.filter(preSpecItem => {
    const preSpecId = preSpecItem.bfSpecRgstNo;
    
    // 입찰공고 중에 이 사전규격번호를 가진 것이 있는지 확인
    const hasBidNotice = [...national, ...assembly, ...keyword].some(
      bidItem => bidItem.bfSpecRgstNo === preSpecId
    );
    
    // 입찰공고가 없는 사전규격만 유지
    return !hasBidNotice;
  });
  
  console.log(`Pre-Specifications: National ${nationalPreSpecItems.length}, Assembly ${assemblyPreSpecItems.length}, Keywords ${keywordPreSpecItems.length}, Total unique ${preSpecBeforeFilter}, After dedup with bids ${filteredPreSpec.length} (removed ${preSpecBeforeFilter - filteredPreSpec.length})`);

  /* 전체 합치기 */

  const map = new Map();
  const all = [];

  [...national, ...assembly, ...keyword, ...filteredPreSpec].forEach((item) => {
    const uniqueId = item.bidNtceNo || item.bfSpecRgstNo;
    if (uniqueId && !map.has(uniqueId)) {
      map.set(uniqueId, true);
      all.push(item);
    }
  });
  
  console.log(`🎉 Final result: ${all.length} unique items`);
  console.log(`⏱️  Total processing time: ${(Date.now() - startTime) / 1000}s`);

  return NextResponse.json({
    national,
    assembly,
    keyword,
    preSpec: filteredPreSpec,  // 중복 제거된 사전규격
    all,
    debug: {
      hasServiceKey: !!SERVICE_KEY,
      nationalCount: national.length,
      assemblyCount: assembly.length,
      keywordCount: keyword.length,
      preSpecCount: filteredPreSpec.length,  // 중복 제거된 사전규격 카운트
      totalItems: all.length,
      fetchTimeMs: fetchTime,
      dateRanges: dateRanges.length,
      timestamp: new Date().toISOString(),
    },
  });
}
