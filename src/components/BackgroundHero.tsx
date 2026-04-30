import Image from "next/image";

type BackgroundHeroProps = {
  imageSrc: string;
  children: React.ReactNode;
  heightClass: string;
  imagePosition: string;
};

export default function BackgroundHero({
  imageSrc,
  children,
  heightClass,
  imagePosition = "center",
}: BackgroundHeroProps) {
  return (
    <section
      className={`hero-shell relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen overflow-hidden ${
        heightClass ?? "min-h-[320px]"
      }`}
    >
      <div className="pointer-events-none absolute inset-0">
        <Image
          src={imageSrc}
          alt=""
          fill
          className="hero-media object-cover"
          style={{ objectPosition: imagePosition }}
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/35 via-slate-950/35 to-slate-950/85" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/65 via-slate-950/25 to-slate-950/10" />
      </div>
      <div className="hero-content relative z-10 pointer-events-auto">{children}</div>
    </section>
  );
}
