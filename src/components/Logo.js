export default function Logo({ size = "md", dark = false }) {
  // Base dimensions
  const dims = {
    sm: { width: "30px", height: "36px", padding: "6px 5px", gap: "3px", text: "1.2rem", line: "2px", dot: "4px" },
    md: { width: "40px", height: "48px", padding: "10px 6px", gap: "4px", text: "1.5rem", line: "2px", dot: "5px" },
    lg: { width: "50px", height: "60px", padding: "12px 8px", gap: "5px", text: "2.4rem", line: "3px", dot: "6px" }
  };
  
  const current = dims[size] || dims.md;
  const bgColor = dark ? "#fff" : "#000";
  const fgColor = dark ? "#000" : "#fff";

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ 
        width: current.width, 
        height: current.height, 
        background: bgColor, 
        padding: current.padding, 
        display: 'flex', 
        flexDirection: 'column' 
      }}>
        <div style={{ height: current.line, background: fgColor, marginBottom: current.gap, width: '100%' }}></div>
        <div style={{ height: current.line, background: fgColor, marginBottom: current.gap, width: '100%' }}></div>
        <div style={{ height: current.line, background: fgColor, marginBottom: current.gap, width: '70%' }}></div>
        <div style={{ width: current.dot, height: current.dot, background: fgColor, marginTop: 'auto', alignSelf: 'flex-end' }}></div>
      </div>
      <span style={{ 
        fontFamily: "'Syne', sans-serif", 
        fontSize: current.text, 
        fontWeight: '800', 
        color: bgColor, 
        letterSpacing: '-1px', 
        lineHeight: 1 
      }}>
        BILLIQ
      </span>
    </div>
  );
}
