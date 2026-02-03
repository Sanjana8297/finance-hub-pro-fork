import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Tables, TablesUpdate } from "@/integrations/supabase/types";

export type Company = Tables<"companies">;

export function useCompany() {
  return useQuery({
    queryKey: ["company"],
    queryFn: async () => {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return null;
      }

      // Get profile for current user
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (profileError) {
        return null;
      }

      // Find TechVitta company
      const { data: techVittaCompany, error: techVittaError } = await supabase
        .from("companies")
        .select("*")
        .eq("name", "TechVitta")
        .maybeSingle();

      if (techVittaError) {
        console.error("Error finding TechVitta company:", techVittaError);
      }

      // If TechVitta exists and user's profile doesn't point to it, update the profile
      if (techVittaCompany && profile?.company_id !== techVittaCompany.id) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ company_id: techVittaCompany.id })
          .eq("id", user.id);

        if (updateError) {
          console.error("Error updating profile company_id:", updateError);
        } else {
          console.log("Updated profile to TechVitta company");
        }
        // Return TechVitta company
        return techVittaCompany;
      }

      // If profile has a company_id, use that
      if (profile?.company_id) {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", profile.company_id)
        .maybeSingle();

      if (error) throw error;
      return data;
      }

      // If no company_id in profile but TechVitta exists, return it
      if (techVittaCompany) {
        return techVittaCompany;
      }

      return null;
    },
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: TablesUpdate<"companies"> & { id: string }) => {
      const { id, ...data } = updates;
      const { error } = await supabase
        .from("companies")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company"] });
      toast({
        title: "Settings saved",
        description: "Company profile has been updated",
      });
    },
    onError: (error) => {
      console.error("Failed to update company:", error);
      toast({
        title: "Error",
        description: "Failed to save company settings",
        variant: "destructive",
      });
    },
  });
}

