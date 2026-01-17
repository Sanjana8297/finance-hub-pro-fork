import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import {
  Employee,
  useCreateEmployee,
  useUpdateEmployee,
} from "@/hooks/useEmployees";

interface EmployeeDialogProps {
  employee?: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmployeeDialog({
  employee,
  open,
  onOpenChange,
}: EmployeeDialogProps) {
  const isEditing = !!employee;
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    employee_number: "",
    department: "",
    position: "",
    location: "",
    hire_date: new Date().toISOString().split("T")[0],
    salary: "",
    status: "active" as string,
  });

  useEffect(() => {
    if (open) {
      if (employee) {
        setFormData({
          full_name: employee.full_name || "",
          email: employee.email || "",
          phone: employee.phone || "",
          employee_number: employee.employee_number || "",
          department: employee.department || "",
          position: employee.position || "",
          location: employee.location || "",
          hire_date: employee.hire_date || new Date().toISOString().split("T")[0],
          salary: employee.salary?.toString() || "",
          status: employee.status || "active",
        });
      } else {
        setFormData({
          full_name: "",
          email: "",
          phone: "",
          employee_number: "",
          department: "",
          position: "",
          location: "",
          hire_date: new Date().toISOString().split("T")[0],
          salary: "",
          status: "active",
        });
      }
    }
  }, [open, employee]);

  const handleSubmit = async () => {
    if (!formData.full_name || !formData.email) {
      return;
    }

    const employeeData = {
      full_name: formData.full_name,
      email: formData.email,
      phone: formData.phone || null,
      employee_number: formData.employee_number || null,
      department: formData.department || null,
      position: formData.position || null,
      location: formData.location || null,
      hire_date: formData.hire_date || null,
      salary: formData.salary ? parseFloat(formData.salary) : null,
      status: formData.status || "active",
    };

    if (isEditing && employee) {
      await updateEmployee.mutateAsync({
        id: employee.id,
        employee: employeeData,
      });
    } else {
      await createEmployee.mutateAsync(employeeData);
    }

    onOpenChange(false);
  };

  const isPending = createEmployee.isPending || updateEmployee.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Employee" : "Add Employee"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the employee details below"
              : "Fill in the details to add a new employee"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Basic Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, full_name: e.target.value }))
                  }
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="john.doe@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employee_number">Employee Number</Label>
                <Input
                  id="employee_number"
                  value={formData.employee_number}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, employee_number: e.target.value }))
                  }
                  placeholder="EMP-001"
                />
              </div>
            </div>
          </div>

          {/* Job Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Job Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, department: e.target.value }))
                  }
                  placeholder="Engineering"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, position: e.target.value }))
                  }
                  placeholder="Senior Developer"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, location: e.target.value }))
                  }
                  placeholder="New York"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hire_date">Hire Date</Label>
                <Input
                  id="hire_date"
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, hire_date: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Compensation & Status */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Compensation & Status</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="salary">Salary</Label>
                <Input
                  id="salary"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.salary}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, salary: e.target.value }))
                  }
                  placeholder="100000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on-leave">On Leave</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Update Employee" : "Add Employee"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
