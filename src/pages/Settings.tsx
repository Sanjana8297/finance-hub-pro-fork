import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Building2,
  Upload,
  Save,
  Bell,
  Shield,
  CreditCard,
  Globe,
  Mail,
  Loader2,
  GitBranch,
  TrendingUp,
} from "lucide-react";
import { ApprovalChainManager } from "@/components/expenses/ApprovalChainManager";
import { AnomalyReviewManager } from "@/components/expenses/AnomalyReviewManager";
import { AnomalyDetectionSettings } from "@/components/settings/AnomalyDetectionSettings";
import { useCompany, useUpdateCompany, useUploadCompanyLogo } from "@/hooks/useCompany";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Key, Phone } from "lucide-react";

const Settings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") || "company";
  const { data: company, isLoading } = useCompany();
  const updateCompany = useUpdateCompany();
  const uploadLogo = useUploadCompanyLogo();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [logoVersion, setLogoVersion] = useState(0);

  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (profile) {
      setProfileData({
        fullName: profile.full_name || "",
        email: profile.email || "",
        phone: profile.phone || "",
      });
    }
  }, [profile]);

  const [formData, setFormData] = useState({
    name: "",
    tax_id: "",
    gstin: "",
    pan: "",
    email: "",
    phone: "",
    address: "",
    website: "",
    currency: "INR",
    timezone: "UTC",
    bank_name: "",
    bank_account_number: "",
    bank_ifsc: "",
    bank_account_type: "",
    bank_branch: "",
    email_sender_name: "",
    email_reply_to: "",
    resend_api_key: "",
  });

  const prevLogoUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || "",
        tax_id: company.tax_id || "",
        gstin: (company as any).gstin || "",
        pan: (company as any).pan || "",
        email: company.email || "",
        phone: company.phone || "",
        address: company.address || "",
        website: company.website || "",
        currency: company.currency || "INR",
        timezone: company.timezone || "UTC",
        bank_name: (company as any).bank_name || "",
        bank_account_number: (company as any).bank_account_number || "",
        bank_ifsc: (company as any).bank_ifsc || "",
        bank_account_type: (company as any).bank_account_type || "",
        bank_branch: (company as any).bank_branch || "",
        email_sender_name: (company as any).email_sender_name || "FinanceHub",
        email_reply_to: (company as any).email_reply_to || "",
        resend_api_key: (company as any).resend_api_key || "",
      });
      // Update logo version only when logo_url actually changes
      if (company.logo_url && company.logo_url !== prevLogoUrlRef.current) {
        setLogoVersion((prev) => prev + 1);
        prevLogoUrlRef.current = company.logo_url;
      }
    }
  }, [company]);

  const handleSaveCompanyProfile = () => {
    if (!company?.id) return;
    updateCompany.mutate({
      id: company.id,
      ...formData,
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !company?.id) return;
    uploadLogo.mutate(
      { companyId: company.id, file },
      {
        onSuccess: () => {
          // Force logo refresh by updating version
          setLogoVersion((prev) => prev + 1);
          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        },
      }
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleUpdateProfile = async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profileData.fullName,
          phone: profileData.phone || null,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "New password and confirm password do not match.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      toast({
        title: "Password updated",
        description: "Your password has been successfully updated.",
      });

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      toast({
        title: "Password update failed",
        description: error.message || "Failed to update password. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your company settings and preferences
        </p>
      </div>

      <Tabs 
        value={tabParam} 
        onValueChange={(value) => {
          setSearchParams({ tab: value });
        }}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="approvals" className="gap-2">
            <GitBranch className="h-4 w-4" />
            Approval Chains
          </TabsTrigger>
          <TabsTrigger value="anomalies" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Anomaly Detection
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Profile Settings */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>
                    Update your personal details and contact information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage
                        src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.email || 'user'}`}
                      />
                      <AvatarFallback>
                        {profile?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <Button variant="outline">
                      Change Avatar
                    </Button>
                  </div>
                  <Separator />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="profile-fullName">Full Name</Label>
                      <Input
                        id="profile-fullName"
                        value={profileData.fullName}
                        onChange={(e) =>
                          setProfileData((prev) => ({ ...prev, fullName: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profile-email">Email</Label>
                      <Input
                        id="profile-email"
                        type="email"
                        value={profileData.email}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        Email cannot be changed
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profile-phone">Phone</Label>
                      <Input
                        id="profile-phone"
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) =>
                          setProfileData((prev) => ({ ...prev, phone: e.target.value }))
                        }
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleUpdateProfile}>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Change Password */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Change Password
                  </CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input
                        id="current-password"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleChangePassword}>
                      <Key className="mr-2 h-4 w-4" />
                      Update Password
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Account Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">User ID</p>
                    <p className="font-mono text-xs">{user?.id || "N/A"}</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Member Since</p>
                    <p className="text-sm">
                      {profile?.created_at
                        ? new Date(profile.created_at).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="company">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Profile
              </CardTitle>
              <CardDescription>
                Update your company information for invoices and receipts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-20 rounded-xl" />
                  <div className="grid gap-4 sm:grid-cols-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    {company?.logo_url ? (
                      <img
                        key={`${company.logo_url}-${logoVersion}`} // Force re-render when logo changes
                        src={`${company.logo_url}?v=${logoVersion}&t=${Date.now()}`}
                        alt="Company logo"
                        className="h-20 w-20 rounded-xl object-cover"
                        onError={(e) => {
                          // If image fails to load, try without cache busting
                          const target = e.target as HTMLImageElement;
                          if (target.src.includes('?v=')) {
                            target.src = company.logo_url || '';
                          }
                        }}
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-primary/10 text-2xl font-bold text-primary">
                        {getInitials(formData.name || "FH")}
                      </div>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleLogoUpload}
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadLogo.isPending}
                    >
                      {uploadLogo.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="mr-2 h-4 w-4" />
                      )}
                      Upload Logo
                    </Button>
                  </div>
                  <Separator />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, name: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="taxId">Tax ID / VAT Number</Label>
                      <Input
                        id="taxId"
                        value={formData.tax_id}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, tax_id: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gstin">GSTIN</Label>
                      <Input
                        id="gstin"
                        value={formData.gstin}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, gstin: e.target.value }))
                        }
                        placeholder="36ADEFS9619N2ZA"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pan">PAN</Label>
                      <Input
                        id="pan"
                        value={formData.pan}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, pan: e.target.value }))
                        }
                        placeholder="ADEFS9619N"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, email: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, phone: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, address: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={formData.website}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, website: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Bank Details</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="bankName">Bank Name</Label>
                        <Input
                          id="bankName"
                          value={formData.bank_name}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, bank_name: e.target.value }))
                          }
                          placeholder="AXIS BANK"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bankAccountNumber">Account Number</Label>
                        <Input
                          id="bankAccountNumber"
                          value={formData.bank_account_number}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, bank_account_number: e.target.value }))
                          }
                          placeholder="1234567890"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bankIFSC">IFSC Code</Label>
                        <Input
                          id="bankIFSC"
                          value={formData.bank_ifsc}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, bank_ifsc: e.target.value }))
                          }
                          placeholder="UTIB0001234"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bankAccountType">Account Type</Label>
                        <Select
                          value={formData.bank_account_type}
                          onValueChange={(value) =>
                            setFormData((prev) => ({ ...prev, bank_account_type: value }))
                          }
                        >
                          <SelectTrigger id="bankAccountType">
                            <SelectValue placeholder="Select account type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Current">Current</SelectItem>
                            <SelectItem value="Savings">Savings</SelectItem>
                            <SelectItem value="OD">OD (Overdraft)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="bankBranch">Bank Branch</Label>
                        <Input
                          id="bankBranch"
                          value={formData.bank_branch}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, bank_branch: e.target.value }))
                          }
                          placeholder="Branch name and address"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSaveCompanyProfile}
                      disabled={updateCompany.isPending}
                    >
                      {updateCompany.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Invoice Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Invoice Settings
              </CardTitle>
              <CardDescription>
                Configure invoice numbering and tax settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                  <Input id="invoicePrefix" defaultValue="INV-" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nextNumber">Next Invoice Number</Label>
                  <Input id="nextNumber" defaultValue="2024-007" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultTax">Default Tax Rate (%)</Label>
                  <Input id="defaultTax" type="number" defaultValue="20" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentTerms">Default Payment Terms (days)</Label>
                  <Input id="paymentTerms" type="number" defaultValue="30" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Localization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Localization
              </CardTitle>
              <CardDescription>
                Set your timezone and currency preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, currency: value }))
                    }
                  >
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR - Indian Rupee (₹)</SelectItem>
                      <SelectItem value="USD">USD - US Dollar ($)</SelectItem>
                      <SelectItem value="EUR">EUR - Euro (€)</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound (£)</SelectItem>
                      <SelectItem value="JPY">JPY - Japanese Yen (¥)</SelectItem>
                      <SelectItem value="AUD">AUD - Australian Dollar (A$)</SelectItem>
                      <SelectItem value="CAD">CAD - Canadian Dollar (C$)</SelectItem>
                      <SelectItem value="SGD">SGD - Singapore Dollar (S$)</SelectItem>
                      <SelectItem value="AED">AED - UAE Dirham (د.إ)</SelectItem>
                      <SelectItem value="SAR">SAR - Saudi Riyal (﷼)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input
                    id="timezone"
                    value={formData.timezone}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, timezone: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Input id="dateFormat" defaultValue="MM/DD/YYYY" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fiscalYear">Fiscal Year Start</Label>
                  <Input id="fiscalYear" defaultValue="January" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveCompanyProfile} disabled={updateCompany.isPending}>
                  {updateCompany.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive email updates</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Invoice Reminders</p>
                  <p className="text-sm text-muted-foreground">Auto-send payment reminders</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Expense Approvals</p>
                  <p className="text-sm text-muted-foreground">Notify on pending approvals</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Payroll Alerts</p>
                  <p className="text-sm text-muted-foreground">Payroll processing alerts</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Two-Factor Auth</p>
                  <p className="text-sm text-muted-foreground">Extra security layer</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Session Timeout</p>
                  <p className="text-sm text-muted-foreground">Auto-logout after 30 min</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <Button variant="outline" className="w-full">
                Change Password
              </Button>
            </CardContent>
          </Card>

          {/* Email Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Settings
              </CardTitle>
              <CardDescription>
                Configure email sender information and Resend API settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="emailSenderName">Sender Name</Label>
                  <Input
                    id="emailSenderName"
                    value={formData.email_sender_name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, email_sender_name: e.target.value }))
                    }
                    placeholder="FinanceHub"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailReplyTo">Reply-To Email</Label>
                  <Input
                    id="emailReplyTo"
                    type="email"
                    value={formData.email_reply_to}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, email_reply_to: e.target.value }))
                    }
                    placeholder="support@financehub.com"
                  />
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Resend API Configuration</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="resendApiKey">Resend API Key</Label>
                    <Input
                      id="resendApiKey"
                      type="password"
                      value={formData.resend_api_key}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, resend_api_key: e.target.value }))
                      }
                      placeholder="re_xxxxxxxxxxxxx"
                    />
                    <p className="text-sm text-muted-foreground">
                      Get your API key from{" "}
                      <a 
                        href="https://resend.com/api-keys" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        resend.com/api-keys
                      </a>
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                    <p className="text-sm font-medium">Email Sending Domain</p>
                    <p className="text-sm text-muted-foreground">
                      Make sure you have verified your domain in Resend. The "from" email must use a verified domain.
                      You can verify domains at{" "}
                      <a 
                        href="https://resend.com/domains" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        resend.com/domains
                      </a>
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveCompanyProfile}
                  disabled={updateCompany.isPending}
                >
                  {updateCompany.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Email Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
        </TabsContent>

        <TabsContent value="approvals">
          <ApprovalChainManager />
        </TabsContent>

        <TabsContent value="anomalies" className="space-y-6">
          <AnomalyDetectionSettings />
          <AnomalyReviewManager />
        </TabsContent>

      </Tabs>
    </DashboardLayout>
  );
};

export default Settings;
