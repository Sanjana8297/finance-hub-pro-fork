import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const Settings = () => {
  const { data: company, isLoading } = useCompany();
  const updateCompany = useUpdateCompany();
  const uploadLogo = useUploadCompanyLogo();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    tax_id: "",
    email: "",
    phone: "",
    address: "",
    website: "",
    currency: "USD",
    timezone: "UTC",
  });

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || "",
        tax_id: company.tax_id || "",
        email: company.email || "",
        phone: company.phone || "",
        address: company.address || "",
        website: company.website || "",
        currency: company.currency || "USD",
        timezone: company.timezone || "UTC",
      });
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
    uploadLogo.mutate({ companyId: company.id, file });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList>
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
                        src={company.logo_url}
                        alt="Company logo"
                        className="h-20 w-20 rounded-xl object-cover"
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
                  <Input
                    id="currency"
                    value={formData.currency}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, currency: e.target.value }))
                    }
                  />
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
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="senderName">Sender Name</Label>
                <Input id="senderName" defaultValue={formData.name || "FinanceHub"} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="replyTo">Reply-To Email</Label>
                <Input id="replyTo" defaultValue={formData.email || "support@financehub.com"} />
              </div>
              <Button variant="outline" className="w-full">
                Configure SMTP
              </Button>
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
