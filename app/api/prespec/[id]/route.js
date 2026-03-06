import { NextResponse } from "next/server";
import xml2js from "xml2js";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const SERVICE_KEY = process.env.SERVICE_KEY;
  const { id } = params; // bfSpecRgstNo

  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  const preSpecUrl = "https://apis.data.go.kr/1230000/ao/HrcspSsstndrdInfoService";
  const operation = "getPublicPrcureThngInfoServcPPSSrch";
  
  const parser = new xml2js.Parser({ explicitArray: false });

  try {
    // API 호출 (등록번호로 검색)
    // 최근 1년 범위로 검색 (API 입력범위 제한 때문에 좁은 범위 사용)
    const today = new Date();
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}${month}${day}`;
    };
    
    const startDt = `${formatDate(oneYearAgo)}0000`;
    const endDt = `${formatDate(today)}2359`;
    
    const query = `inqryDiv=1&inqryBgnDt=${startDt}&inqryEndDt=${endDt}&bfSpecRgstNo=${id}&numOfRows=1&pageNo=1&ServiceKey=${SERVICE_KEY}`;
    const url = `${preSpecUrl}/${operation}?${query}`;
    
    console.log(`Fetching pre-spec detail: ${id} (${startDt} ~ ${endDt})`);
    
    const res = await fetch(url);
    const xml = await res.text();

    if (!xml || !xml.includes("<response")) {
      console.error("Invalid XML response");
      return NextResponse.json({ error: "Invalid response" }, { status: 500 });
    }

    const json = await parser.parseStringPromise(xml);
    let item = json?.response?.body?.items?.item;

    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // 배열이면 첫 번째 항목
    if (Array.isArray(item)) {
      item = item[0];
    }

    return NextResponse.json({
      success: true,
      data: item
    });

  } catch (err) {
    console.error("Pre-spec detail fetch error:", err);
    return NextResponse.json({ 
      error: "Failed to fetch data",
      message: err.message 
    }, { status: 500 });
  }
}
