export default function HeroSection() {
  return (
    <section className="hero" id="top">
      {/* Gradient blob - top */}
      <div className="hero__blob hero__blob--top" aria-hidden="true">
        <div className="hero__blob-shape hero__blob-shape--top" />
      </div>

      {/* Content */}
      <div className="hero__content">
        <div className="hero__badge">
          <span>district_health_system_ddc</span>
        </div>
        <h1>ระบบรายงาน พชอ.<br />ระดับประเทศ</h1>
        <p>
          โครงต้นแบบแบบ Single-Page Application เพื่อให้เห็นภาพการกรอกข้อมูลและการแสดงผล Dashboard
          ก่อนพัฒนาเต็มรูปแบบ
        </p>
      </div>

      {/* Gradient blob - bottom */}
      <div className="hero__blob hero__blob--bottom" aria-hidden="true">
        <div className="hero__blob-shape hero__blob-shape--bottom" />
      </div>
    </section>
  );
}
