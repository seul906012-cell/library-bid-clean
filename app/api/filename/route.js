import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: "URL required" }, { status: 400 });
  }

  try {
    // HEAD 요청으로 헤더만 가져오기
    const res = await fetch(url, { method: 'HEAD' });
    
    // Content-Disposition 헤더에서 파일명 추출
    const contentDisposition = res.headers.get('content-disposition');
    
    if (contentDisposition) {
      // filename*=UTF-8''encoded-name 또는 filename="name" 형식 파싱
      const filenameMatch = contentDisposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
      
      if (filenameMatch && filenameMatch[1]) {
        let filename = filenameMatch[1];
        
        // URL 디코딩 (인코딩된 경우)
        try {
          filename = decodeURIComponent(filename);
        } catch (e) {
          // 디코딩 실패 시 원본 사용
        }
        
        return NextResponse.json({ 
          success: true, 
          filename: filename 
        });
      }
    }
    
    // 파일명을 찾지 못한 경우
    return NextResponse.json({ 
      success: false, 
      filename: null 
    });
    
  } catch (err) {
    console.error("Filename fetch error:", err);
    return NextResponse.json({ 
      success: false, 
      filename: null,
      error: err.message 
    }, { status: 500 });
  }
}
