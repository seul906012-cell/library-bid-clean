"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function PreSpecDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!params.id) return;

    const fetchDetail = () => {
      try {
        setLoading(true);
        
        // localStorage에서 캐시된 데이터 확인
        if (typeof window !== 'undefined') {
          const cachedData = localStorage.getItem('bidData');
          if (cachedData) {
            const allData = JSON.parse(cachedData);
            const item = allData.find(d => d.bfSpecRgstNo === params.id);
            
            if (item) {
              console.log('✅ Found:', item.prdctClsfcNoNm || item.bidNtceNm);
              setData(item);
              setLoading(false);
              return;
            } else {
              console.log('❌ ID not found:', params.id);
              setError('해당 공고를 찾을 수 없습니다. 목록 페이지에서 다시 시도해주세요.');
              setLoading(false);
              return;
            }
          } else {
            setError('데이터를 불러올 수 없습니다. 목록 페이지에서 먼저 공고를 조회해주세요.');
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchDetail();
  }, [params.id]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return dateStr.substring(0, 10).replace(/-/g, ".");
  };

  const formatAmount = (amt) => {
    if (!amt || amt === "0") return "-";
    const num = parseInt(amt);
    if (num >= 100000000) {
      return `${(num / 100000000).toFixed(1)}억원`;
    } else if (num >= 10000) {
      return `${(num / 10000).toFixed(0)}만원`;
    }
    return `${num.toLocaleString()}원`;
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f9fafb"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "50px",
            height: "50px",
            border: "4px solid #e5e7eb",
            borderTop: "4px solid #3b82f6",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 16px"
          }}></div>
          <p style={{ color: "#666", fontSize: "14px" }}>로딩 중...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f9fafb"
      }}>
        <div style={{
          maxWidth: "400px",
          padding: "32px",
          backgroundColor: "#fff",
          borderRadius: "12px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          textAlign: "center"
        }}>
          <p style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</p>
          <h2 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "8px", color: "#111" }}>
            오류 발생
          </h2>
          <p style={{ color: "#666", fontSize: "14px", marginBottom: "24px" }}>
            {error}
          </p>
          <button
            onClick={() => router.push("/")}
            style={{
              padding: "10px 24px",
              backgroundColor: "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer"
            }}
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f9fafb"
      }}>
        <div style={{
          maxWidth: "400px",
          padding: "32px",
          backgroundColor: "#fff",
          borderRadius: "12px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          textAlign: "center"
        }}>
          <p style={{ fontSize: "48px", marginBottom: "16px" }}>📄</p>
          <h2 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "8px", color: "#111" }}>
            데이터를 찾을 수 없습니다
          </h2>
          <p style={{ color: "#666", fontSize: "14px", marginBottom: "24px" }}>
            요청하신 사전규격 정보를 찾을 수 없습니다.
          </p>
          <button
            onClick={() => router.push("/")}
            style={{
              padding: "10px 24px",
              backgroundColor: "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer"
            }}
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 첨부파일 목록
  const attachments = [1, 2, 3, 4, 5]
    .map(num => data[`specDocFileUrl${num}`])
    .filter(url => url);

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#f9fafb",
      padding: "20px"
    }}>
      <div style={{
        maxWidth: "1000px",
        margin: "0 auto"
      }}>
        {/* 상단 헤더 */}
        <div style={{
          marginBottom: "20px"
        }}>
          <div style={{
            padding: "6px 12px",
            backgroundColor: "#f0f9ff",
            color: "#0369a1",
            border: "1px solid #bae6fd",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: "600",
            display: "inline-block"
          }}>
            사전규격 상세정보
          </div>
        </div>

        {/* 메인 카드 */}
        <div style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          overflow: "hidden"
        }}>
          {/* 제목 섹션 */}
          <div style={{
            padding: "24px",
            borderBottom: "1px solid #e5e7eb"
          }}>
            <div style={{
              display: "inline-block",
              padding: "4px 10px",
              backgroundColor: "#f0f9ff",
              color: "#0369a1",
              border: "1px solid #bae6fd",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "600",
              marginBottom: "12px"
            }}>
              {data.bsnsDivNm || "일반용역"}
            </div>
            
            <h1 style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "#111",
              marginBottom: "12px",
              lineHeight: "1.4"
            }}>
              {data.prdctClsfcNoNm}
            </h1>

            <div style={{
              display: "flex",
              gap: "16px",
              fontSize: "14px",
              color: "#666",
              flexWrap: "wrap"
            }}>
              <span>📋 등록번호: <strong>{data.bfSpecRgstNo}</strong></span>
              {data.refNo && <span>🔖 참조번호: <strong>{data.refNo}</strong></span>}
            </div>
          </div>

          {/* 기본 정보 */}
          <div style={{
            padding: "24px",
            borderBottom: "1px solid #e5e7eb"
          }}>
            <h2 style={{
              fontSize: "16px",
              fontWeight: "600",
              color: "#111",
              marginBottom: "16px"
            }}>
              📌 기본 정보
            </h2>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "16px"
            }}>
              <InfoItem label="수요기관" value={data.rlDminsttNm} />
              <InfoItem label="주문기관" value={data.orderInsttNm} />
              <InfoItem label="배정예산" value={formatAmount(data.asignBdgtAmt)} highlight />
              <InfoItem label="접수일" value={formatDate(data.rcptDt)} />
              <InfoItem label="의견등록마감" value={formatDate(data.opninRgstClseDt)} highlight />
              <InfoItem label="납품기한" value={formatDate(data.dlvrTmlmtDt)} />
              <InfoItem label="담당자" value={data.ofclNm} />
              <InfoItem label="연락처" value={data.ofclTelNo} />
            </div>
          </div>

          {/* 첨부파일 */}
          {attachments.length > 0 && (
            <div style={{
              padding: "24px",
              borderBottom: "1px solid #e5e7eb"
            }}>
              <h2 style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#111",
                marginBottom: "16px"
              }}>
                📎 첨부파일 ({attachments.length}개)
              </h2>

              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px"
              }}>
                {attachments.map((url, idx) => {
                  // 첨부파일 번호에 따라 의미있는 이름 지정
                  const fileNames = [
                    "제안요청서",
                    "과업지시서", 
                    "참고자료",
                    "첨부문서",
                    "기타문서"
                  ];
                  
                  const fileName = fileNames[idx] || `첨부문서 ${idx + 1}`;
                  
                  return (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px 16px",
                        backgroundColor: "#f9fafb",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        textDecoration: "none",
                        color: "#111",
                        transition: "all 0.2s"
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = "#f0f9ff";
                        e.currentTarget.style.borderColor = "#bae6fd";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = "#f9fafb";
                        e.currentTarget.style.borderColor = "#e5e7eb";
                      }}
                    >
                      <span style={{ fontSize: "24px" }}>📄</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "14px", fontWeight: "500" }}>
                          {fileName}
                        </div>
                        <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>
                          클릭하여 다운로드
                        </div>
                      </div>
                      <span style={{ fontSize: "18px", color: "#3b82f6" }}>↓</span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* 관련 입찰공고 */}
          {data.bidNtceNoList && (
            <div style={{
              padding: "24px"
            }}>
              <h2 style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#111",
                marginBottom: "12px"
              }}>
                🔗 관련 입찰공고
              </h2>
              <p style={{ fontSize: "14px", color: "#666" }}>
                {data.bidNtceNoList.split(',').map((bid, idx) => (
                  <span key={idx} style={{
                    display: "inline-block",
                    padding: "4px 8px",
                    backgroundColor: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    borderRadius: "4px",
                    marginRight: "8px",
                    marginBottom: "8px",
                    fontSize: "13px",
                    fontFamily: "monospace"
                  }}>
                    {bid.trim()}
                  </span>
                ))}
              </p>
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div style={{
          marginTop: "20px",
          textAlign: "center"
        }}>
          <button
            onClick={() => window.close()}
            style={{
              padding: "12px 32px",
              backgroundColor: "#6b7280",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(107, 114, 128, 0.3)"
            }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value, highlight = false }) {
  return (
    <div style={{
      padding: "12px",
      backgroundColor: highlight ? "#f0f9ff" : "#f9fafb",
      border: `1px solid ${highlight ? "#bae6fd" : "#e5e7eb"}`,
      borderRadius: "8px"
    }}>
      <div style={{
        fontSize: "12px",
        color: "#666",
        marginBottom: "4px"
      }}>
        {label}
      </div>
      <div style={{
        fontSize: "14px",
        fontWeight: "600",
        color: highlight ? "#0369a1" : "#111"
      }}>
        {value || "-"}
      </div>
    </div>
  );
}
