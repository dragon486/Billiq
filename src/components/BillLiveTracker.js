"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSSE } from "@/hooks/useSSE";

export default function BillLiveTracker({ initialData, billId }) {
  const [status, setStatus] = useState(initialData.status || "placed");
  const [eta, setEta] = useState(initialData.estimatedMinutes);
  const [timestamps, setTimestamps] = useState({
    placed: initialData.createdAt,
    preparing: initialData.preparingStartedAt,
    ready: initialData.readyAt,
    served: initialData.servedAt
  });

  const onMessage = useCallback((event, data) => {
    if (event === 'connected' || event === 'order:update') {
      setStatus(data.status);
      if (data.estimatedMinutes) setEta(data.estimatedMinutes);
      
      if (data.updatedAt || data.statusAt) {
        setTimestamps(prev => ({
          ...prev,
          [data.status]: data.updatedAt || data.statusAt
        }));
      } else {
        setTimestamps(prev => ({
          ...prev,
          [data.status]: new Date().toISOString()
        }));
      }
    }
  }, []);

  const { connected } = useSSE({
    url: `/api/bills/${billId}/stream`,
    onMessage
  });

  const formatTime = (isoString) => {
    if (!isoString) return "--:--";
    return new Date(isoString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).toLowerCase();
  };

  const steps = [
    { key: "placed", label: "PLACED", icon: <CheckIcon /> },
    { key: "preparing", label: "PREPARING", icon: <ChefIcon /> },
    { key: "ready", label: "READY", icon: <TrayIcon /> },
    { key: "served", label: "SERVED", icon: <DoubleCheckIcon /> }
  ];

  const currentIdx = steps.findIndex(s => s.key === status);
  const accentColor = "#D4AF37"; // Premium Gold

  return (
    <div style={{ width: "100%", marginTop: "12px" }}>
      {/* STATUS CARD */}
      <div style={{ 
        background: "#111", 
        color: "#fff", 
        padding: "48px 24px", 
        borderRadius: "24px", 
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        marginBottom: "24px",
        position: "relative",
        overflow: "hidden"
      }}>
        <p style={{ 
          textAlign: "center", 
          fontSize: "0.7rem", 
          fontWeight: "800", 
          letterSpacing: "3px", 
          color: "rgba(255,255,255,0.3)", 
          marginBottom: "36px",
          textTransform: "uppercase"
        }}>Order Status</p>

        <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
          {/* Connecting Line Base */}
          <div style={{ 
            position: "absolute", top: "24px", left: "10%", right: "10%", height: "2.5px", 
            background: "rgba(255,255,255,0.1)", zIndex: 0 
          }}></div>
          
          {/* Active Progress Line (Gold) */}
          <div style={{ 
            position: "absolute", top: "24px", left: "10%", height: "2.5px", 
            background: accentColor, zIndex: 1,
            transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
            width: `${(currentIdx / (steps.length - 1)) * 80}%`
          }}></div>

          {steps.map((step, i) => {
            const isDone = i <= currentIdx;
            const isActive = i === currentIdx;
            
            return (
              <div key={step.key} style={{ 
                zIndex: 2, 
                display: "flex", 
                flexDirection: "column", 
                alignItems: "center", 
                width: "25%" 
              }}>
                <div style={{ 
                  width: "48px", 
                  height: "48px", 
                  borderRadius: "50%", 
                  background: isActive ? "#111" : isDone ? "#222" : "#111",
                  border: `2.5px solid ${isActive ? accentColor : isDone ? "#fff" : "rgba(255,255,255,0.2)"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: isActive ? accentColor : isDone ? "#fff" : "rgba(255,255,255,0.2)",
                  transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                  marginBottom: "14px",
                  boxShadow: isActive ? `0 0 20px ${accentColor}44` : "none",
                  transform: isActive ? "scale(1.1)" : "scale(1)"
                }}>
                  {step.icon}
                </div>
                <p style={{ 
                  fontSize: "0.65rem", 
                  fontWeight: "900", 
                  color: isDone ? "#fff" : "rgba(255,255,255,0.3)", 
                  marginBottom: "6px",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase"
                }}>{step.label}</p>
                <p style={{ 
                  fontSize: "0.6rem", 
                  fontWeight: "600", 
                  color: isDone ? "rgba(255,255,255,0.4)" : "transparent"
                }}>{formatTime(timestamps[step.key])}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ESTIMATED TIME CARD */}
      {(status === "placed" || status === "preparing") && (
        <div style={{ 
          background: "#fff", 
          padding: "24px 32px", 
          borderRadius: "24px", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between",
          border: "1px solid #f0f0f0",
          marginBottom: "32px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.03)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div style={{ 
              width: "52px", height: "52px", borderRadius: "50%", 
              background: "#fafafa", display: "flex", alignItems: "center", 
              justifyContent: "center", border: "1.5px dashed #ddd" 
            }}>
              <ClockIcon />
            </div>
            <div>
              <p style={{ fontSize: "0.65rem", fontWeight: "800", color: "#999", textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: "4px" }}>Estimated Time</p>
              <p style={{ fontSize: "1.3rem", fontWeight: "900", color: "#111" }}>{eta || 15}-{ (eta || 15) + 5 } mins</p>
            </div>
          </div>
          <div className="tray-animation-container">
             <TrayIllustration />
          </div>
        </div>
      )}

      <style jsx>{`
        .tray-animation-container {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-15px); }
        }
      `}</style>
    </div>
  );
}

// ICONS
function CheckIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;
}

function ChefIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"></path><line x1="6" y1="17" x2="18" y2="17"></line></svg>;
}

function TrayIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 19h18"></path><path d="M5 19a7 7 0 1 1 14 0"></path><path d="M12 5V3"></path></svg>;
}

function DoubleCheckIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="7 13 12 18 22 8"></polyline><polyline points="2 12 7 17 12 12"></polyline></svg>;
}

function ClockIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="M2 12h2"></path><path d="M20 12h2"></path></svg>;
}

function TrayIllustration() {
  return (
    <svg width="70" height="40" viewBox="0 0 70 40" fill="none">
       <path d="M10 32H60" stroke="#f0f0f0" strokeWidth="2.5" strokeLinecap="round"/>
       <path d="M15 32C15 18 55 18 55 32" stroke="#111" strokeWidth="2.5" strokeLinecap="round"/>
       <circle cx="35" cy="14" r="3" fill="#111"/>
       <line x1="0" y1="25" x2="6" y2="25" stroke="#f9f9f9" strokeWidth="2"/>
       <line x1="2" y1="20" x2="8" y2="20" stroke="#f9f9f9" strokeWidth="2"/>
    </svg>
  );
}
