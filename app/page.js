"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function Home() {

  const [data,setData] = useState([]);
  const [mode,setMode] = useState("all");
  const [keywordCategory, setKeywordCategory] = useState("all"); // 키워드 세부 카테고리
  const [search,setSearch] = useState("");
  const [sort,setSort] = useState("latest");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPeriod, setSelectedPeriod] = useState(30); // 기본값: 1개월
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
        setLoading(false);
        
        // 에러 메시지는 계속 표시
        return;
      }
      
      setLoadingMessage(`로딩 완료! (${elapsed}초 소요)`);
      
      if(res.all){
        setData(res.all);
      }else{
        setData(res);
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



  // 키워드 카테고리 정의
  const keywordCategories = {
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
    "아카이브"
  ];



  const isNational = (i)=>{
    const name=(i.dminsttNm||"")+(i.ntceInsttNm||"");
    return name.includes("국립중앙도서관");
  };

  const isAssembly = (i)=>{
    const name=(i.dminsttNm||"")+(i.ntceInsttNm||"");
    return name.includes("국회도서관");
  };

  const isKeyword = (i)=>{
    const title=i.bidNtceNm||"";
    
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
    filtered = data.filter(i=>isNational(i)||isAssembly(i)||isKeyword(i));
  }

  if(mode==="national"){
    filtered = data.filter(i=>isNational(i));
  }

  if(mode==="assembly"){
    filtered = data.filter(i=>isAssembly(i));
  }

  if(mode==="keyword"){
    filtered = data.filter(i=>isKeyword(i));
  }



  if(search){
    filtered = filtered.filter(i=>
      (i.bidNtceNm||"").toLowerCase().includes(search.toLowerCase())
    );
  }



  filtered.sort((a,b)=>{

    const da = new Date(a.bidNtceDt||0);
    const db = new Date(b.bidNtceDt||0);

    if(sort==="latest") return db-da;

    return da-db;

  });



  const totalCount = data.filter(i =>
    isNational(i)||isAssembly(i)||isKeyword(i)
  ).length;

  const nationalCount = data.filter(i=>isNational(i)).length;

  const assemblyCount = data.filter(i=>isAssembly(i)).length;

  const keywordCount = data.filter(i=>isKeyword(i)).length;

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
      <header style={{
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
        
        {/* 로고 */}
        <div style={{
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
        <div style={{
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
              onClick={() => {
                setSelectedPeriod(period.days);
                load(period.days);
              }}
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
          <div style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap"
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
              전체
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
              도서관
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
              기록물 (기록물, 아카이브)
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
              DB 구축 (DB, DB구축)
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
              메타데이터 (메타)
            </button>
          </div>
        </div>
      )}


      <div style={{
        display:"flex",
        gap:"10px",
        marginBottom:"30px"
      }}>

        <input
          placeholder="현재 결과 내 검색"
          value={search}
          onChange={(e)=>{setSearch(e.target.value); resetPagination();}}
          style={{
            flex:1,
            padding:"10px",
            borderRadius:"8px",
            border:"1px solid #ccc"
          }}
        />

        <select
          value={sort}
          onChange={(e)=>{setSort(e.target.value); resetPagination();}}
          style={{
            padding:"10px",
            borderRadius:"8px"
          }}
        >
          <option value="latest">최신순</option>
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

          const dday = getDday(item.bidClseDt);

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
                marginBottom: "10px"
              }}>
                <a
                  href={item.bidNtceUrl}
                  target="_blank"
                  style={{
                    fontWeight:"bold",
                    fontSize:"16px",
                    textDecoration:"none",
                    color:"#111",
                    flex: 1
                  }}
                >
                  {item.bidNtceNm}
                </a>
                
                {dday && (
                  <span style={{
                    marginLeft: "15px",
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

              <div style={{
                marginTop:"6px",
                color:"#666",
                fontSize:"14px"
              }}>
                📄 {item.dminsttNm||item.ntceInsttNm}
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
                  <span style={{fontWeight: "600", color: "#333"}}>📢 공고일:</span> {formatDate(item.bidNtceDt)}
                </div>
                <div>
                  <span style={{fontWeight: "600", color: "#333"}}>💰 예산:</span> {formatAmount(item.asignBdgtAmt)}
                </div>
                <div>
                  <span style={{fontWeight: "600", color: "#333"}}>📅 입찰마감:</span> {formatDate(item.bidClseDt)}
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
