import React from "react";
import { CrudListScreen } from "@/src/components/CrudListScreen";
import { api } from "@/src/services/api";
import { EmployeeForm } from "@/src/components/forms/EmployeeForm";
import { useAppSelector } from "@/src/store";

export default function ManagerStaffScreen() {
  const { token } = useAppSelector((s) => s.auth);

  return (
    <CrudListScreen
      titleKey="sidebar.staff"
      fetchFn={() => api.employees.list({}, token!)}
      createFn={(data) => api.employees.create(data, token!)}
      updateFn={(id, data) => api.employees.update(id, data, token!)}
      FormComponent={EmployeeForm}
      getItemTitle={(item) =>
        `${item.firstName ?? ""} ${item.lastName ?? ""}`.trim() || "Staff"
      }
      getItemSubtitle={(item) => item.phone ?? item.login ?? ""}
    />
  );
}
