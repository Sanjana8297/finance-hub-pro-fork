import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  Save, 
  RotateCcw, 
  Loader2,
  AlertTriangle,
  Copy,
  Clock,
  Zap,
  DollarSign,
  Calendar
} from "lucide-react";
import { useAnomalySettings, useUpdateAnomalySettings, useResetAnomalySettings } from "@/hooks/useAnomalySettings";

export function AnomalyDetectionSettings() {
  const { data: settings, isLoading } = useAnomalySettings();
  const updateSettings = useUpdateAnomalySettings();
  const resetSettings = useResetAnomalySettings();

  const [formData, setFormData] = useState({
    high_amount_threshold_percent: 200,
    duplicate_window_hours: 24,
    rapid_succession_minutes: 30,
    approval_threshold_percent: 90,
    round_amount_threshold: 100,
    weekend_detection_enabled: true,
    is_active: true,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        high_amount_threshold_percent: settings.high_amount_threshold_percent,
        duplicate_window_hours: settings.duplicate_window_hours,
        rapid_succession_minutes: settings.rapid_succession_minutes,
        approval_threshold_percent: settings.approval_threshold_percent,
        round_amount_threshold: settings.round_amount_threshold,
        weekend_detection_enabled: settings.weekend_detection_enabled,
        is_active: settings.is_active,
      });
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings.mutate(formData);
  };

  const handleReset = () => {
    resetSettings.mutate();
  };

  const updateField = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Anomaly Detection Settings
            </CardTitle>
            <CardDescription>Configure thresholds for automatic expense anomaly detection</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="enabled" className="text-sm">Detection Enabled</Label>
            <Switch
              id="enabled"
              checked={formData.is_active}
              onCheckedChange={(checked) => updateField("is_active", checked)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* High Amount Detection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <Label className="text-base font-medium">High Amount Detection</Label>
          </div>
          <p className="text-sm text-muted-foreground">
            Flag expenses that exceed this percentage of the category average
          </p>
          <div className="flex items-center gap-4">
            <Input
              type="number"
              min="100"
              max="1000"
              value={formData.high_amount_threshold_percent}
              onChange={(e) => updateField("high_amount_threshold_percent", parseInt(e.target.value) || 200)}
              className="w-32"
            />
            <span className="text-muted-foreground">% of category average</span>
          </div>
        </div>

        <Separator />

        {/* Duplicate Detection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Copy className="h-4 w-4 text-yellow-500" />
            <Label className="text-base font-medium">Duplicate Detection</Label>
          </div>
          <p className="text-sm text-muted-foreground">
            Flag expenses with the same amount and description within this time window
          </p>
          <div className="flex items-center gap-4">
            <Input
              type="number"
              min="1"
              max="168"
              value={formData.duplicate_window_hours}
              onChange={(e) => updateField("duplicate_window_hours", parseInt(e.target.value) || 24)}
              className="w-32"
            />
            <span className="text-muted-foreground">hours</span>
          </div>
        </div>

        <Separator />

        {/* Rapid Succession Detection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-orange-500" />
            <Label className="text-base font-medium">Rapid Succession Detection</Label>
          </div>
          <p className="text-sm text-muted-foreground">
            Flag when multiple expenses are submitted within this time period
          </p>
          <div className="flex items-center gap-4">
            <Input
              type="number"
              min="5"
              max="120"
              value={formData.rapid_succession_minutes}
              onChange={(e) => updateField("rapid_succession_minutes", parseInt(e.target.value) || 30)}
              className="w-32"
            />
            <span className="text-muted-foreground">minutes</span>
          </div>
        </div>

        <Separator />

        {/* Near Approval Threshold */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <Label className="text-base font-medium">Near Approval Threshold</Label>
          </div>
          <p className="text-sm text-muted-foreground">
            Flag expenses that are suspiciously close to approval limits
          </p>
          <div className="flex items-center gap-4">
            <Input
              type="number"
              min="70"
              max="99"
              value={formData.approval_threshold_percent}
              onChange={(e) => updateField("approval_threshold_percent", parseInt(e.target.value) || 90)}
              className="w-32"
            />
            <span className="text-muted-foreground">% of approval limit</span>
          </div>
        </div>

        <Separator />

        {/* Round Amount Detection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-500" />
            <Label className="text-base font-medium">Round Amount Detection</Label>
          </div>
          <p className="text-sm text-muted-foreground">
            Flag suspiciously round amounts above this threshold
          </p>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">$</span>
            <Input
              type="number"
              min="50"
              max="10000"
              step="50"
              value={formData.round_amount_threshold}
              onChange={(e) => updateField("round_amount_threshold", parseInt(e.target.value) || 100)}
              className="w-32"
            />
            <span className="text-muted-foreground">minimum</span>
          </div>
        </div>

        <Separator />

        {/* Weekend Detection */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-500" />
              <Label className="text-base font-medium">Weekend Expense Detection</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Flag expenses submitted or dated on weekends
            </p>
          </div>
          <Switch
            checked={formData.weekend_detection_enabled}
            onCheckedChange={(checked) => updateField("weekend_detection_enabled", checked)}
          />
        </div>

        <Separator />

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={resetSettings.isPending}
          >
            {resetSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} disabled={updateSettings.isPending}>
            {updateSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
