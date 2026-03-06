import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: "URL required" }, { status: 400 });
  }

  try {
    // GET 요청으로 헤더 가져오기 (HEAD는 403 에러 발생)
    // Range 헤더로 첫 1바이트만 요청해서 빠르게 처리
    const res = await fetch(url, { 
      method: 'GET',
      headers: {
        'Range': 'bytes=0-0'
      }
    });
    
    // Content-Disposition 헤더에서 파일명 추출
    const contentDisposition = res.headers.get('content-disposition');
    
    if (contentDisposition) {
      // filename=encoded-name 형식 파싱
      const filenameMatch = contentDisposition.match(/filename=([^;]+)/i);
      
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
