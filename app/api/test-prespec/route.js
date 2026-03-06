import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const SERVICE_KEY = process.env.SERVICE_KEY;
  
  const logs = [];
  
  logs.push(`SERVICE_KEY exists: ${!!SERVICE_KEY}`);
  logs.push(`SERVICE_KEY length: ${SERVICE_KEY?.length || 0}`);
  logs.push(`SERVICE_KEY last 4: ...${SERVICE_KEY?.slice(-4) || 'MISSING'}`);
  
  // Test pre-spec API
  const testUrl = `https://apis.data.go.kr/1230000/ao/HrcspSsstndrdInfoService/getInsttAcctoThngListInfoServc?serviceKey=${SERVICE_KEY}&inqryDiv=1&inqryBgnDt=202602010000&inqryEndDt=202603062359&rlDminsttNm=${encodeURIComponent("문화체육관광부 국립중앙도서관")}&numOfRows=5&pageNo=1`;
  
  logs.push(`\nTest URL: ${testUrl.substring(0, 150)}...`);
  
  try {
    const response = await fetch(testUrl);
    const text = await response.text();
    
    logs.push(`\nResponse Status: ${response.status}`);
    logs.push(`Response (first 500 chars): ${text.substring(0, 500)}`);
    
    return NextResponse.json({
      success: text.includes("<response"),
      logs: logs,
      response: text.substring(0, 1000)
    });
  } catch (err) {
    logs.push(`\nError: ${err.message}`);
    return NextResponse.json({
      success: false,
      logs: logs,
      error: err.message
    });
  }
}