export function useRemoveCompanyLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ companyId }: { companyId: string }) => {
      // Delete ALL existing logo files from storage
      try {
        const { data: existingFiles, error: listError } = await supabase.storage
          .from("company-assets")
          .list(companyId);

        if (!listError && existingFiles && existingFiles.length > 0) {
          // Find all logo files (any extension or pattern)
          const logoFiles = existingFiles.filter(f => 
            f.name.toLowerCase().startsWith('logo')
          );
          
          if (logoFiles.length > 0) {
            const filesToDelete = logoFiles.map(f => `${companyId}/${f.name}`);
            const { error: deleteError } = await supabase.storage
              .from("company-assets")
              .remove(filesToDelete);
            
            if (deleteError) {
              console.warn("Error deleting logo files:", deleteError);
              // Continue even if storage deletion fails
            } else {
              console.log("Deleted logo files:", filesToDelete);
            }
          }
        }
      } catch (error) {
        console.warn("Error listing/deleting logo files:", error);
        // Continue even if storage deletion fails
      }

      // Update company record to remove logo_url
      const { error: updateError } = await supabase
        .from("companies")
        .update({ logo_url: null })
        .eq("id", companyId);

      if (updateError) {
        console.error("Error removing logo_url:", updateError);
        throw updateError;
      }

      return true;
    },
    onSuccess: () => {
      // Invalidate and refetch company data
      queryClient.invalidateQueries({ queryKey: ["company"] });
      queryClient.refetchQueries({ queryKey: ["company"] });
      toast({
        title: "Logo removed",
        description: "Company logo has been removed",
      });
    },
    onError: (error: any) => {
      console.error("Failed to remove logo:", error);
      toast({
        title: "Remove failed",
        description: error.message || "Failed to remove company logo. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useAllCompanies() {
  return useQuery({
    queryKey: ["all-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useSwitchCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newCompanyId: string) => {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error("User not authenticated");
      }

      const { error } = await supabase
        .from("profiles")
        .update({ company_id: newCompanyId })
        .eq("id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate company query to refetch with new company
      queryClient.invalidateQueries({ queryKey: ["company"] });
      queryClient.invalidateQueries({ queryKey: ["all-companies"] });
      // Also invalidate auth context data
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({
        title: "Company switched",
        description: "You have successfully switched to the new company. Page will refresh...",
      });
      // Reload page to refresh all data including AuthContext
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    },
    onError: (error: any) => {
      console.error("Failed to switch company:", error);
      toast({
        title: "Switch failed",
        description: error.message || "Failed to switch company. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useUploadCompanyLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ companyId, file }: { companyId: string; file: File }) => {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload a JPEG, PNG, WebP, or SVG image.');
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('File size exceeds 5MB limit.');
      }

      const fileExt = file.name.split(".").pop()?.toLowerCase();
      const fileName = `${companyId}/logo.${fileExt}`;
      const timestamp = Date.now();

      console.log("Uploading logo:", { fileName, fileType: file.type, fileSize: file.size });

      // Delete ALL existing logo files first to ensure clean state
      try {
        const { data: existingFiles, error: listError } = await supabase.storage
          .from("company-assets")
          .list(companyId);

        if (!listError && existingFiles && existingFiles.length > 0) {
          // Find all logo files (any extension or pattern)
          const logoFiles = existingFiles.filter(f => 
            f.name.toLowerCase().startsWith('logo')
          );
          
          if (logoFiles.length > 0) {
            const filesToDelete = logoFiles.map(f => `${companyId}/${f.name}`);
            const { error: deleteError } = await supabase.storage
              .from("company-assets")
              .remove(filesToDelete);
            
            if (deleteError) {
              console.warn("Error deleting old logo files:", deleteError);
            } else {
              console.log("Deleted old logo files:", filesToDelete);
              // Small delay after deletion
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
        }
      } catch (error) {
        console.warn("Error listing/deleting old files:", error);
        // Continue with upload even if deletion fails
      }

      // Upload new logo - upsert will replace if exists
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from("company-assets")
        .upload(fileName, file, { 
          upsert: true, // Replace existing file
          contentType: file.type 
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        // Provide more helpful error messages
        if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('does not exist')) {
          throw new Error('Storage bucket not configured. Please contact your administrator to set up the company-assets bucket.');
        }
        if (uploadError.message.includes('new row violates row-level security policy')) {
          throw new Error('You do not have permission to upload company logos. Admin or Finance Manager role required.');
        }
        throw uploadError;
      }

      console.log("Logo uploaded successfully:", uploadData);

      if (uploadError) {
        // Provide more helpful error messages
        if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('does not exist')) {
          throw new Error('Storage bucket not configured. Please contact your administrator to set up the company-assets bucket.');
        }
        if (uploadError.message.includes('new row violates row-level security policy')) {
          throw new Error('You do not have permission to upload company logos. Admin or Finance Manager role required.');
        }
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("company-assets")
        .getPublicUrl(fileName);
      
      console.log("Logo uploaded, public URL:", publicUrl);

      // Store base URL without cache parameters (we'll add them when displaying)
      const baseLogoUrl = publicUrl.split('?')[0];

      // Update company with logo URL - store base URL, add timestamp for cache busting
      const logoUrlWithTimestamp = `${baseLogoUrl}?v=${timestamp}`;
      
      const { error: updateError, data: updateData } = await supabase
        .from("companies")
        .update({ logo_url: baseLogoUrl }) // Store base URL in database
        .eq("id", companyId)
        .select();

      if (updateError) {
        console.error("Error updating company logo_url:", updateError);
        throw updateError;
      }

      console.log("Company logo_url updated successfully:", updateData);
      console.log("Updated logo_url value in DB:", updateData?.[0]?.logo_url);

      // Verify the update by fetching the company record immediately
      const { data: verifyData, error: verifyError } = await supabase
        .from("companies")
        .select("logo_url")
        .eq("id", companyId)
        .single();

      if (verifyError) {
        console.error("Error verifying logo update:", verifyError);
      } else {
        console.log("Verified logo_url in database:", verifyData?.logo_url);
        if (verifyData?.logo_url !== baseLogoUrl) {
          console.warn("WARNING: Logo URL mismatch! Expected:", baseLogoUrl, "Got:", verifyData?.logo_url);
        }
      }

      // Wait a bit longer to ensure database commit and replication
      await new Promise(resolve => setTimeout(resolve, 300));

      return baseLogoUrl;
    },
    onSuccess: () => {
      // Invalidate and refetch company data to ensure latest logo is available
      queryClient.invalidateQueries({ queryKey: ["company"] });
      queryClient.refetchQueries({ queryKey: ["company"] });
      toast({
        title: "Logo uploaded",
        description: "Company logo has been updated",
      });
    },
    onError: (error: any) => {
      console.error("Failed to upload logo:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload company logo. Please ensure you have admin or finance manager permissions.",
        variant: "destructive",
      });
    },
  });
}
