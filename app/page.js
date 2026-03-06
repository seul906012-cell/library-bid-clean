"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function Home() {

  const [data,setData] = useState([]);
  const [fullData, setFullData] = useState([]); // 전체 데이터 저장 (필터링용)
  const [mode,setMode] = useState("all");
  const [keywordCategory, setKeywordCategory] = useState("all"); // 키워드 세부 카테고리
  const [prespecCategory, setPrespecCategory] = useState("all"); // 사전규격 세부 카테고리
  const [search,setSearch] = useState("");
  const [sort,setSort] = useState("latest");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPeriod, setSelectedPeriod] = useState(30); // 기본값: 1개월
  const [apiStatus, setApiStatus] = useState("normal"); // API 트래픽 상태: "normal" | "quota_exceeded"
  const itemsPerPage = 15;

  // 최초 로드 시 1개월 데이터 자동 조회
  useEffect(() => {
    load(30);
  }, []);

  const load = (days = selectedPeriod)=>{
    setLoading(true);
    setLoadingMessage("조회 중...");
    setLoadingProgress(0);
    
    const startTime = Date.now();
    
    // 진행률 시뮬레이션 (실제 API는 스트리밍을 지원하지 않으므로)
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 90) return 90; // 90%에서 대기
        return prev + 10;
      });
    }, 200);
    
    fetch(`/api/bids?days=${days}`)
    .then(res => res.json())
    .then(res=>{
      clearInterval(progressInterval);
      setLoadingProgress(100);
      
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      
      // API 트래픽 한도 초과 체크
      if (res.error === "QUOTA_EXCEEDED") {
        setLoadingMessage("⚠️ API 트래픽 한도 초과됨. 공공데이터포털에서 운영계정 전환 확인 필요");
        setApiStatus("quota_exceeded"); // 트래픽 상태 업데이트
        setLoading(false);
        
        // 에러 메시지는 계속 표시
        return;
      }
      
      setApiStatus("normal"); // 정상 상태로 설정
      setLoadingMessage(`로딩 완료! (${elapsed}초 소요)`);
      
      const allData = res.all ? res.all : res;
      setFullData(allData); // 전체 데이터 저장
      setData(allData); // 현재 표시 데이터
      
      // localStorage에 데이터 저장 (상세 페이지에서 사용, 새 탭에서도 공유됨)
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('bidData', JSON.stringify(allData));
          localStorage.setItem('bidDataTimestamp', Date.now().toString());
        } catch (e) {
          console.warn('Failed to save to localStorage:', e);
        }
      }
      
      setLoading(false);
      
      // 2초 후 메시지 숨김
      setTimeout(() => {
        setLoadingMessage("");
        setLoadingProgress(0);
      }, 2000);
    })
    .catch(err => {
      clearInterval(progressInterval);
      console.error("Loading error:", err);
      setLoadingMessage(`❌ ${err.message || "조회 실패"}`);
      setLoading(false);
      setLoadingProgress(0);
      
      // 에러 메시지는 계속 표시
    });
  };

  // 날짜 필터링 함수 (클라이언트 사이드)
  const filterByDays = (days) => {
    const today = new Date();
    const cutoffDate = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
    
    const filtered = fullData.filter(item => {
      const noticeDate = new Date(item.bidNtceDt || item.rcptDt);
      if (!noticeDate || isNaN(noticeDate.getTime())) return false;
      return noticeDate >= cutoffDate;
    });
    
    setData(filtered);
  };

  // 기간 선택 핸들러
  const handlePeriodChange = (days) => {
    setSelectedPeriod(days);
    resetPagination();
    
    // 1주(7일), 2주(14일)는 클라이언트 필터링
    if (days === 7 || days === 14) {
      if (fullData.length > 0) {
        filterByDays(days);
      } else {
        // fullData가 없으면 API 호출
        load(30); // 1개월 데이터 로드 후 필터링은 자동으로 됨
      }
    } 
    // 1개월(30일), 2개월(60일), 3개월(90일)은 API 호출
    else {
      load(days);
    }
  };



  // 키워드 카테고리 정의
  const keywordCategories = {
    national: ['국립중앙도서관'],  // 사전규격용 추가
    assembly: ['국회도서관'],      // 사전규격용 추가
    library: ['도서관'],
    records: ['기록물', '아카이브'],
    database: ['DB', 'DB구축'],
    metadata: ['메타']
  };

  const keywords = [
    "도서관",
    "기록물",
    "DB",
    "DB구축",
    "디지털",
    "디지털화",
    "메타",
    "아카이브",
    "선거관리위원회"
  ];



  const isNational = (i)=>{
    // 입찰공고: dminsttNm, ntceInsttNm
    // 사전규격: rlDminsttNm, orderInsttNm
    const name=(i.dminsttNm||"")+(i.ntceInsttNm||"")+(i.rlDminsttNm||"")+(i.orderInsttNm||"");
    return name.includes("국립중앙도서관");
  };

  const isAssembly = (i)=>{
    // 입찰공고: dminsttNm, ntceInsttNm
    // 사전규격: rlDminsttNm, orderInsttNm
    const name=(i.dminsttNm||"")+(i.ntceInsttNm||"")+(i.rlDminsttNm||"")+(i.orderInsttNm||"");
    return name.includes("국회도서관");
  };

  // 카운트 계산용 - 항상 모든 키워드 체크 (필터와 무관)
  const isKeywordAll = (i)=>{
    const title=i.bidNtceNm || i.prdctClsfcNoNm || "";
    return keywords.some(k=>title.includes(k));
  };

  // 필터링용 - 현재 선택된 카테고리에 따라 체크
  const isKeyword = (i)=>{
    const title=i.bidNtceNm || i.prdctClsfcNoNm || "";
    
    // 키워드 모드일 때 세부 카테고리 필터링
    if(mode === "keyword" && keywordCategory !== "all"){
      const categoryKeywords = keywordCategories[keywordCategory] || [];
      return categoryKeywords.some(k=>title.includes(k));
    }
    
    // 기본: 모든 키워드 검색
    return keywords.some(k=>title.includes(k));
  };



  let filtered = [];

  if(mode==="all"){
    filtered = data; // 전체 공고
  }

  if(mode==="national"){
    // 국립중앙 입찰공고만 (사전규격 제외)
    filtered = data.filter(i=>isNational(i) && !(i.bfSpecRgstNo && !i.bidNtceNo));
  }

  if(mode==="assembly"){
    // 국회 입찰공고만 (사전규격 제외)
    filtered = data.filter(i=>isAssembly(i) && !(i.bfSpecRgstNo && !i.bidNtceNo));
  }

  if(mode==="keyword"){
    // 키워드 입찰공고: 국립중앙/국회 제외, 사전규격 제외
    filtered = data.filter(i=>isKeyword(i) && !isNational(i) && !isAssembly(i) && !(i.bfSpecRgstNo && !i.bidNtceNo));
  }

  if(mode==="prespec"){
    // 모든 사전규격 (국립중앙/국회 포함)
    filtered = data.filter(i => {
      const title = i.bidNtceNm || i.prdctClsfcNoNm || "";
      const isPreSpec = i.bfSpecRgstNo && !i.bidNtceNo;
      
      if(!isPreSpec) return false;
      
      // 사전규격 세부 카테고리 필터링
      if(prespecCategory === "national"){
        return isNational(i);
      }
      if(prespecCategory === "assembly"){
        return isAssembly(i) && !isNational(i);
      }
      if(prespecCategory !== "all"){
        const categoryKeywords = keywordCategories[prespecCategory] || [];
        return categoryKeywords.some(k=>title.includes(k)) && !isNational(i) && !isAssembly(i);
      }
      
      return true; // 전체
    });
  }



  if(search){
    filtered = filtered.filter(i=>{
      const searchLower = search.toLowerCase();
      // 여러 필드를 통합하여 검색
      const searchableText = [
        i.bidNtceNm || "",              // 공고명
        i.prdctClsfcNoNm || "",         // 사전규격명 (품명)
        i.ntceKindNm || "",             // 공고종류
        i.cntrctCnclsMthdNm || "",      // 계약방법
        i.srvceDivNm || "",             // 용역구분
        i.pubPrcrmntLrgClsfcNm || "",   // 공공조달 대분류
        i.pubPrcrmntMidClsfcNm || "",   // 공공조달 중분류
        i.pubPrcrmntClsfcNm || "",      // 공공조달 소분류
        i.dminsttNm || "",              // 수요기관명
        i.ntceInsttNm || "",            // 공고기관명
        i.rlDminsttNm || "",            // 실수요기관명 (사전규격)
        i.orderInsttNm || "",           // 발주기관명 (사전규격)
        i.bfSpecRgstNo || "",           // 사전규격등록번호 (있으면 사전규격 공고)
        // 첨부파일명 전체 검색 (사전규격이 파일명에 있을 수 있음)
        i.ntceSpecFileNm1 || "",
        i.ntceSpecFileNm2 || "",
        i.ntceSpecFileNm3 || "",
        i.ntceSpecFileNm4 || "",
        i.ntceSpecFileNm5 || "",
        i.ntceSpecFileNm6 || "",
        i.ntceSpecFileNm7 || "",
        i.ntceSpecFileNm8 || "",
        i.ntceSpecFileNm9 || "",
        i.ntceSpecFileNm10 || ""
      ].join(" ").toLowerCase();
      
      return searchableText.includes(searchLower);
    });
  }



  filtered.sort((a,b)=>{

    if(sort === "latest") {
      // 최신순: 공고일/접수일 기준
      const da = new Date(a.bidNtceDt || a.rcptDt || 0);
      const db = new Date(b.bidNtceDt || b.rcptDt || 0);
      return db - da;
    }
    
    if(sort === "old") {
      // 오래된순: 공고일/접수일 기준
      const da = new Date(a.bidNtceDt || a.rcptDt || 0);
      const db = new Date(b.bidNtceDt || b.rcptDt || 0);
      return da - db;
    }
    
    if(sort === "deadline") {
      // 마감일순: 입찰 마감일/의견등록마감일 기준 (많이 남은 것부터)
      const da = new Date(a.bidClseDt || a.opninRgstClseDt || "9999-12-31");
      const db = new Date(b.bidClseDt || b.opninRgstClseDt || "9999-12-31");
      return db - da;
    }

    return 0;

  });



  const totalCount = data.length;

  // 2. 국립중앙도서관: 입찰공고만 (사전규격 제외)
  const nationalCount = data.filter(i=>
    isNational(i) && !(i.bfSpecRgstNo && !i.bidNtceNo)
  ).length;

  // 3. 국회도서관: 입찰공고만 (사전규격 제외, 국립중앙 제외)
  const assemblyCount = data.filter(i=>
    isAssembly(i) && !isNational(i) && !(i.bfSpecRgstNo && !i.bidNtceNo)
  ).length;

  // 4. 키워드: 키워드 매칭 입찰공고만 (사전규격 제외, 국립중앙/국회 제외)
  const keywordCount = data.filter(i=>
    isKeywordAll(i) && !isNational(i) && !isAssembly(i) && !(i.bfSpecRgstNo && !i.bidNtceNo)
  ).length;

  // 5. 사전규격: 모든 사전규격 (국립중앙/국회 포함)
  const preSpecCount = data.filter(i=>
    i.bfSpecRgstNo && !i.bidNtceNo
  ).length;

  // 키워드 카테고리별 건수 (입찰공고만, 사전규격 제외)
  const keywordCategoryCounts = {
    all: keywordCount,
    library: data.filter(i => {
      const title = i.bidNtceNm || i.prdctClsfcNoNm || "";
      return keywordCategories.library.some(k => title.includes(k)) && 
             !isNational(i) && !isAssembly(i) && !(i.bfSpecRgstNo && !i.bidNtceNo);
    }).length,
    records: data.filter(i => {
      const title = i.bidNtceNm || i.prdctClsfcNoNm || "";
      return keywordCategories.records.some(k => title.includes(k)) && 
             !isNational(i) && !isAssembly(i) && !(i.bfSpecRgstNo && !i.bidNtceNo);
    }).length,
    database: data.filter(i => {
      const title = i.bidNtceNm || i.prdctClsfcNoNm || "";
      return keywordCategories.database.some(k => title.includes(k)) && 
             !isNational(i) && !isAssembly(i) && !(i.bfSpecRgstNo && !i.bidNtceNo);
    }).length,
    metadata: data.filter(i => {
      const title = i.bidNtceNm || i.prdctClsfcNoNm || "";
      return keywordCategories.metadata.some(k => title.includes(k)) && 
             !isNational(i) && !isAssembly(i) && !(i.bfSpecRgstNo && !i.bidNtceNo);
    }).length
  };

  // 사전규격 카테고리별 건수 (모든 사전규격, 기관 구분 없이)
  const prespecCategoryCounts = {
    all: preSpecCount,
    national: data.filter(i => {
      return i.bfSpecRgstNo && !i.bidNtceNo && isNational(i);
    }).length,
    assembly: data.filter(i => {
      return i.bfSpecRgstNo && !i.bidNtceNo && isAssembly(i) && !isNational(i);
    }).length,
    library: data.filter(i => {
      const title = i.bidNtceNm || i.prdctClsfcNoNm || "";
      return keywordCategories.library.some(k => title.includes(k)) && 
             i.bfSpecRgstNo && !i.bidNtceNo && !isNational(i) && !isAssembly(i);
    }).length,
    records: data.filter(i => {
      const title = i.bidNtceNm || i.prdctClsfcNoNm || "";
      return keywordCategories.records.some(k => title.includes(k)) && 
             i.bfSpecRgstNo && !i.bidNtceNo && !isNational(i) && !isAssembly(i);
    }).length,
    database: data.filter(i => {
      const title = i.bidNtceNm || i.prdctClsfcNoNm || "";
      return keywordCategories.database.some(k => title.includes(k)) && 
             i.bfSpecRgstNo && !i.bidNtceNo && !isNational(i) && !isAssembly(i);
    }).length,
    metadata: data.filter(i => {
      const title = i.bidNtceNm || i.prdctClsfcNoNm || "";
      return keywordCategories.metadata.some(k => title.includes(k)) && 
             i.bfSpecRgstNo && !i.bidNtceNo && !isNational(i) && !isAssembly(i);
    }).length
  };

  // 페이지네이션 계산
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filtered.slice(startIndex, endIndex);

  // 페이지 변경 시 스크롤 맨 위로
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 필터/검색 변경 시 첫 페이지로
  const resetPagination = () => {
    setCurrentPage(1);
  };

  // 금액 포맷 함수 (억원 단위)
  const formatAmount = (amount) => {
    if (!amount || amount === "0") return "-";
    const numAmount = parseInt(amount);
    if (isNaN(numAmount)) return "-";
    
    if (numAmount >= 100000000) {
      return `${(numAmount / 100000000).toFixed(1)}억원`;
    } else if (numAmount >= 10000) {
      return `${(numAmount / 10000).toFixed(0)}만원`;
    } else {
      return `${numAmount.toLocaleString()}원`;
    }
  };

  // 날짜 포맷 함수
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "-";
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch {
      return "-";
    }
  };

  // D-day 계산 함수
  const getDday = (dateStr) => {
    if (!dateStr) return null;
    try {
      const closeDate = new Date(dateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      closeDate.setHours(0, 0, 0, 0);
      
      const diff = Math.ceil((closeDate - today) / (1000 * 60 * 60 * 24));
      
      if (diff < 0) return { text: "마감", color: "#999" };
      if (diff === 0) return { text: "D-day", color: "#dc2626" };
      if (diff <= 3) return { text: `D-${diff}`, color: "#dc2626" };
      if (diff <= 7) return { text: `D-${diff}`, color: "#f59e0b" };
      return { text: `D-${diff}`, color: "#10b981" };
    } catch {
      return null;
    }
  };

  // NEW 배지 체크 함수 (오늘 올라온 공고)
  const isNew = (item) => {
    const dateStr = item.bidNtceDt || item.rcptDt;
    if (!dateStr) return false;
    try {
      const noticeDate = new Date(dateStr);
      const today = new Date();
      noticeDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      
      return noticeDate.getTime() === today.getTime();
    } catch {
      return false;
    }
  };



  return (

    <main style={{
      padding:"20px",
      fontFamily:"sans-serif",
      background:"#f2f5f9",
      minHeight:"100vh",
      maxWidth: "1400px",
      margin: "0 auto"
    }}>

      {/* 헤더 */}
      <header className="mobile-header" style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "30px",
        paddingBottom: "20px",
        borderBottom: "2px solid #e5e7eb",
        flexWrap: "wrap",
        gap: "20px"
      }}>
        <h1 style={{
          margin: 0,
          fontSize: "28px",
          fontWeight: "700",
          color: "#1f2937",
          flex: "1 1 auto",
          minWidth: "250px"
        }}>
          📚 도서관·기록물 입찰 공고 정보
        </h1>
        
        {/* API 트래픽 상태 표시 */}
        <div style={{
          padding: "8px 16px",
          borderRadius: "6px",
          fontSize: "13px",
          fontWeight: "600",
          backgroundColor: apiStatus === "quota_exceeded" ? "#fee" : "#d1fae5",
          color: apiStatus === "quota_exceeded" ? "#dc2626" : "#059669",
          border: `1px solid ${apiStatus === "quota_exceeded" ? "#fca5a5" : "#6ee7b7"}`,
          display: "flex",
          alignItems: "center",
          gap: "6px"
        }}>
          {apiStatus === "quota_exceeded" ? (
            <>
              <span>⚠️</span>
              <span>API 트래픽 한도 초과 - 내일 다시 시도해주세요</span>
            </>
          ) : (
            <>
              <span>✓</span>
              <span>API 트래픽: 정상</span>
            </>
          )}
        </div>
        
        {/* 로고 */}
        <div className="logo-container" style={{
          display: "flex",
          alignItems: "center"
        }}>
          <Image 
            src="/logo.png" 
            alt="데이터클립 로고" 
            width={200}
            height={50}
            style={{
              objectFit: "contain",
              filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))"
            }}
          />
        </div>
      </header>

      {/* 조회 버튼 및 기간 선택 */}
      <div style={{
        marginBottom: "20px"
      }}>
        {/* 기간 선택 버튼들 */}
        <div className="period-buttons" style={{
          display: "flex",
          gap: "10px",
          marginBottom: "15px",
          flexWrap: "wrap"
        }}>
          {[
            { label: "1주", days: 7 },
            { label: "2주", days: 14 },
            { label: "1개월", days: 30 },
            { label: "2개월", days: 60 },
            { label: "3개월", days: 90 }
          ].map((period) => (
            <button
              key={period.days}
              onClick={() => handlePeriodChange(period.days)}
              disabled={loading}
              style={{
                padding: "10px 20px",
                fontSize: "15px",
                fontWeight: selectedPeriod === period.days ? "600" : "500",
                backgroundColor: selectedPeriod === period.days ? "#3b82f6" : "#fff",
                color: selectedPeriod === period.days ? "#fff" : "#333",
                border: selectedPeriod === period.days ? "none" : "1px solid #ddd",
                borderRadius: "8px",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                opacity: loading ? 0.6 : 1,
                boxShadow: selectedPeriod === period.days ? "0 2px 4px rgba(59, 130, 246, 0.3)" : "none"
              }}
              onMouseOver={(e) => {
                if (!loading && selectedPeriod !== period.days) {
                  e.target.style.backgroundColor = "#f3f4f6";
                }
              }}
              onMouseOut={(e) => {
                if (selectedPeriod !== period.days) {
                  e.target.style.backgroundColor = "#fff";
                }
              }}
            >
              {period.label}
            </button>
          ))}
        </div>

        {/* 조회 정보 */}
        {data.length > 0 && !loading && (
          <div style={{
            padding: "12px 16px",
            backgroundColor: "#f0f9ff",
            borderRadius: "8px",
            border: "1px solid #bae6fd",
            fontSize: "14px",
            color: "#0369a1",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <span style={{ fontSize: "16px" }}>📊</span>
            <span>
              <strong>{data.length}건</strong>의 공고가 조회되었습니다 
              <span style={{ color: "#64748b", marginLeft: "8px" }}>({[
                { label: "1주", days: 7 },
                { label: "2주", days: 14 },
                { label: "1개월", days: 30 },
                { label: "2개월", days: 60 },
                { label: "3개월", days: 90 }
              ].find(p => p.days === selectedPeriod)?.label})</span>
            </span>
          </div>
        )}
      </div>

      {/* 로딩 상태 표시 */}
      {(loading || loadingMessage) && (
        <div style={{
          background: loading ? "#fff3cd" : "#d4edda",
          border: `1px solid ${loading ? "#ffc107" : "#28a745"}`,
          borderRadius: "8px",
          padding: "15px",
          marginBottom: "20px"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: loading ? "10px" : "0"
          }}>
            {loading && (
              <div style={{
                width: "20px",
                height: "20px",
                border: "3px solid #ffc107",
                borderTop: "3px solid transparent",
                borderRadius: "50%",
                animation: "spin 1s linear infinite"
              }}></div>
            )}
            <span style={{
              fontWeight: "500",
              color: loading ? "#856404" : "#155724"
            }}>
              {loadingMessage}
            </span>
          </div>
          
          {/* 진행률 표시 */}
          {loading && (
            <div>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "5px"
              }}>
                <span style={{
                  fontSize: "12px",
                  color: "#856404"
                }}>
                  진행률
                </span>
                <span style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#856404"
                }}>
                  {loadingProgress}%
                </span>
              </div>
              <div style={{
                width: "100%",
                height: "8px",
                backgroundColor: "#fff",
                borderRadius: "4px",
                overflow: "hidden",
                border: "1px solid #ffc107"
              }}>
                <div style={{
                  width: `${loadingProgress}%`,
                  height: "100%",
                  backgroundColor: "#ffc107",
                  transition: "width 0.3s ease"
                }}></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 스피너 애니메이션 CSS */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* 안내 메시지 (데이터 없을 때) */}
      {data.length === 0 && !loading && (
        <div style={{
          background: "#f8f9fa",
          border: "2px dashed #dee2e6",
          borderRadius: "8px",
          padding: "40px",
          textAlign: "center",
          marginBottom: "20px"
        }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📭</div>
          <h3 style={{ marginBottom: "8px", color: "#495057" }}>공고 데이터가 없습니다</h3>
          <p style={{ color: "#6c757d", marginBottom: "20px" }}>
            위의 기간 버튼을 눌러 데이터를 조회하세요
          </p>
        </div>
      )}


      <div className="card-container">


        <div
          onClick={()=>{setMode("all"); resetPagination();}}
          className={`category-card ${mode === "all" ? "active" : ""}`}
          style={{
            background: mode === "all" ? "rgba(51, 51, 51, 0.08)" : "#fff",
            borderTop:"5px solid #333",
            boxShadow: mode === "all" ? "0 4px 12px rgba(0,0,0,0.1)" : "0 2px 4px rgba(0,0,0,0.05)"
          }}
        >
          <div className="card-label">전체 공고</div>
          <h2 className="card-count">{totalCount}</h2>
        </div>



        <div
          onClick={()=>{setMode("national"); resetPagination();}}
          className={`category-card ${mode === "national" ? "active" : ""}`}
          style={{
            background: mode === "national" ? "rgba(59, 130, 246, 0.08)" : "#fff",
            borderTop:"5px solid #3b82f6",
            boxShadow: mode === "national" ? "0 4px 12px rgba(59, 130, 246, 0.2)" : "0 2px 4px rgba(0,0,0,0.05)"
          }}
        >
          <div className="card-label">국립중앙도서관</div>
          <h2 className="card-count">{nationalCount}</h2>
        </div>



        <div
          onClick={()=>{setMode("assembly"); resetPagination();}}
          className={`category-card ${mode === "assembly" ? "active" : ""}`}
          style={{
            background: mode === "assembly" ? "rgba(139, 92, 246, 0.08)" : "#fff",
            borderTop:"5px solid #8b5cf6",
            boxShadow: mode === "assembly" ? "0 4px 12px rgba(139, 92, 246, 0.2)" : "0 2px 4px rgba(0,0,0,0.05)"
          }}
        >
          <div className="card-label">국회도서관</div>
          <h2 className="card-count">{assemblyCount}</h2>
        </div>



        <div
          onClick={()=>{setMode("keyword"); setKeywordCategory("all"); resetPagination();}}
          className={`category-card ${mode === "keyword" ? "active" : ""}`}
          style={{
            background: mode === "keyword" ? "rgba(16, 185, 129, 0.08)" : "#fff",
            borderTop:"5px solid #10b981",
            boxShadow: mode === "keyword" ? "0 4px 12px rgba(16, 185, 129, 0.2)" : "0 2px 4px rgba(0,0,0,0.05)"
          }}
        >
          <div className="card-label">키워드</div>
          <h2 className="card-count">{keywordCount}</h2>
        </div>



        <div
          onClick={()=>{setMode("prespec"); setPrespecCategory("all"); resetPagination();}}
          className={`category-card ${mode === "prespec" ? "active" : ""}`}
          style={{
            background: mode === "prespec" ? "rgba(3, 105, 161, 0.08)" : "#fff",
            borderTop:"5px solid #0369a1",
            boxShadow: mode === "prespec" ? "0 4px 12px rgba(3, 105, 161, 0.2)" : "0 2px 4px rgba(0,0,0,0.05)"
          }}
        >
          <div className="card-label">사전규격</div>
          <h2 className="card-count">{preSpecCount}</h2>
        </div>


      </div>


      {/* 키워드 세부 카테고리 필터 */}
      {mode === "keyword" && (
        <div style={{
          marginBottom: "20px",
          padding: "20px",
          background: "#f0fdf4",
          borderRadius: "12px",
          border: "2px solid #10b981"
        }}>
          <div style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "#047857",
            marginBottom: "12px"
          }}>
            📂 키워드 카테고리
          </div>
          <div className="keyword-category-buttons" style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            justifyContent: "center"
          }}>
            <button
              onClick={() => { setKeywordCategory("all"); resetPagination(); }}
              style={{
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: keywordCategory === "all" ? "600" : "500",
                backgroundColor: keywordCategory === "all" ? "#10b981" : "#fff",
                color: keywordCategory === "all" ? "#fff" : "#333",
                border: keywordCategory === "all" ? "none" : "1px solid #d1d5db",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              전체 ({keywordCategoryCounts.all})
            </button>
            <button
              onClick={() => { setKeywordCategory("library"); resetPagination(); }}
              style={{
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: keywordCategory === "library" ? "600" : "500",
                backgroundColor: keywordCategory === "library" ? "#10b981" : "#fff",
                color: keywordCategory === "library" ? "#fff" : "#333",
                border: keywordCategory === "library" ? "none" : "1px solid #d1d5db",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              도서관 ({keywordCategoryCounts.library})
            </button>
            <button
              onClick={() => { setKeywordCategory("records"); resetPagination(); }}
              style={{
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: keywordCategory === "records" ? "600" : "500",
                backgroundColor: keywordCategory === "records" ? "#10b981" : "#fff",
                color: keywordCategory === "records" ? "#fff" : "#333",
                border: keywordCategory === "records" ? "none" : "1px solid #d1d5db",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              기록물 ({keywordCategoryCounts.records})
            </button>
            <button
              onClick={() => { setKeywordCategory("database"); resetPagination(); }}
              style={{
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: keywordCategory === "database" ? "600" : "500",
                backgroundColor: keywordCategory === "database" ? "#10b981" : "#fff",
                color: keywordCategory === "database" ? "#fff" : "#333",
                border: keywordCategory === "database" ? "none" : "1px solid #d1d5db",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              DB 구축 ({keywordCategoryCounts.database})
            </button>
            <button
              onClick={() => { setKeywordCategory("metadata"); resetPagination(); }}
              style={{
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: keywordCategory === "metadata" ? "600" : "500",
                backgroundColor: keywordCategory === "metadata" ? "#10b981" : "#fff",
                color: keywordCategory === "metadata" ? "#fff" : "#333",
                border: keywordCategory === "metadata" ? "none" : "1px solid #d1d5db",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              메타데이터 ({keywordCategoryCounts.metadata})
            </button>
          </div>
        </div>
      )}


      {/* 사전규격 세부 카테고리 필터 */}
      {mode === "prespec" && (
        <div style={{
          marginBottom: "20px",
          padding: "20px",
          background: "#f0f9ff",
          borderRadius: "12px",
          border: "2px solid #0369a1"
        }}>
          <div style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "#075985",
            marginBottom: "12px"
          }}>
            📂 사전규격 카테고리
          </div>
          <div className="prespec-category-buttons" style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            justifyContent: "center"
          }}>
            <button
              onClick={() => { setPrespecCategory("all"); resetPagination(); }}
              style={{
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: prespecCategory === "all" ? "600" : "500",
                backgroundColor: prespecCategory === "all" ? "#0369a1" : "#fff",
                color: prespecCategory === "all" ? "#fff" : "#333",
                border: prespecCategory === "all" ? "none" : "1px solid #d1d5db",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              전체 ({prespecCategoryCounts.all})
            </button>
            <button
              onClick={() => { setPrespecCategory("national"); resetPagination(); }}
              style={{
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: prespecCategory === "national" ? "600" : "500",
                backgroundColor: prespecCategory === "national" ? "#0369a1" : "#fff",
                color: prespecCategory === "national" ? "#fff" : "#333",
                border: prespecCategory === "national" ? "none" : "1px solid #d1d5db",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              국립중앙도서관 ({prespecCategoryCounts.national})
            </button>
            <button
              onClick={() => { setPrespecCategory("assembly"); resetPagination(); }}
              style={{
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: prespecCategory === "assembly" ? "600" : "500",
                backgroundColor: prespecCategory === "assembly" ? "#0369a1" : "#fff",
                color: prespecCategory === "assembly" ? "#fff" : "#333",
                border: prespecCategory === "assembly" ? "none" : "1px solid #d1d5db",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              국회도서관 ({prespecCategoryCounts.assembly})
            </button>
            <button
              onClick={() => { setPrespecCategory("library"); resetPagination(); }}
              style={{
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: prespecCategory === "library" ? "600" : "500",
                backgroundColor: prespecCategory === "library" ? "#0369a1" : "#fff",
                color: prespecCategory === "library" ? "#fff" : "#333",
                border: prespecCategory === "library" ? "none" : "1px solid #d1d5db",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              도서관 ({prespecCategoryCounts.library})
            </button>
            <button
              onClick={() => { setPrespecCategory("records"); resetPagination(); }}
              style={{
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: prespecCategory === "records" ? "600" : "500",
                backgroundColor: prespecCategory === "records" ? "#0369a1" : "#fff",
                color: prespecCategory === "records" ? "#fff" : "#333",
                border: prespecCategory === "records" ? "none" : "1px solid #d1d5db",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              기록물 ({prespecCategoryCounts.records})
            </button>
            <button
              onClick={() => { setPrespecCategory("database"); resetPagination(); }}
              style={{
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: prespecCategory === "database" ? "600" : "500",
                backgroundColor: prespecCategory === "database" ? "#0369a1" : "#fff",
                color: prespecCategory === "database" ? "#fff" : "#333",
                border: prespecCategory === "database" ? "none" : "1px solid #d1d5db",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              데이터베이스 ({prespecCategoryCounts.database})
            </button>
            <button
              onClick={() => { setPrespecCategory("metadata"); resetPagination(); }}
              style={{
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: prespecCategory === "metadata" ? "600" : "500",
                backgroundColor: prespecCategory === "metadata" ? "#0369a1" : "#fff",
                color: prespecCategory === "metadata" ? "#fff" : "#333",
                border: prespecCategory === "metadata" ? "none" : "1px solid #d1d5db",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              메타데이터 ({prespecCategoryCounts.metadata})
            </button>
          </div>
        </div>
      )}


      <div style={{
        display:"flex",
        gap:"10px",
        marginBottom:"30px",
        flexWrap: "wrap"  // 모바일에서 줄바꿈 허용
      }}>

        <input
          placeholder="현재 결과 내 검색"
          value={search}
          onChange={(e)=>{setSearch(e.target.value); resetPagination();}}
          style={{
            flex:"1 1 200px",  // 최소 너비 200px
            minWidth: "200px",  // 최소 너비 보장
            padding:"10px",
            borderRadius:"8px",
            border:"1px solid #ccc",
            fontSize: "16px"  // iOS에서 자동 줌 방지
          }}
        />

        <select
          value={sort}
          onChange={(e)=>{setSort(e.target.value); resetPagination();}}
          style={{
            padding:"10px",
            borderRadius:"8px",
            fontSize: "16px",  // iOS에서 자동 줌 방지
            minWidth: "120px"
          }}
        >
          <option value="latest">최신순</option>
          <option value="deadline">마감일순</option>
          <option value="old">오래된순</option>
        </select>

      </div>



      {/* 페이지 정보 */}
      {filtered.length > 0 && (
        <div style={{
          marginBottom: "15px",
          color: "#666",
          fontSize: "14px"
        }}>
          전체 {filtered.length}건 중 {startIndex + 1}~{Math.min(endIndex, filtered.length)}건 표시
        </div>
      )}

      <div>

        {paginatedData.map((item,i)=>{

          let color="#999";

          if(isNational(item)) color="#3b82f6";
          else if(isAssembly(item)) color="#8b5cf6";
          else if(isKeyword(item)) color="#10b981";

          const dday = getDday(item.bidClseDt || item.opninRgstClseDt);

          return (

            <div
              key={i}
              style={{
                background:"#fff",
                padding:"20px",
                borderRadius:"10px",
                marginBottom:"12px",
                borderLeft:`6px solid ${color}`
              }}
            >

              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "10px",
                gap: "10px",
                flexWrap: "wrap"
              }}>
                <a
                  href={
                    // 사전규격이면 자체 상세 페이지로, 입찰공고면 나라장터로
                    (item.bfSpecRgstNo && !item.bidNtceNo) 
                      ? `/prespec/${item.bfSpecRgstNo}` 
                      : (item.bidNtceUrl || "#")
                  }
                  target="_blank"
                  style={{
                    fontWeight:"bold",
                    fontSize:"16px",
                    textDecoration:"none",
                    color:"#111",
                    flex: 1,
                    minWidth: 0,
                    cursor: "pointer",
                    display: "inline",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                    lineHeight: "1.5"
                  }}
                >
                  {/* 사전규격 표시 (제목 앞) */}
                  {item.bfSpecRgstNo && !item.bidNtceNo && (
                    <span style={{
                      marginRight: "8px",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: "600",
                      backgroundColor: "#f0f9ff",
                      color: "#0369a1",
                      border: "1px solid #bae6fd",
                      whiteSpace: "nowrap",
                      display: "inline-block",
                      verticalAlign: "middle"
                    }}>
                      사전규격
                    </span>
                  )}
                  {item.bidNtceNm || item.prdctClsfcNoNm}
                  {/* NEW 배지 */}
                  {isNew(item) && (
                    <span style={{
                      marginLeft: "8px",
                      padding: "3px 8px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: "700",
                      backgroundColor: "#ef4444",
                      color: "#fff",
                      whiteSpace: "nowrap",
                      display: "inline-block",
                      verticalAlign: "middle"
                    }}>
                      NEW
                    </span>
                  )}
                </a>
                
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  flexShrink: 0
                }}>
                  {dday && (
                    <span style={{
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: "600",
                      backgroundColor: dday.color,
                      color: "#fff",
                      whiteSpace: "nowrap"
                    }}>
                      {dday.text}
                    </span>
                  )}
                </div>
              </div>

              <div style={{
                marginTop:"6px",
                color:"#666",
                fontSize:"14px"
              }}>
                📄 {item.dminsttNm || item.ntceInsttNm || item.rlDminsttNm || item.orderInsttNm}
              </div>

              <div style={{
                marginTop: "10px",
                display: "flex",
                gap: "20px",
                fontSize: "13px",
                color: "#666",
                flexWrap: "wrap"
              }}>
                <div>
                  <span style={{fontWeight: "600", color: "#333"}}>📢 {item.bidNtceDt ? '공고일' : '접수일'}:</span> {formatDate(item.bidNtceDt || item.rcptDt)}
                </div>
                <div>
                  <span style={{fontWeight: "600", color: "#333"}}>💰 예산:</span> {formatAmount(item.asignBdgtAmt)}
                </div>
                <div>
                  <span style={{fontWeight: "600", color: "#333"}}>📅 {item.bidClseDt ? '입찰마감' : '의견등록마감'}:</span> {formatDate(item.bidClseDt || item.opninRgstClseDt)}
                </div>
              </div>

            </div>

          );

        })}

      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "10px",
          marginTop: "30px",
          marginBottom: "30px"
        }}>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "1px solid #ddd",
              background: currentPage === 1 ? "#f5f5f5" : "#fff",
              color: currentPage === 1 ? "#999" : "#333",
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
              fontWeight: "500"
            }}
          >
            ← 이전
          </button>

          <div style={{ display: "flex", gap: "5px" }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
              // 현재 페이지 주변만 표시
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 2 && page <= currentPage + 2)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #ddd",
                      background: page === currentPage ? "#3b82f6" : "#fff",
                      color: page === currentPage ? "#fff" : "#333",
                      cursor: "pointer",
                      fontWeight: page === currentPage ? "600" : "400"
                    }}
                  >
                    {page}
                  </button>
                );
              } else if (page === currentPage - 3 || page === currentPage + 3) {
                return <span key={page} style={{ padding: "8px 4px" }}>...</span>;
              }
              return null;
            })}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "1px solid #ddd",
              background: currentPage === totalPages ? "#f5f5f5" : "#fff",
              color: currentPage === totalPages ? "#999" : "#333",
              cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              fontWeight: "500"
            }}
          >
            다음 →
          </button>
        </div>
      )}

    </main>

  );

}
