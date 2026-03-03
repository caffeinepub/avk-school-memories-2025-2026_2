import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { BookOpen, Camera, GraduationCap, Lock, Star } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { Photo } from "../backend.d";
import { useGetAllPhotos } from "../hooks/useQueries";

function formatDate(ns: bigint): string {
  return new Date(Number(ns / 1_000_000n)).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function PhotoCard({ photo, index }: { photo: Photo; index: number }) {
  return (
    <motion.article
      data-ocid={`gallery.item.${index + 1}`}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.06, ease: "easeOut" }}
      className="group relative bg-card rounded-lg overflow-hidden shadow-sm border border-border photo-card-hover cursor-pointer"
    >
      {/* Photo image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-parchment">
        <img
          src={photo.blobId.getDirectURL()}
          alt={photo.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {/* Vintage corner ornament */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-white/40 rounded-tl" />
          <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-white/40 rounded-tr" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-white/40 rounded-bl" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-white/40 rounded-br" />
        </div>
      </div>

      {/* Card content */}
      <div className="p-4">
        <h3 className="font-serif font-semibold text-foreground text-base leading-snug mb-1 line-clamp-1">
          {photo.title}
        </h3>
        {photo.caption && (
          <p className="text-muted-foreground text-sm line-clamp-2 mb-2">
            {photo.caption}
          </p>
        )}
        <p className="text-xs text-muted-foreground font-body flex items-center gap-1">
          <Camera className="w-3 h-3 text-gold" />
          {formatDate(photo.uploadedAt)}
        </p>
      </div>
    </motion.article>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-card rounded-lg overflow-hidden border border-border shadow-sm">
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

export default function GalleryPage() {
  const { data: photos, isLoading } = useGetAllPhotos();

  const currentYear = new Date().getFullYear();

  return (
    <div
      data-ocid="gallery.page"
      className="min-h-screen bg-background"
      style={{
        backgroundImage: `
          radial-gradient(ellipse at 10% 20%, oklch(0.88 0.12 80 / 0.25) 0%, transparent 50%),
          radial-gradient(ellipse at 90% 80%, oklch(0.82 0.08 260 / 0.12) 0%, transparent 50%)
        `,
      }}
    >
      {/* ——— Header ——— */}
      <header className="relative overflow-hidden">
        {/* Hero Banner */}
        <div className="relative h-64 sm:h-80 md:h-96">
          <img
            src="/assets/generated/avk-hero-banner.dim_1200x400.jpg"
            alt="AVK School Memories 2025-2026"
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, oklch(0.22 0.09 264 / 0.55) 0%, oklch(0.22 0.09 264 / 0.7) 100%)",
            }}
          />

          {/* Header content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center gap-3 mb-3"
            >
              <img
                src="/assets/generated/avk-logo-transparent.dim_200x200.png"
                alt="AVK Logo"
                className="w-14 h-14 object-contain drop-shadow-lg"
              />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-serif font-bold text-white text-3xl sm:text-4xl md:text-5xl drop-shadow-lg leading-tight"
            >
              AVK School Memories
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="font-display text-white/85 text-lg sm:text-xl mt-1 tracking-widest uppercase"
            >
              2025 – 2026
            </motion.p>

            {/* Decorative divider */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="flex items-center gap-3 mt-4"
            >
              <div className="w-16 h-px bg-gold" />
              <Star className="w-4 h-4 text-gold fill-current" />
              <div className="w-16 h-px bg-gold" />
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-white/70 text-sm mt-3 font-body flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Cherishing every moment of the academic journey
              <GraduationCap className="w-4 h-4" />
            </motion.p>
          </div>

          {/* Admin link top-right */}
          <Link
            data-ocid="admin.link"
            to="/admin/login"
            className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-white/80 text-xs font-body hover:bg-white/25 transition-colors border border-white/20"
          >
            <Lock className="w-3 h-3" />
            Admin
          </Link>
        </div>
      </header>

      {/* ——— Gallery Section ——— */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="font-serif text-2xl sm:text-3xl text-foreground font-bold mb-2">
            Photo Gallery
          </h2>
          <p className="text-muted-foreground font-body text-sm">
            {photos?.length
              ? `${photos.length} treasured moment${photos.length !== 1 ? "s" : ""} captured`
              : "Beautiful moments from our school year"}
          </p>
          <div className="flex items-center justify-center gap-3 mt-3">
            <div
              className="w-12 h-px"
              style={{ background: "oklch(var(--gold))" }}
            />
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: "oklch(var(--gold))" }}
            />
            <div
              className="w-12 h-px"
              style={{ background: "oklch(var(--gold))" }}
            />
          </div>
        </motion.div>

        {/* Loading state */}
        {isLoading && (
          <div
            data-ocid="gallery.loading_state"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {(["a", "b", "c", "d", "e", "f"] as const).map((k) => (
              <SkeletonCard key={k} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && (!photos || photos.length === 0) && (
          <motion.div
            data-ocid="gallery.empty_state"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center py-24 px-8 text-center"
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
              style={{ background: "oklch(var(--parchment))" }}
            >
              <Camera
                className="w-8 h-8"
                style={{ color: "oklch(var(--gold))" }}
              />
            </div>
            <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
              No Photos Yet
            </h3>
            <p className="text-muted-foreground font-body text-sm max-w-xs">
              The gallery is waiting for beautiful memories. Check back soon!
            </p>
          </motion.div>
        )}

        {/* Photo grid */}
        {!isLoading && photos && photos.length > 0 && (
          <AnimatePresence>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {photos.map((photo, index) => (
                <PhotoCard
                  key={photo.id.toString()}
                  photo={photo}
                  index={index}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </main>

      {/* ——— Footer ——— */}
      <footer className="border-t border-border mt-16 py-8 px-4 text-center bg-parchment">
        <div className="flex items-center justify-center gap-2 mb-3">
          <img
            src="/assets/generated/avk-logo-transparent.dim_200x200.png"
            alt="AVK"
            className="w-8 h-8 object-contain opacity-70"
          />
          <span className="font-serif text-foreground/80 text-sm font-semibold">
            AVK School Memories 2025–2026
          </span>
        </div>
        <p className="text-muted-foreground text-xs font-body">
          © {currentYear}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Built with love using caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
