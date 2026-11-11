import Image, { type ImageProps } from "next/image";

type ResortImageProps = Omit<ImageProps, "src" | "alt"> & {
  src?: string | null;
  alt: string;
  aspectClassName?: string;
  className?: string;
  containerClassName?: string;
  showMissingPhoto?: boolean;
};

const fallbackImage = "/bg/skilandschaft.png";

export default function ResortImage({
  src,
  alt,
  aspectClassName = "aspect-[16/9]",
  className = "",
  containerClassName = "",
  showMissingPhoto = false,
  sizes = "(min-width: 1024px) 640px, 100vw",
  ...props
}: ResortImageProps) {
  const imageSrc = src && src.trim() ? src : fallbackImage;

  return (
    <div className={`relative overflow-hidden rounded-[var(--alpivo-radius-lg)] bg-[var(--alpivo-mist-gray)] ${aspectClassName} ${containerClassName}`}>
      {showMissingPhoto && imageSrc === fallbackImage ? (
        <div className="grid h-full min-h-20 place-items-center px-3 text-center text-xs font-medium text-slate-600">
          Kein Resortfoto verfügbar
        </div>
      ) : <Image
        src={imageSrc}
        alt={alt}
        fill
        sizes={sizes}
        className={`object-cover ${className}`}
        {...props}
      />}
    </div>
  );
}
