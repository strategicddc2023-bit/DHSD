export default function HeroSection() {
  return (
    <section className="hero" id="top">
      {/* Gradient blob - top */}
      <div className="hero__blob hero__blob--top" aria-hidden="true">
        <div className="hero__blob-shape hero__blob-shape--top" />
      </div>

      {/* Content */}
      <div className="hero__content">
        <h1>ระบบรายงานข้อมูล พชอ.<br />กรมควบคุมโรค</h1>
      </div>

      {/* Gradient blob - bottom */}
      <div className="hero__blob hero__blob--bottom" aria-hidden="true">
        <div className="hero__blob-shape hero__blob-shape--bottom" />
      </div>
    </section>
  );
}
