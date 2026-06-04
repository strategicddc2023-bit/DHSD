type HeroSectionProps = {
  onScrollToForm: () => void;
};

export default function HeroSection({ onScrollToForm }: HeroSectionProps) {
  return (
    <section className="hero" id="top">
      <div className="hero__overlay" />
      <div className="hero__content">
        <p className="hero__kicker">district_health_system_ddc</p>
        <h1>ระบบรายงาน พชอ. ระดับประเทศ</h1>
        <p>
          โครงต้นแบบแบบ Single-Page Application เพื่อให้เห็นภาพการกรอกข้อมูลและการแสดงผล Dashboard
          ก่อนพัฒนาเต็มรูปแบบ
        </p>
      </div>
    </section>
  );
}
