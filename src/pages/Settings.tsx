import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Building2,
  Upload,
  Save,
  Bell,
  Shield,
  CreditCard,
  Globe,
  Mail,
} from "lucide-react";

const Settings = () => {
  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your company settings and preferences
        </p>
      </div>

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
                Update your company information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-primary/10 text-2xl font-bold text-primary">
                  FH
                </div>
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Logo
                </Button>
              </div>
              <Separator />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input id="companyName" defaultValue="FinanceHub Inc." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxId">Tax ID / VAT Number</Label>
                  <Input id="taxId" defaultValue="US-123456789" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="contact@financehub.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" defaultValue="+1 (555) 123-4567" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" defaultValue="123 Business Ave, New York, NY 10001" />
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
                  <Input id="currency" defaultValue="USD ($)" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input id="timezone" defaultValue="America/New_York (EST)" />
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
                <Button>
                  <Save className="mr-2 h-4 w-4" />
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
                <Input id="senderName" defaultValue="FinanceHub" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="replyTo">Reply-To Email</Label>
                <Input id="replyTo" defaultValue="support@financehub.com" />
              </div>
              <Button variant="outline" className="w-full">
                Configure SMTP
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
