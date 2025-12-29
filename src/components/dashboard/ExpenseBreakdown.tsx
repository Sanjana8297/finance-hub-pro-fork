import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

const data = [
  { name: "Marketing", value: 25000, color: "hsl(241, 44%, 32%)" },
  { name: "Operations", value: 18000, color: "hsl(241, 44%, 45%)" },
  { name: "Payroll", value: 42000, color: "hsl(241, 44%, 55%)" },
  { name: "Technology", value: 15000, color: "hsl(199, 89%, 48%)" },
  { name: "Travel", value: 8000, color: "hsl(38, 92%, 50%)" },
  { name: "Other", value: 5000, color: "hsl(220, 15%, 70%)" },
];

export function ExpenseBreakdown() {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Expense Breakdown</CardTitle>
        <p className="text-sm text-muted-foreground">By category this month</p>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(0, 0%, 100%)',
                  border: '1px solid hsl(220, 15%, 90%)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-muted-foreground">{item.name}</span>
              <span className="ml-auto text-sm font-medium">
                {((item.value / total) * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
