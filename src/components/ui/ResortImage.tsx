import Image, { type ImageProps } from "next/image";

type ResortImageProps = Omit<ImageProps, "src" | "alt"> & {
  src?: string | null;
  alt: string;
  aspectClassName?: string;
  className?: string;
  containerClassName?: string;
};

const fallbackImage = "/bg/skilandschaft.png";

export default function ResortImage({
  src,
  alt,
  aspectClassName = "aspect-[16/9]",
  className = "",
  containerClassName = "",
  sizes = "(min-width: 1024px) 640px, 100vw",
  ...props
}: ResortImageProps) {
  const imageSrc = src && src.trim() ? src : fallbackImage;

  return (
    <div className={`relative overflow-hidden rounded-[var(--alpivo-radius-lg)] bg-[var(--alpivo-mist-gray)] ${aspectClassName} ${containerClassName}`}>
      <Image
        src={imageSrc}
        alt={alt}
        fill
        sizes={sizes}
        className={`object-cover ${className}`}
        {...props}
      />
    </div>
  );
}
