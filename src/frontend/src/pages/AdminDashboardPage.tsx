import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Camera,
  ImagePlus,
  LogOut,
  RefreshCw,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import type { Photo } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useGetAllPhotos } from "../hooks/useQueries";

function formatDate(ns: bigint): string {
  return new Date(Number(ns / 1_000_000n)).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function PhotoManageCard({
  photo,
  index,
  onDelete,
}: {
  photo: Photo;
  index: number;
  onDelete: (photo: Photo) => void;
}) {
  return (
    <motion.div
      data-ocid={`photos.item.${index + 1}`}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="group relative bg-card rounded-xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-parchment">
        <img
          src={photo.blobId.getDirectURL()}
          alt={photo.title}
          className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-105"
          loading="lazy"
        />
        {/* Delete button overlay */}
        <button
          type="button"
          data-ocid={`photos.delete_button.${index + 1}`}
          onClick={() => onDelete(photo)}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-destructive/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive shadow-md"
          title="Delete photo"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="p-3">
        <p className="font-serif text-sm font-semibold text-foreground line-clamp-1 mb-0.5">
          {photo.title}
        </p>
        <p className="text-xs text-muted-foreground font-body">
          {formatDate(photo.uploadedAt)}
        </p>
      </div>
    </motion.div>
  );
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { actor } = useActor();
  const { data: photos, isLoading: photosLoading } = useGetAllPhotos();

  // Session validation
  useEffect(() => {
    const token = localStorage.getItem("avk_admin_token");
    if (!token) {
      navigate({ to: "/admin/login" });
      return;
    }
    if (actor) {
      actor.validateSession(token).then((valid) => {
        if (!valid) {
          localStorage.removeItem("avk_admin_token");
          navigate({ to: "/admin/login" });
        }
      });
    }
  }, [actor, navigate]);

  // Upload state
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete state
  const [photoToDelete, setPhotoToDelete] = useState<Photo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setUploadSuccess(false);
    setUploadError("");
    const url = URL.createObjectURL(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(url);
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file?.type.startsWith("image/")) {
        setSelectedFile(file);
        setUploadSuccess(false);
        setUploadError("");
        const url = URL.createObjectURL(file);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(url);
      }
    },
    [previewUrl],
  );

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function clearSelection() {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    setUploadSuccess(false);
    setUploadError("");
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem("avk_admin_token");
    if (!actor || !selectedFile || !token) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError("");
    setUploadSuccess(false);

    try {
      const bytes = new Uint8Array(await selectedFile.arrayBuffer());
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => {
        setUploadProgress(Math.round(pct));
      });

      await actor.addPhoto(token, blob, title, caption || null);

      setUploadSuccess(true);
      setTitle("");
      setCaption("");
      clearSelection();
      setUploadProgress(100);
      toast.success("Photo uploaded successfully!");
      queryClient.invalidateQueries({ queryKey: ["photos"] });
    } catch (err) {
      console.error(err);
      setUploadError("Upload failed. Please try again.");
      toast.error("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleLogout() {
    const token = localStorage.getItem("avk_admin_token");
    if (actor && token) {
      try {
        await actor.adminLogout(token);
      } catch {
        // Logout anyway
      }
    }
    localStorage.removeItem("avk_admin_token");
    navigate({ to: "/admin/login" });
  }

  async function handleDeleteConfirm() {
    if (!photoToDelete || !actor) return;
    const token = localStorage.getItem("avk_admin_token");
    if (!token) return;

    setIsDeleting(true);
    try {
      await actor.deletePhoto(token, photoToDelete.id);
      toast.success(`"${photoToDelete.title}" deleted successfully.`);
      queryClient.invalidateQueries({ queryKey: ["photos"] });
    } catch {
      toast.error("Failed to delete photo. Please try again.");
    } finally {
      setIsDeleting(false);
      setPhotoToDelete(null);
    }
  }

  return (
    <div
      className="min-h-screen bg-background"
      style={{
        backgroundImage: `
          radial-gradient(ellipse at 5% 10%, oklch(0.88 0.12 80 / 0.2) 0%, transparent 40%),
          radial-gradient(ellipse at 95% 90%, oklch(0.82 0.08 260 / 0.1) 0%, transparent 40%)
        `,
      }}
    >
      {/* ——— Top Nav ——— */}
      <header
        className="sticky top-0 z-40 border-b border-border backdrop-blur-sm"
        style={{ background: "oklch(var(--navy) / 0.96)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors text-sm font-body"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Gallery</span>
            </Link>
            <span className="text-white/30">|</span>
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-gold" />
              <h1 className="font-serif text-white font-semibold text-sm sm:text-base">
                Admin Panel
              </h1>
            </div>
          </div>

          <Button
            data-ocid="dashboard.logout_button"
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="gap-1.5 text-white border-white/20 bg-transparent hover:bg-white/10 font-body text-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* ——— Upload Section ——— */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "oklch(var(--gold))" }}
            >
              <ImagePlus className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-foreground">
                Upload New Photo
              </h2>
              <p className="text-muted-foreground text-xs font-body">
                Add a new memory to the gallery
              </p>
            </div>
          </div>

          <form
            onSubmit={handleUpload}
            className="bg-card rounded-2xl border border-border p-6 sm:p-8 shadow-sm"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left: Form fields */}
              <div className="space-y-5">
                {/* Title */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="title"
                    className="font-body font-medium text-sm text-foreground"
                  >
                    Photo Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    data-ocid="upload.title_input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Annual Sports Day 2025"
                    required
                    className="font-body bg-background"
                  />
                </div>

                {/* Caption */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="caption"
                    className="font-body font-medium text-sm text-foreground"
                  >
                    Caption{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </Label>
                  <Textarea
                    id="caption"
                    data-ocid="upload.caption_textarea"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Describe this special moment..."
                    rows={4}
                    className="font-body bg-background resize-none"
                  />
                </div>

                {/* Upload progress */}
                {isUploading && (
                  <div data-ocid="upload.loading_state" className="space-y-2">
                    <div className="flex items-center justify-between text-sm font-body">
                      <span className="text-muted-foreground">
                        Uploading...
                      </span>
                      <span className="text-foreground font-medium">
                        {uploadProgress}%
                      </span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}

                {/* Success/Error states */}
                <AnimatePresence>
                  {uploadSuccess && (
                    <motion.div
                      data-ocid="upload.success_state"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-body"
                    >
                      <Star className="w-4 h-4 fill-current flex-shrink-0" />
                      Photo uploaded successfully!
                    </motion.div>
                  )}
                  {uploadError && (
                    <motion.div
                      data-ocid="upload.error_state"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-body"
                    >
                      {uploadError}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Upload button */}
                <Button
                  data-ocid="upload.upload_button"
                  type="submit"
                  disabled={isUploading || !selectedFile || !title}
                  className="w-full gap-2 h-11 font-body font-semibold text-primary-foreground"
                  style={{ background: "oklch(var(--navy))" }}
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload Photo
                    </>
                  )}
                </Button>
              </div>

              {/* Right: File picker / preview */}
              <div className="space-y-3">
                <Label className="font-body font-medium text-sm text-foreground">
                  Photo File <span className="text-destructive">*</span>
                </Label>

                {!previewUrl ? (
                  <div
                    data-ocid="upload.dropzone"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className="relative border-2 border-dashed border-border rounded-xl h-52 flex flex-col items-center justify-center bg-background hover:bg-parchment transition-colors group"
                  >
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 w-full h-full cursor-pointer rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label="Select photo file"
                    />
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-transform group-hover:scale-110 pointer-events-none"
                      style={{ background: "oklch(var(--gold) / 0.15)" }}
                    >
                      <ImagePlus
                        className="w-5 h-5"
                        style={{ color: "oklch(var(--gold))" }}
                      />
                    </div>
                    <p className="font-body text-sm text-foreground font-medium mb-1 pointer-events-none">
                      Drop photo here or{" "}
                      <span className="text-gold underline">browse</span>
                    </p>
                    <p className="font-body text-xs text-muted-foreground pointer-events-none">
                      JPG, PNG, GIF, WEBP up to 10MB
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      data-ocid="upload.upload_button"
                      onChange={handleFileSelect}
                    />
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden border border-border h-52">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                      <p className="text-white text-xs font-body">
                        {selectedFile?.name}
                      </p>
                      <button
                        type="button"
                        onClick={clearSelection}
                        className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/40 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </form>
        </section>

        {/* ——— Manage Photos Section ——— */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "oklch(var(--navy))" }}
              >
                <Camera className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold text-foreground">
                  Manage Photos
                </h2>
                <p className="text-muted-foreground text-xs font-body">
                  {photos?.length
                    ? `${photos.length} photo${photos.length !== 1 ? "s" : ""} in gallery`
                    : "No photos yet"}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                queryClient.invalidateQueries({ queryKey: ["photos"] })
              }
              className="gap-1.5 text-xs font-body"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </Button>
          </div>

          {/* Loading skeletons */}
          {photosLoading && (
            <div
              data-ocid="gallery.loading_state"
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
            >
              {(["a", "b", "c", "d", "e", "f", "g", "h"] as const).map((k) => (
                <div
                  key={k}
                  className="bg-card rounded-xl overflow-hidden border border-border"
                >
                  <Skeleton className="aspect-[4/3] w-full" />
                  <div className="p-3 space-y-1.5">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-2.5 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!photosLoading && (!photos || photos.length === 0) && (
            <div
              data-ocid="photos.empty_state"
              className="flex flex-col items-center justify-center py-16 text-center bg-card rounded-2xl border border-dashed border-border"
            >
              <Camera className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="font-serif text-base font-semibold text-foreground mb-1">
                No photos yet
              </p>
              <p className="text-muted-foreground text-sm font-body">
                Upload your first photo above.
              </p>
            </div>
          )}

          {/* Photos grid */}
          {!photosLoading && photos && photos.length > 0 && (
            <AnimatePresence>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {photos.map((photo, index) => (
                  <PhotoManageCard
                    key={photo.id.toString()}
                    photo={photo}
                    index={index}
                    onDelete={setPhotoToDelete}
                  />
                ))}
              </div>
            </AnimatePresence>
          )}
        </section>
      </main>

      {/* ——— Delete Confirmation Dialog ——— */}
      <AlertDialog
        open={!!photoToDelete}
        onOpenChange={(open) => !open && setPhotoToDelete(null)}
      >
        <AlertDialogContent data-ocid="confirm.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">
              Delete Photo?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-body">
              Are you sure you want to delete{" "}
              <strong>"{photoToDelete?.title}"</strong>? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="confirm.cancel_button"
              className="font-body"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="confirm.confirm_button"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-body gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-4 text-center bg-parchment mt-16">
        <p className="text-muted-foreground text-xs font-body">
          © {new Date().getFullYear()}.{" "}
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
