import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, X, Download, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface DocumentViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileUrl: string | null;
  fileName?: string;
  title?: string;
}

export function DocumentViewer({
  open,
  onOpenChange,
  fileUrl,
  fileName,
  title = "View Document",
}: DocumentViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  // Extract file path from Supabase storage URL and generate signed URL
  useEffect(() => {
    const generateSignedUrl = async () => {
      if (!fileUrl || !open) {
        setSignedUrl(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Check if it's a Supabase storage URL
        // Pattern: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
        // or: https://[project].supabase.co/storage/v1/object/sign/[bucket]/[path]
        const supabaseUrlPattern = /storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+?)(?:\?|$)/;
        const match = fileUrl.match(supabaseUrlPattern);
        
        let bucketName: string | null = null;
        let filePath: string | null = null;
        
        if (match) {
          // Extract from full URL
          bucketName = match[1];
          filePath = decodeURIComponent(match[2]).split('?')[0];
        } else if (!fileUrl.includes('http://') && !fileUrl.includes('https://')) {
          // If it's just a file path (e.g., "user-id/timestamp.ext"), assume receipts bucket
          bucketName = 'receipts';
          filePath = fileUrl;
        }
        
        if (bucketName && filePath) {
          // Generate signed URL for private bucket (valid for 1 hour)
          const { data, error: urlError } = await supabase.storage
            .from(bucketName)
            .createSignedUrl(filePath, 3600); // 1 hour expiry
          
          if (urlError) {
            // If signed URL fails, try using the original URL (might be public)
            console.warn("Failed to generate signed URL, using original:", urlError);
            setSignedUrl(fileUrl);
          } else {
            setSignedUrl(data.signedUrl);
          }
        } else {
          // If it's not a Supabase URL, use it as-is (might be a direct URL)
          setSignedUrl(fileUrl);
        }
      } catch (err: any) {
        console.error("Error generating signed URL:", err);
        setError(err.message || "Failed to load document");
        // Fallback to original URL
        setSignedUrl(fileUrl);
      } finally {
        setIsLoading(false);
      }
    };

    generateSignedUrl();
  }, [fileUrl, open]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setIsLoading(true);
      setError(null);
      setSignedUrl(null);
    }
    onOpenChange(newOpen);
  };

  const handleDownload = async () => {
    const urlToUse = signedUrl || fileUrl;
    if (urlToUse) {
      try {
        // Fetch the file and create a blob URL for download
        const response = await fetch(urlToUse);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = fileName || "document";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up blob URL
        window.URL.revokeObjectURL(blobUrl);
      } catch (err) {
        // Fallback to direct download
        const link = document.createElement("a");
        link.href = urlToUse;
        link.download = fileName || "document";
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  const handleOpenInNewTab = () => {
    const urlToUse = signedUrl || fileUrl;
    if (urlToUse) {
      window.open(urlToUse, "_blank");
    }
  };

  const displayUrl = signedUrl || fileUrl;
  const isImage = displayUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isPdf = displayUrl?.match(/\.pdf$/i);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{title}</DialogTitle>
              {fileName && (
                <DialogDescription className="mt-1">{fileName}</DialogDescription>
              )}
            </div>
            <div className="flex items-center gap-2">
              {displayUrl && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="gap-2"
                    disabled={isLoading}
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenInNewTab}
                    className="gap-2"
                    disabled={isLoading}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open in New Tab
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="relative flex-1 overflow-auto p-6 bg-muted/30">
          {!fileUrl ? (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <p className="text-muted-foreground">No document available</p>
            </div>
          ) : error && !signedUrl ? (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <p className="text-destructive mb-2">Failed to load document</p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={handleOpenInNewTab}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open in New Tab
              </Button>
            </div>
          ) : (
            <div className="relative w-full">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}

              {isImage && displayUrl ? (
                <div className="flex justify-center">
                  <img
                    src={displayUrl}
                    alt={fileName || "Document"}
                    className={cn(
                      "max-w-full h-auto rounded-lg shadow-lg",
                      isLoading && "opacity-0"
                    )}
                    onLoad={() => setIsLoading(false)}
                    onError={() => {
                      setIsLoading(false);
                      setError("Failed to load image");
                    }}
                  />
                </div>
              ) : isPdf && displayUrl ? (
                <div className="w-full h-[calc(90vh-200px)]">
                  <iframe
                    src={displayUrl}
                    className={cn(
                      "w-full h-full rounded-lg border",
                      isLoading && "opacity-0"
                    )}
                    onLoad={() => setIsLoading(false)}
                    onError={() => {
                      setIsLoading(false);
                      setError("Failed to load PDF");
                    }}
                    title={fileName || "PDF Document"}
                  />
                </div>
              ) : displayUrl ? (
                <div className="flex flex-col items-center justify-center h-96 text-center">
                  <p className="text-muted-foreground mb-4">
                    Preview not available for this file type
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleDownload}>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    <Button variant="outline" onClick={handleOpenInNewTab}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open in New Tab
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
